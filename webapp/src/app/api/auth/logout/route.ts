import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('auth_session');
        cookieStore.delete('authjs.session-token');
        cookieStore.delete('__Secure-authjs.session-token');

        return NextResponse.json({ success: true, message: "Logged out successfully" });
    } catch (error: any) {
        console.error("Logout Error:", error);
        return NextResponse.json(
            { error: "Internal server error during logout" },
            { status: 500 }
        );
    }
}
