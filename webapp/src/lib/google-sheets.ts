import { google } from "googleapis";

// Initialize the Google Sheets client
const getAuthClient = () => {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!email) {
        console.error("GOOGLE_SERVICE_ACCOUNT_EMAIL is not set");
        throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL is not configured");
    }

    if (!privateKey) {
        console.error("GOOGLE_PRIVATE_KEY is not set");
        throw new Error("GOOGLE_PRIVATE_KEY is not configured");
    }

    // Advanced cleaning of the private key
    // 1. Remove literal quotes if they exist
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    
    // 2. Convert literal \n or escaped \\n to actual newlines
    const formattedKey = privateKey.replace(/\\n/g, "\n");

    try {
        return new google.auth.GoogleAuth({
            credentials: {
                client_email: email,
                private_key: formattedKey,
            },
            scopes: [
                "https://www.googleapis.com/auth/spreadsheets", // Full read/write access
            ],
        });
    } catch (authError: any) {
        console.error("Failed to initialize Google Auth:", authError.message);
        throw authError;
    }
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
