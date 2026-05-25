import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRequestAuditContext, logActivity } from "@/lib/activity-logger";
import { getAppUser } from "@/lib/server-auth";

export async function POST(req: Request) {
    const requestContext = getRequestAuditContext(req);
    const user = await getAppUser();
    try {
        const cookieStore = await cookies();
        cookieStore.delete('auth_session');
        cookieStore.delete('authjs.session-token');
        cookieStore.delete('__Secure-authjs.session-token');
        cookieStore.delete('__Host-authjs.session-token');
        cookieStore.getAll()
            .filter((cookie) =>
                cookie.name.startsWith('authjs.session-token') ||
                cookie.name.startsWith('__Secure-authjs.session-token') ||
                cookie.name.startsWith('__Host-authjs.session-token')
            )
            .forEach((cookie) => cookieStore.delete(cookie.name));

        await logActivity({
            ...requestContext,
            user,
            eventType: "logout",
            eventName: "session_logout",
            statusCode: 200,
        });

        return NextResponse.json({ success: true, message: "Logged out successfully" });
    } catch (error: any) {
        console.error("Logout Error:", error);
        await logActivity({
            ...requestContext,
            user,
            eventType: "security",
            eventName: "logout_error",
            statusCode: 500,
            metadata: {
                message: error instanceof Error ? error.message : "Internal server error during logout",
            },
        });
        return NextResponse.json(
            { error: "Internal server error during logout" },
            { status: 500 }
        );
    }
}
