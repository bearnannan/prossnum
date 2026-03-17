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
    endDate?: string;      // วันที่เสร็จงาน
    remark?: string;       // หมายเหตุ
    rowIndex?: number;     // For updating specific rows
}

export interface ClientSystemData {
    district: string;       // อำเภอ
    stationName: string;   // ชื่อสถานีลูกข่าย
    electricProgress: number; // ระบบไฟฟ้า (%)
    electricMain: string;   // ระยะสาย Main
    groundProgress: number;   // ระบบกราวด์ (%)
    lat: number;            // lat (Column F)
    lon: number;            // lon (Column G)
    groundAC: string;       // AC Ω
    groundEquip: string;    // Equip Ω
    feederProgress: number; // สาย Feeder (%)
    yagiNo: string;         // Yagi No
    sn: string;             // SN
    feedDistance: string;   // ระยะ feed
    remark?: string;        // งานเพิ่มเติม / ปัญหาอุปสรรค
    startDate?: string;     // วันที่เริ่มงาน
    endDate?: string;       // วันที่เสร็จงาน
    rowIndex?: number;      // For updating specific rows
}

// Normalize date from Google Sheet (DD/MM/YY) to HTML Date Input (YYYY-MM-DD)
function formatDateForUI(dateStr: string): string {
    if (!dateStr || !dateStr.includes("/")) return "";
    const [day, month, year] = dateStr.split("/");
    // Assume year 2000+ for YY format
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Normalize date from HTML Date Input (YYYY-MM-DD) to Google Sheet (DD/MM/YY)
function formatDateForSheet(dateStr: string): string {
    if (!dateStr || !dateStr.includes("-")) return dateStr;
    const [year, month, day] = dateStr.split("-");
    const shortYear = year.slice(-2);
    return `${day}/${month}/${shortYear}`;
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sheetType = searchParams.get("sheet") || "station";
        const sheetId = getSpreadsheetId();
        
        // Define ranges based on sheet type
        // Station: A-K (11 columns)
        // ClientSystem: A-N (14 columns)
        const sheetName = sheetType === "client" ? "ClientSystem" : "station_data_template";
        const range = sheetType === "client" ? `${sheetName}!A2:P` : `${sheetName}!A2:K`;

        const rows = await getSheetData(range, sheetId);

        if (!rows || rows.length === 0) {
            return NextResponse.json({ data: [] });
        }

        if (sheetType === "client") {
            const data: ClientSystemData[] = rows.map((row: any[], index: number) => ({
                district: row[0] || "",
                stationName: row[1] || "",
                electricProgress: parseFloat(row[2]) || 0,
                electricMain: row[3] || "",
                groundProgress: parseFloat(row[4]) || 0,
                lat: parseFloat(row[5]) || 0,
                lon: parseFloat(row[6]) || 0,
                groundAC: row[7] || "",
                groundEquip: row[8] || "",
                feederProgress: parseFloat(row[9]) || 0,
                yagiNo: row[10] || "",
                sn: row[11] || "",
                feedDistance: row[12] || "",
                remark: row[13] || "",
                startDate: formatDateForUI(row[14] || ""),
                endDate: formatDateForUI(row[15] || ""),
                rowIndex: index + 2
            }));
            return NextResponse.json({ data });
        } else {
            const data: StationData[] = rows.map((row: any[], index: number) => ({
                district: row[0] || "",
                stationName: row[1] || "",
                type: row[2] || "",
                foundationProgress: parseFloat(row[3]) || 0,
                poleInstallationProgress: parseFloat(row[4]) || 0,
                lat: parseFloat(row[5]) || 0,
                lon: parseFloat(row[6]) || 0,
                poleHeight: row[7] || "",
                startDate: formatDateForUI(row[8] || ""),
                endDate: formatDateForUI(row[9] || ""),
                remark: row[10] || "",
                rowIndex: index + 2
            }));
            return NextResponse.json({ data });
        }

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
        const { searchParams } = new URL(req.url);
        const sheetType = searchParams.get("sheet") || "station";
        const body = await req.json();
        const sheetId = getSpreadsheetId();
        const sheetName = sheetType === "client" ? "ClientSystem" : "Sheet1";
        const range = `${sheetName}!A:N`;

        let values: any[][] = [];

        if (sheetType === "client") {
            const data = body as ClientSystemData;
            values = [[
                data.district,
                data.stationName,
                data.electricProgress,
                data.electricMain,
                data.groundProgress,
                data.lat || 0,
                data.lon || 0,
                data.groundAC,
                data.groundEquip,
                data.feederProgress,
                data.yagiNo,
                data.sn,
                data.feedDistance,
                data.remark || "",
                formatDateForSheet(data.startDate || ""),
                formatDateForSheet(data.endDate || "")
            ]];
        } else {
            const data = body as StationData;
            values = [[
                data.district,
                data.stationName,
                data.type,
                data.foundationProgress,
                data.poleInstallationProgress,
                data.lat,
                data.lon,
                data.poleHeight || "",
                formatDateForSheet(data.startDate || ""),
                formatDateForSheet(data.endDate || ""),
                data.remark || ""
            ]];
        }

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
        const { searchParams } = new URL(req.url);
        const sheetType = searchParams.get("sheet") || "station";
        const body = await req.json();

        if (!body.rowIndex) {
            return NextResponse.json({ error: "Missing rowIndex for update operation" }, { status: 400 });
        }

        const sheetId = getSpreadsheetId();
        const sheetName = sheetType === "client" ? "ClientSystem" : "Sheet1";
        const range = sheetType === "client" 
            ? `${sheetName}!A${body.rowIndex}:N${body.rowIndex}`
            : `${sheetName}!A${body.rowIndex}:K${body.rowIndex}`;

        let values: any[][] = [];

        if (sheetType === "client") {
            const data = body as ClientSystemData;
            values = [[
                data.district,
                data.stationName,
                data.electricProgress,
                data.electricMain,
                data.groundProgress,
                data.lat || 0,
                data.lon || 0,
                data.groundAC,
                data.groundEquip,
                data.feederProgress,
                data.yagiNo,
                data.sn,
                data.feedDistance,
                data.remark || "",
                formatDateForSheet(data.startDate || ""),
                formatDateForSheet(data.endDate || "")
            ]];
        } else {
            const data = body as StationData;
            values = [[
                data.district,
                data.stationName,
                data.type,
                data.foundationProgress,
                data.poleInstallationProgress,
                data.lat,
                data.lon,
                data.poleHeight || "",
                formatDateForSheet(data.startDate || ""),
                formatDateForSheet(data.endDate || ""),
                data.remark || ""
            ]];
        }

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
        const { searchParams } = new URL(req.url);
        const sheetType = searchParams.get("sheet") || "station";
        const body = await req.json();

        if (!body.rowIndex) {
            return NextResponse.json({ error: "Missing rowIndex for delete operation" }, { status: 400 });
        }

        const sheetId = getSpreadsheetId();
        const spreadsheetInfo = await sheets.spreadsheets.get({
            spreadsheetId: sheetId,
        });

        // Find the sheetId (gid) by title
        const sheetName = sheetType === "client" ? "ClientSystem" : "Sheet1";
        const sheet = spreadsheetInfo.data.sheets?.find(s => s.properties?.title === sheetName);
        const actualSheetId = sheet?.properties?.sheetId;

        if (actualSheetId === undefined) {
            throw new Error(`Sheet "${sheetName}" not found`);
        }

        const rowToDelete = body.rowIndex - 1;

        const request = {
            spreadsheetId: sheetId,
            resource: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: actualSheetId,
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

