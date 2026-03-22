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
    lat: number;            // lat (Column C)
    lon: number;            // lon (Column D)
    poleHeight: string;     // ความสูงเสา (Column E)
    electricProgress: number; // ระบบไฟฟ้า (%)
    electricMain: string;   // ระยะสาย Main
    groundProgress: number;   // ระบบกราวด์ (%)
    groundAC: string;       // AC Ω
    groundEquip: string;    // Equip Ω
    feederProgress: number; // สาย Feeder (%)
    yagiNo: string;         // Yagi No
    sn: string;             // SN
    feedDistance: string;   // ระยะ feed
    towerProgress: number;  // การติดตั้งอุปกรณ์บนเสา (%)
    radioProgress: number;  // การติดตั้งเครื่องวิทยุฯ (%)
    linkProgress: number;   // การทดสอบสัญญาณ (%)
    radioSN: string;        // SN เครื่องวิทยุ MT680 Plus (col 18)
    batterySN: string;      // SN แบตเตอรี่ 50AH (col 19)
    rssi: string;           // ค่า RSSI dBm (col 20)
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

// Helper to fetch and parse CSV from public URL
async function fetchPublishedCsv(sheetType: string): Promise<any[][]> {
    const baseUrl = process.env.PUBLISHED_SHEET_URL;
    const gid = sheetType === "client" ? process.env.GID_CLIENT_SYSTEM : process.env.GID_STATION_DATA;
    
    if (!baseUrl) {
        console.error("PUBLISHED_SHEET_URL is not set");
        return [];
    }

    const url = `${baseUrl}&gid=${gid}`;
    console.log("Fetching CSV from:", url);

    try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }
        const csvText = await response.text();
        
        // Simple manual CSV parser handles quotes and escaped characters
        const lines = csvText.split(/\r?\n/);
        const result: any[][] = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            
            const row: string[] = [];
            let inQuotes = false;
            let start = 0;
            
            for (let j = 0; j < line.length; j++) {
                if (line[j] === '"') {
                    inQuotes = !inQuotes;
                } else if (line[j] === ',' && !inQuotes) {
                    row.push(line.substring(start, j).replace(/^"|"$/g, '').trim());
                    start = j + 1;
                }
            }
            row.push(line.substring(start).replace(/^"|"$/g, '').trim());
            result.push(row);
        }
        
        // Return without headers (skip first row)
        return result.slice(1);
    } catch (error) {
        console.error("CSV Fetch Error:", error);
        throw error;
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sheetType = searchParams.get("sheet") || "station";

        // Try to fetch from published CSV first as a robust fallback
        let rows: any[][] = [];
        try {
            rows = await fetchPublishedCsv(sheetType);
        } catch (csvError) {
            console.warn("Failed to fetch from published CSV, falling back to API...", csvError);
            // Fallback to Google Sheets API if configured
            const sheetId = getSpreadsheetId();
            const sheetName = sheetType === "client" ? "ClientSystem" : "station_data_template";
            const range = sheetType === "client" ? `${sheetName}!A2:W` : `${sheetName}!A2:K`;
            rows = await getSheetData(range, sheetId) || [];
        }

        if (!rows || rows.length === 0) {
            return NextResponse.json({ data: [] });
        }

        // Updated Mapping based on user's spreadsheet structure (CSV index starts at 0 for column A)
        if (sheetType === "client") {
            const data: ClientSystemData[] = rows.map((row: any[], index: number) => ({
                district: row[0] || "",
                stationName: row[1] || "",
                lat: parseFloat(String(row[2]).replace(/,/g, '')) || 0,
                lon: parseFloat(String(row[3]).replace(/,/g, '')) || 0,
                poleHeight: row[4] || "",
                electricProgress: parseFloat(String(row[5]).replace(/,/g, '')) || 0,
                electricMain: row[6] || "",
                groundProgress: parseFloat(String(row[7]).replace(/,/g, '')) || 0,
                groundAC: row[8] || "",
                groundEquip: row[9] || "",
                feederProgress: parseFloat(String(row[10]).replace(/,/g, '')) || 0,
                yagiNo: row[11] || "",
                sn: row[12] || "",
                feedDistance: row[13] || "",
                towerProgress: parseFloat(String(row[14]).replace(/,/g, '')) || 0,
                radioProgress: parseFloat(String(row[15]).replace(/,/g, '')) || 0,
                linkProgress: parseFloat(String(row[16]).replace(/,/g, '')) || 0,
                radioSN: row[16] || "", // Column Q
                batterySN: row[17] || "", // Column R
                rssi: row[18] || "", // Column S
                remark: row[19] || "", // Column T
                startDate: formatDateForUI(row[20] || ""), // Column U
                endDate: formatDateForUI(row[21] || ""), // Column V
                rowIndex: index + 2
            }));
            return NextResponse.json({ data });
        } else {
            const data: StationData[] = rows.map((row: any[], index: number) => ({
                district: row[0] || "",
                stationName: row[1] || "",
                type: "Client", // Default type
                foundationProgress: parseFloat(String(row[14]).replace(/,/g, '')) || 0, 
                poleInstallationProgress: parseFloat(String(row[14]).replace(/,/g, '')) || 0,
                lat: parseFloat(String(row[2]).replace(/,/g, '')) || 0,
                lon: parseFloat(String(row[3]).replace(/,/g, '')) || 0,
                poleHeight: row[4] || "",
                startDate: formatDateForUI(row[20] || ""), // Column U
                endDate: formatDateForUI(row[21] || ""), // Column V
                remark: row[19] || "", // Column T
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
        const sheetName = sheetType === "client" ? "ClientSystem" : "station_data_template";
        const range = `${sheetName}!A:W`;

        let values: any[][] = [];

        if (sheetType === "client") {
            const data = body as ClientSystemData;
            values = [[
                data.district,
                data.stationName,
                data.lat || 0,
                data.lon || 0,
                data.poleHeight || "",
                data.electricProgress,
                data.electricMain,
                data.groundProgress,
                data.groundAC,
                data.groundEquip,
                data.feederProgress,
                data.yagiNo,
                data.sn,
                data.feedDistance,
                data.towerProgress,
                data.radioProgress,
                data.linkProgress,
                data.radioSN || "",
                data.batterySN || "",
                data.rssi || "",
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
        const sheetName = sheetType === "client" ? "ClientSystem" : "station_data_template";
        const range = sheetType === "client" 
            ? `${sheetName}!A${body.rowIndex}:W${body.rowIndex}`
            : `${sheetName}!A${body.rowIndex}:K${body.rowIndex}`;

        let values: any[][] = [];

        if (sheetType === "client") {
            const data = body as ClientSystemData;
            values = [[
                data.district,
                data.stationName,
                data.lat || 0,
                data.lon || 0,
                data.poleHeight || "",
                data.electricProgress,
                data.electricMain,
                data.groundProgress,
                data.groundAC,
                data.groundEquip,
                data.feederProgress,
                data.yagiNo,
                data.sn,
                data.feedDistance,
                data.towerProgress,
                data.radioProgress,
                data.linkProgress,
                data.radioSN || "",
                data.batterySN || "",
                data.rssi || "",
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

