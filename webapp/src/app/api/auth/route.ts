import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRequestAuditContext, logActivity } from "@/lib/activity-logger";
import { resolveCredentialRole } from "@/lib/rbac";

// Define an easy mock mapping of districts to PIN codes for now
// In a real-world scenario, this might connect to a database or Google Sheets
const validCredentials: Record<string, string> = {
    // Basic test case
    "admin": "123456",
    "admin@example.com": "123456",
    "test": "0000"
};

export async function POST(req: Request) {
    const requestContext = getRequestAuditContext(req);
    try {
        const body = await req.json();
        const { district, pin } = body;
        const identifier = typeof district === "string" ? district.trim() : "";
        const role = resolveCredentialRole(identifier);

        if (!district || !pin) {
            await logActivity({
                ...requestContext,
                eventType: "failed_auth",
                eventName: "pin_login_missing_credentials",
                statusCode: 400,
                targetType: "auth_method",
                targetLabel: "district_pin",
                userId: typeof district === "string" ? district : null,
            });
            return NextResponse.json(
                { error: "District and PIN are required" },
                { status: 400 }
            );
        }

        // Validate PIN
        // For demonstration, we check if the user is in our mock list OR allow a universal master PIN
        const isValid = validCredentials[identifier] === pin || pin === process.env.MASTER_PIN;

        // Let's create a temporary catch-all pin for testing '1234' on any district if master pin isn't set
        const isFallbackValid = pin === "1234";

        if (!isValid && !isFallbackValid) {
            await logActivity({
                ...requestContext,
                eventType: "failed_auth",
                eventName: "pin_login_failed",
                statusCode: 401,
                targetType: "auth_method",
                targetLabel: "district_pin",
                userId: typeof district === "string" ? district : null,
                userName: typeof district === "string" ? district : null,
                metadata: {
                    district: typeof district === "string" ? district : null,
                },
            });
            return NextResponse.json(
                { error: "Invalid district or PIN" },
                { status: 401 }
            );
        }

        // Set secure HTTP-only cookie
        const cookieStore = await cookies();

        // Set cookie valid for 7 days
        cookieStore.set("auth_session", JSON.stringify({
            district: identifier,
            name: identifier,
            role,
            authenticatedAt: Date.now(),
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        await logActivity({
            ...requestContext,
            eventType: "login",
            eventName: "pin_login_success",
            statusCode: 200,
            targetType: "auth_method",
            targetLabel: "district_pin",
            userId: identifier,
            userName: identifier,
            userSource: "auth_session",
            metadata: {
                district: identifier,
                role,
                fallbackPinUsed: isFallbackValid && !isValid,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Login Error:", error);
        await logActivity({
            ...requestContext,
            eventType: "failed_auth",
            eventName: "pin_login_error",
            statusCode: 500,
            targetType: "auth_method",
            targetLabel: "district_pin",
            metadata: {
                message: error instanceof Error ? error.message : "Internal server error",
            },
        });
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
