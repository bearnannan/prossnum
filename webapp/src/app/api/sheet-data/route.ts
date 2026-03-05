import { NextResponse } from "next/server";
import { getSheetData, getSpreadsheetId, sheets } from "@/lib/google-sheets";

export interface StationData {
    district: string;       // อำเภอ
    stationName: string;   // ชื่อสถานีลูกข่าย
    type: string;          // Type
    foundationProgress: number; // ความคืบหน้าฐานราก (%)
    poleInstallationProgress: number; // งานติดตั้งเสา (%)
    lat: number;           // lat
    lon: number;           // lon
    poleHeight?: string;   // ความสูงเสา
    startDate?: string;    // วันที่เริ่มงาน
    remark?: string;       // หมายเหตุ
    rowIndex?: number;     // For updating specific rows
}

export async function GET() {
    try {
        console.log("PRIVATE KEY FORMAT DEBUG:",
            JSON.stringify(process.env.GOOGLE_PRIVATE_KEY).substring(0, 50),
            "Length:", process.env.GOOGLE_PRIVATE_KEY?.length
        );
        const sheetId = getSpreadsheetId();
        // Omitting sheet name defaults to the first visible sheet
        const range = "A2:J"; // A to J covers all 10 columns

        const rows = await getSheetData(range, sheetId);

        if (!rows || rows.length === 0) {
            return NextResponse.json({ data: [] });
        }

        const data: StationData[] = rows.map((row: any[], index: number) => ({
            district: row[0] || "",
            stationName: row[1] || "",
            type: row[2] || "",
            foundationProgress: parseFloat(row[3]) || 0,
            poleInstallationProgress: parseFloat(row[4]) || 0,
            lat: parseFloat(row[5]) || 0,
            lon: parseFloat(row[6]) || 0,
            poleHeight: row[7] || "",
            startDate: row[8] || "",
            remark: row[9] || "",
            rowIndex: index + 2 // Assuming data starts at row 2 in the sheet
        }));

        return NextResponse.json({ data });

    } catch (error: any) {
        console.error("Error in GET /api/sheet-data:", error);
        return NextResponse.json(
            { error: "Failed to fetch data from Google Sheets", details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body: StationData = await req.json();
        const sheetId = getSpreadsheetId();
        const range = "A:J"; // Append anywhere in these columns

        // Convert the object into an array of values matching the column order
        const values = [
            [
                body.district,
                body.stationName,
                body.type,
                body.foundationProgress,
                body.poleInstallationProgress,
                body.lat,
                body.lon,
                body.poleHeight || "",
                body.startDate || "",
                body.remark || ""
            ]
        ];

        await getSheetData(range, sheetId); // just for pinging, we'll actually use append

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values,
            },
        });

        return NextResponse.json({ success: true, updatedRange: response.data.updates?.updatedRange });
    } catch (error: any) {
        console.error("Error in POST /api/sheet-data:", error);
        return NextResponse.json(
            { error: "Failed to append data to Google Sheets", details: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        const body: StationData = await req.json();

        if (!body.rowIndex) {
            return NextResponse.json({ error: "Missing rowIndex for update operation" }, { status: 400 });
        }

        const sheetId = getSpreadsheetId();
        // Target the specific row index
        const range = `A${body.rowIndex}:J${body.rowIndex}`;

        // Convert the object into an array of values matching the column order
        const values = [
            [
                body.district,
                body.stationName,
                body.type,
                body.foundationProgress,
                body.poleInstallationProgress,
                body.lat,
                body.lon,
                body.poleHeight || "",
                body.startDate || "",
                body.remark || ""
            ]
        ];

        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values,
            },
        });

        return NextResponse.json({ success: true, updatedRange: response.data.updatedRange });
    } catch (error: any) {
        console.error("Error in PUT /api/sheet-data:", error);
        return NextResponse.json(
            { error: "Failed to update data in Google Sheets", details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const body = await req.json();

        if (!body.rowIndex) {
            return NextResponse.json({ error: "Missing rowIndex for delete operation" }, { status: 400 });
        }

        const sheetId = getSpreadsheetId();

        // First, we need to get the sheet's actual ID (gid) to use with batchUpdate.
        // Assuming we are operating on the first sheet (index 0).
        const spreadsheetInfo = await sheets.spreadsheets.get({
            spreadsheetId: sheetId,
        });

        const firstSheetId = spreadsheetInfo.data.sheets?.[0]?.properties?.sheetId;

        // batchUpdate uses 0-based indexing for rows.
        // If our Frontend sends rowIndex=2 (meaning row 2 in the sheet UI), 
        // startIndex should be 1, and endIndex should be 2.
        const rowToDelete = body.rowIndex - 1;

        const request = {
            spreadsheetId: sheetId,
            resource: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: firstSheetId,
                                dimension: "ROWS",
                                startIndex: rowToDelete,
                                endIndex: rowToDelete + 1
                            }
                        }
                    }
                ]
            }
        };

        await sheets.spreadsheets.batchUpdate(request);

        return NextResponse.json({ success: true, message: "Row deleted successfully" });
    } catch (error: any) {
        console.error("Error in DELETE /api/sheet-data:", error);
        return NextResponse.json(
            { error: "Failed to delete data from Google Sheets", details: error.message },
            { status: 500 }
        );
    }
}
