import { google } from "googleapis";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

async function checkSheets() {
    if (!spreadsheetId) {
        console.error("GOOGLE_SHEET_ID missing");
        return;
    }
    try {
        const response = await sheets.spreadsheets.get({ spreadsheetId });
        console.log("Sheets in spreadsheet:");
        response.data.sheets?.forEach(s => {
            console.log(`- ${s.properties?.title}`);
        });
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

checkSheets();
