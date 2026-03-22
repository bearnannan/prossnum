import { getSheetData, getSpreadsheetId } from "./src/lib/google-sheets";

async function test() {
  try {
    console.log("Testing Google Sheets API connection...");
    console.log("Spreadsheet ID:", getSpreadsheetId());
    const data = await getSheetData("ClientSystem!A2:W");
    console.log("Data length:", data?.length);
    console.log("First row preview:", data?.[0]);
  } catch (err) {
    console.error("Failed to fetch data:", err);
  }
}

test();
