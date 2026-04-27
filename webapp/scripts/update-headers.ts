import { google } from "googleapis";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

async function updateHeaders() {
    if (!spreadsheetId) {
        console.error("GOOGLE_SHEET_ID missing");
        return;
    }
    try {
        const headers = [
            "อำเภอ",
            "ชื่อสถานีลูกข่าย",
            "lat",
            "lon",
            "ความสูงเสา",
            "ระบบไฟฟ้า (%)",
            "ระยะสาย Main",
            "ระบบกราวด์ (%)",
            "AC Ω",
            "Equip Ω",
            "สาย Feeder (%)",
            "Yagi No",
            "SN",
            "ระยะ feed",
            "อุปกรณ์บนเสา (%)",
            "เครื่องวิทยุ (%)",
            "ทดสอบสัญญาณ (%)",
            "SN เครื่องวิทยุ MT680 Plus",
            "SN แบตเตอรี่ 50AH",
            "ค่า RSSI dBm",
            "งานเพิ่มเติม / ปัญหาอุปสรรค",
            "วันที่เริ่มงาน",
            "วันที่เสร็จงาน"
        ];

        console.log("Updating headers for 'ClientSystem'...");
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: "ClientSystem!A1:W1",
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [headers],
            },
        });
        console.log("Headers updated successfully.");
    } catch (e: any) {
        console.error("Error:", e.response?.data || e.message);
    }
}

updateHeaders();
