import * as fs from "fs";
import { google } from "googleapis";

// Manually parse .env.local
const envFile = fs.readFileSync(".env.local", "utf8");
const envVars: Record<string, string> = {};
envFile.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let key = match[1].trim();
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1).replace(/\\n/g, "\n");
        }
        envVars[key] = val;
    }
});

async function run() {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: envVars.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: envVars.GOOGLE_PRIVATE_KEY,
            },
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
        
        const client = await auth.getClient();
        
        const sheets = google.sheets({ version: "v4", auth: client as any });
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: envVars.GOOGLE_SHEET_ID,
            range: "ระบบลูกข่าย!A1:Z5",
        });
        
        console.log("Headers:", response.data.values ? response.data.values[0] : "No data");
        // console.log("Row 1:", response.data.values ? response.data.values[1] : "No data");
    } catch (e) {
        console.error(e);
    }
}

run();
