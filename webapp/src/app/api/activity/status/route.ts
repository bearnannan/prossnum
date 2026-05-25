import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/server-rbac";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { response } = await requireAdminUser();
  if (response) return response;

  const supabase = getSupabaseAdmin();
  const checks: Record<string, { ok: boolean; message: string; count?: number | null }> = {};

  const activityLogs = await supabase
    .from("user_activity_logs")
    .select("id", { count: "exact", head: true });

  checks.userActivityLogs = activityLogs.error
    ? { ok: false, message: activityLogs.error.message }
    : { ok: true, message: "user_activity_logs is queryable", count: activityLogs.count };

  const incidentNoPattern = await supabase
    .from("incidents")
    .select("incident_no")
    .like("incident_no", `INC-SHF-${new Date().getFullYear()}-%`)
    .limit(1);

  checks.incidentNumberPattern = incidentNoPattern.error
    ? { ok: false, message: incidentNoPattern.error.message }
    : {
        ok: true,
        message: incidentNoPattern.data?.length
          ? "At least one current-year INC-SHF incident exists"
          : "No current-year INC-SHF incident found yet; create a new incident after running Phase 4 SQL to confirm trigger output.",
        count: incidentNoPattern.data?.length || 0,
      };

  const legacyAudit = await supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true });

  checks.legacyAuditLogs = legacyAudit.error
    ? { ok: true, message: "legacy audit_logs is not queryable; runtime now writes to user_activity_logs" }
    : { ok: true, message: "legacy audit_logs exists; run Phase 5 SQL to backfill if needed", count: legacyAudit.count };

  return NextResponse.json({
    status: checks.userActivityLogs.ok ? "ready" : "missing_migration",
    checks,
  });
}
