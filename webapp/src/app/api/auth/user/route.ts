import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAppUser();
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to get authenticated user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
