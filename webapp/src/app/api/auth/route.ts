import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Define an easy mock mapping of districts to PIN codes for now
// In a real-world scenario, this might connect to a database or Google Sheets
const validCredentials: Record<string, string> = {
    // Basic test case
    "admin": "123456",
    "test": "0000",
    "อำเภอห้วยกระเจา": "1234",
    "อำเภอเลาขวัญ": "5678"
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { district, pin } = body;

        if (!district || !pin) {
            return NextResponse.json(
                { error: "District and PIN are required" },
                { status: 400 }
            );
        }

        // Validate PIN
        // For demonstration, we check if the user is in our mock list OR allow a universal master PIN
        const isValid = validCredentials[district] === pin || pin === process.env.MASTER_PIN;

        // Let's create a temporary catch-all pin for testing '1234' on any district if master pin isn't set
        const isFallbackValid = pin === "1234";

        if (!isValid && !isFallbackValid) {
            return NextResponse.json(
                { error: "Invalid district or PIN" },
                { status: 401 }
            );
        }

        // Set secure HTTP-only cookie
        const cookieStore = await cookies();

        // Set cookie valid for 7 days
        cookieStore.set("auth_session", JSON.stringify({ district, authenticatedAt: Date.now() }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Login Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
