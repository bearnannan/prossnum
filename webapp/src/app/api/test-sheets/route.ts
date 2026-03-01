import { NextResponse } from "next/server";
import { sheets } from "@/lib/google-sheets";

export async function GET() {
    try {
        // Attempt to access basic spreadsheet properties just to verify authentication works.
        // We don't read data here since GOOGLE_SHEET_ID might be a placeholder,
        // but the auth client will still be created and initialized.

        // Check if the environment variables are actually populated. No need to make an API call if they aren't.
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            return NextResponse.json(
                { error: "Google API credentials are not set in environment variables." },
                { status: 500 }
            );
        }

        // Try to get token to verify credentials are valid
        const { google } = await import("googleapis");
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            },
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
        const authClient = await auth.getClient();
        const token = await authClient.getAccessToken();

        return NextResponse.json({
            success: true,
            message: "Successfully authenticated with Google Service Account.",
            clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        });
    } catch (error: any) {
        console.error("Test Sheets API Error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
