import { cookies } from "next/headers";
import { auth } from "@/auth";
import { type AppRole, resolveCredentialRole, resolveLineRole } from "@/lib/rbac";

export interface AppUser {
  id: string;
  name: string | null;
  email: string | null;
  source: "authjs" | "auth_session";
  role: AppRole;
}

interface CookieSession {
  district?: unknown;
  name?: unknown;
  email?: unknown;
  role?: unknown;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export async function getAppUser(): Promise<AppUser | null> {
  const session = await auth();
  if (session?.user) {
    const id = session.user.id || session.user.email || "authjs-user";
    return {
      id,
      name: session.user.name || null,
      email: session.user.email || null,
      source: "authjs",
      role: session.user.role || resolveLineRole({
        id,
        email: session.user.email,
        name: session.user.name,
      }),
    };
  }

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get("auth_session")?.value;
  if (!rawCookie) return null;

  try {
    const parsed = JSON.parse(rawCookie) as CookieSession;
    const district = readString(parsed.district);
    const name = readString(parsed.name) || district || "Authenticated User";
    const email = readString(parsed.email);
    const parsedRole = parsed.role === "admin" || parsed.role === "user" ? parsed.role : null;

    return {
      id: district || email || "auth-session-user",
      name,
      email,
      source: "auth_session",
      role: parsedRole || resolveCredentialRole(district || email),
    };
  } catch {
    return {
      id: "auth-session-user",
      name: "Authenticated User",
      email: null,
      source: "auth_session",
      role: "user",
    };
  }
}
