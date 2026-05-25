import { NextResponse } from "next/server";
import { getAppUser, type AppUser } from "@/lib/server-auth";
import { isAdminRole } from "@/lib/rbac";

export async function requireAppUser(): Promise<
  | { user: AppUser; response?: never }
  | { user?: never; response: NextResponse }
> {
  const user = await getAppUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}

export async function requireAdminUser(): Promise<
  | { user: AppUser; response?: never }
  | { user?: never; response: NextResponse }
> {
  const user = await getAppUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!isAdminRole(user.role)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}
