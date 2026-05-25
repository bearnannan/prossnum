import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { AppUser } from "@/lib/server-auth";

export type ActivityEventType =
  | "page_view"
  | "navigation"
  | "button_click"
  | "login"
  | "logout"
  | "failed_auth"
  | "mission_control"
  | "settings_change"
  | "export_download"
  | "security";

export interface ActivityLogInput {
  eventType: ActivityEventType;
  eventName: string;
  user?: AppUser | null;
  userId?: string | null;
  userName?: string | null;
  userSource?: string | null;
  sessionId?: string | null;
  route?: string | null;
  referrer?: string | null;
  targetType?: string | null;
  targetLabel?: string | null;
  targetId?: string | null;
  httpMethod?: string | null;
  statusCode?: number | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
}

function cleanText(value: string | null | undefined, maxLength = 500) {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function normalizeIp(value: string | null | undefined) {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  if (!first || first === "::1" || first === "127.0.0.1") return null;
  return first;
}

export function getRequestAuditContext(req: Request) {
  const headers = req.headers;
  return {
    route: new URL(req.url).pathname,
    referrer: cleanText(headers.get("referer"), 1000),
    userAgent: cleanText(headers.get("user-agent"), 1000),
    ipAddress: normalizeIp(headers.get("x-forwarded-for") || headers.get("x-real-ip")),
    httpMethod: req.method,
  };
}

export async function logActivity(input: ActivityLogInput) {
  try {
    const userId = input.user?.id ?? input.userId ?? null;
    const userName = input.user?.name ?? input.userName ?? null;
    const userSource = input.user?.source ?? input.userSource ?? null;

    const { error } = await getSupabaseAdmin().from("user_activity_logs").insert({
      event_type: input.eventType,
      event_name: input.eventName,
      user_id: cleanText(userId, 200),
      user_name: cleanText(userName, 200),
      user_source: cleanText(userSource, 80),
      session_id: cleanText(input.sessionId, 200),
      route: cleanText(input.route, 1000),
      referrer: cleanText(input.referrer, 1000),
      target_type: cleanText(input.targetType, 120),
      target_label: cleanText(input.targetLabel, 500),
      target_id: cleanText(input.targetId, 200),
      http_method: cleanText(input.httpMethod, 20),
      status_code: input.statusCode ?? null,
      ip_address: normalizeIp(input.ipAddress),
      user_agent: cleanText(input.userAgent, 1000),
      metadata: input.metadata || {},
    });

    if (error) console.error("Failed to write activity log:", error);
  } catch (error) {
    console.error("Activity logging exception:", error);
  }
}
