import { google } from "googleapis";

// Initialize the Google Sheets client with runtime secret validation
const getAuthClient = () => {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    // [SECURITY] Fail fast if critical secrets are missing — never expose values in logs
    if (!email) throw new Error("[google-sheets] GOOGLE_SERVICE_ACCOUNT_EMAIL is not configured.");
    if (!privateKey) throw new Error("[google-sheets] GOOGLE_PRIVATE_KEY is not configured.");

    return new google.auth.GoogleAuth({
        credentials: {
            client_email: email,
            private_key: privateKey,
        },
        scopes: [
            "https://www.googleapis.com/auth/spreadsheets",
        ],
    });
};

export const sheets = google.sheets({ version: "v4", auth: getAuthClient() });

// Helper to get the default spreadsheet ID from env
export const getSpreadsheetId = () => {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId || sheetId === "your-google-sheet-id-here") {
        throw new Error("GOOGLE_SHEET_ID is not configured in .env.local");
    }
    return sheetId;
};

// Example helper function to read data
export const getSheetData = async (range: string, spreadsheetId?: string) => {
    const id = spreadsheetId || getSpreadsheetId();
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: id,
            range,
        });
        return response.data.values;
    } catch (error) {
        console.error("Error fetching sheet data:", error);
        throw error;
    }
};

// Example helper function to append data
export const appendSheetData = async (range: string, values: any[][], spreadsheetId?: string) => {
    const id = spreadsheetId || getSpreadsheetId();
    try {
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: id,
            range,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error appending sheet data:", error);
        throw error;
    }
};
