import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const startedAt = Date.now();
  const checks: Record<string, unknown> = {};
  let status: "success" | "degraded" = "success";

  try {
    const supabase = getSupabaseAdmin();

    const settings = await supabase.from("system_settings").select("key").limit(1);
    checks.systemSettings = settings.error
      ? { ok: false, message: settings.error.message }
      : { ok: true };
    if (settings.error) status = "degraded";

    const incidents = await supabase
      .from("incidents")
      .select("id", { count: "exact", head: true });
    checks.incidents = incidents.error
      ? { ok: false, message: incidents.error.message }
      : { ok: true, count: incidents.count || 0 };
    if (incidents.error) status = "degraded";

    const missingCoordinates = await supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .or("latitude.is.null,longitude.is.null");
    checks.missingCoordinates = missingCoordinates.error
      ? { ok: false, message: missingCoordinates.error.message }
      : { ok: true, count: missingCoordinates.count || 0 };
    if (missingCoordinates.error) status = "degraded";

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const failedAttempts = await supabase
      .from("incident_notification_attempts")
      .select("id", { count: "exact", head: true })
      .eq("status", "error")
      .gte("created_at", since);
    checks.failedNotificationAttempts24h = failedAttempts.error
      ? { ok: false, message: failedAttempts.error.message }
      : { ok: true, count: failedAttempts.count || 0 };
    if (failedAttempts.error) status = "degraded";

    const latestAttempt = await supabase
      .from("incident_notification_attempts")
      .select("channel,status,message,status_code,created_at,correlation_id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    checks.latestNotificationAttempt = latestAttempt.error
      ? { ok: false, message: latestAttempt.error.message }
      : { ok: true, data: latestAttempt.data || null };
    if (latestAttempt.error) status = "degraded";

    return NextResponse.json({
      status,
      service: "incident-notification-system",
      latencyMs: Date.now() - startedAt,
      checks,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        service: "incident-notification-system",
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "Unknown health check error",
        checks,
      },
      { status: 503 }
    );
  }
}
