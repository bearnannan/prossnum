import { google } from "googleapis";

// Initialize the Google Sheets client
const getAuthClient = () => {
    return new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // Handle newlines in env variables
        },
        scopes: [
            "https://www.googleapis.com/auth/spreadsheets", // Full read/write access
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
