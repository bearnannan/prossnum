import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

async function compare() {
    if (!spreadsheetId) {
        console.error("GOOGLE_SHEET_ID missing");
        return;
    }

    try {
        // 1. Get Google Sheets counts
        const stationResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Stationdata!A2:B", // Columns A (District) and B (Station Name)
        });
        const clientResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "ClientSystem!A2:B",
        });

        const gStationCount = stationResponse.data.values?.length || 0;
        const gClientCount = clientResponse.data.values?.length || 0;

        // 2. Get Supabase counts
        const { count: sStationCount, error: sError } = await supabase
            .from('stations')
            .select('*', { count: 'exact', head: true });
        
        const { count: sClientCount, error: cError } = await supabase
            .from('client_systems')
            .select('*', { count: 'exact', head: true });

        if (sError || cError) throw sError || cError;

        console.log("--- Data Generation Report ---");
        console.log(`Station Data:   Google Sheets (${gStationCount}) vs Supabase (${sStationCount})`);
        console.log(`Client System: Google Sheets (${gClientCount}) vs Supabase (${sClientCount})`);
        
        if (gStationCount > (sStationCount || 0) || gClientCount > (sClientCount || 0)) {
            console.log("\n⚠️ MISMATCH DETECTED: Data is missing in Supabase!");
        } else {
            console.log("\n✅ COUNTS MATCH: No missing records based on row counts.");
        }

    } catch (e: any) {
        console.error("Error during comparison:", e.message);
    }
}

compare();
