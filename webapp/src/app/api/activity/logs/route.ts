import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/server-rbac";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getRequestAuditContext, logActivity } from "@/lib/activity-logger";

const EVENT_TYPES = new Set([
  "all",
  "page_view",
  "navigation",
  "button_click",
  "login",
  "logout",
  "failed_auth",
  "mission_control",
  "settings_change",
  "export_download",
  "security",
]);

function safeLimit(raw: string | null) {
  const parsed = Number(raw || 100);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(Math.max(Math.trunc(parsed), 1), 250);
}

export async function GET(req: Request) {
  const requestContext = getRequestAuditContext(req);
  const { user, response } = await requireAdminUser();
  if (response) {
    await logActivity({
      ...requestContext,
      eventType: "security",
      eventName: response.status === 403 ? "activity_logs_read_forbidden" : "activity_logs_read_unauthorized",
      statusCode: response.status,
      targetType: "user_activity_logs",
    });
    return response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get("eventType") || "all";
    const search = searchParams.get("search")?.trim() || "";
    const limit = safeLimit(searchParams.get("limit"));

    if (!EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }

    let query = getSupabaseAdmin()
      .from("user_activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (eventType !== "all") query = query.eq("event_type", eventType);
    if (search) {
      query = query.or(
        `event_name.ilike.%${search}%,user_name.ilike.%${search}%,user_id.ilike.%${search}%,route.ilike.%${search}%,target_label.ilike.%${search}%,target_type.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    await logActivity({
      ...requestContext,
      user,
      eventType: "security",
      eventName: "activity_logs_read",
      statusCode: 200,
      targetType: "user_activity_logs",
      metadata: { eventType, search: Boolean(search), limit },
    });

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load activity logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
