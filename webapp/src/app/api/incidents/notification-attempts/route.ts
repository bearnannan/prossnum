import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/server-rbac";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type {
  NotificationAttemptChannel,
  NotificationAttemptRow,
  NotificationAttemptSummary,
} from "@/lib/incidents/notification-attempts";

const CHANNELS = new Set(["line_primary", "line_backup", "smtp_fallback", "manual_resend"]);
const STATUSES = new Set(["success", "error"]);

function parseLimit(value: string | null) {
  const parsed = Number(value || 100);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(Math.max(Math.floor(parsed), 1), 250);
}

function parseSince(value: string | null) {
  if (!value || value === "all") return null;
  const hours: Record<string, number> = {
    "1h": 1,
    "24h": 24,
    "7d": 24 * 7,
    "30d": 24 * 30,
  };
  const selectedHours = hours[value] || 24;
  return new Date(Date.now() - selectedHours * 60 * 60 * 1000).toISOString();
}

function normalizeAttempt(row: Record<string, unknown>): NotificationAttemptRow {
  const incident = Array.isArray(row.incidents) ? row.incidents[0] : row.incidents;
  return {
    id: String(row.id),
    incident_id: row.incident_id ? String(row.incident_id) : null,
    channel: row.channel as NotificationAttemptChannel,
    status: row.status === "success" ? "success" : "error",
    message: String(row.message || ""),
    status_code: typeof row.status_code === "number" ? row.status_code : null,
    correlation_id: row.correlation_id ? String(row.correlation_id) : null,
    token_source: row.token_source ? String(row.token_source) : null,
    created_at: String(row.created_at),
    incident: incident && typeof incident === "object" ? {
      id: String((incident as Record<string, unknown>).id || ""),
      incident_no: String((incident as Record<string, unknown>).incident_no || ""),
      station: String((incident as Record<string, unknown>).station || ""),
      asset_name: (incident as Record<string, unknown>).asset_name ? String((incident as Record<string, unknown>).asset_name) : null,
      repair_status: String((incident as Record<string, unknown>).repair_status || ""),
      priority: String((incident as Record<string, unknown>).priority || ""),
      line_notification_error: (incident as Record<string, unknown>).line_notification_error
        ? String((incident as Record<string, unknown>).line_notification_error)
        : null,
    } : null,
  };
}

function buildSummary(attempts: NotificationAttemptRow[]): NotificationAttemptSummary {
  const failed = attempts.filter((attempt) => attempt.status === "error").length;
  const success = attempts.filter((attempt) => attempt.status === "success").length;
  const since24h = Date.now() - 24 * 60 * 60 * 1000;
  const failed24h = attempts.filter(
    (attempt) => attempt.status === "error" && new Date(attempt.created_at).getTime() >= since24h
  ).length;
  const smtpFallback = attempts.filter((attempt) => attempt.channel === "smtp_fallback").length;
  const manualResend = attempts.filter((attempt) => attempt.channel === "manual_resend").length;
  const total = attempts.length;

  return {
    total,
    success,
    failed,
    failed24h,
    smtpFallback,
    manualResend,
    successRate: total > 0 ? Math.round((success / total) * 100) : 0,
  };
}

export async function GET(req: Request) {
  const { response } = await requireAdminUser();
  if (response) return response;

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseLimit(searchParams.get("limit"));
    const status = searchParams.get("status");
    const channel = searchParams.get("channel");
    const incidentId = searchParams.get("incidentId");
    const search = searchParams.get("search")?.trim();
    const since = parseSince(searchParams.get("since"));
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("incident_notification_attempts")
      .select(`
        id,
        incident_id,
        channel,
        status,
        message,
        status_code,
        correlation_id,
        token_source,
        created_at,
        incidents (
          id,
          incident_no,
          station,
          asset_name,
          repair_status,
          priority,
          line_notification_error
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && status !== "all" && STATUSES.has(status)) query = query.eq("status", status);
    if (channel && channel !== "all" && CHANNELS.has(channel)) query = query.eq("channel", channel);
    if (incidentId) query = query.eq("incident_id", incidentId);
    if (since) query = query.gte("created_at", since);

    const { data, error } = await query;
    if (error) throw error;

    let attempts = ((data || []) as Record<string, unknown>[]).map(normalizeAttempt);
    if (search) {
      const needle = search.toLowerCase();
      attempts = attempts.filter((attempt) => {
        const haystack = [
          attempt.message,
          attempt.correlation_id,
          attempt.incident?.incident_no,
          attempt.incident?.station,
          attempt.incident?.asset_name,
        ].join(" ").toLowerCase();
        return haystack.includes(needle);
      });
    }

    return NextResponse.json({
      data: attempts,
      summary: buildSummary(attempts),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load notification attempts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
