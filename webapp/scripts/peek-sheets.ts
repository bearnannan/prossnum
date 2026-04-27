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

async function checkRows() {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Stationdata!A1:Z5",
        });
        console.log("Headers:", response.data.values?.[0]);
        console.log("First row:", response.data.values?.[1]);
        
        const response2 = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "ClientSystem!A1:Z5",
        });
        console.log("Client Headers:", response2.data.values?.[0]);
        console.log("Client First row:", response2.data.values?.[1]);
    } catch (e: any) {
        console.error(e.message);
    }
}
checkRows();
