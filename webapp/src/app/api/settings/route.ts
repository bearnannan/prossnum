import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/server-auth";
import { isAdminRole } from "@/lib/rbac";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getRequestAuditContext, logActivity } from "@/lib/activity-logger";
import {
  normalizeSystemSettings,
  readLocalSystemSettings,
  writeLocalSystemSettings,
  type SystemSettings,
} from "@/lib/incidents/settings-store";

export const dynamic = "force-dynamic";

const SETTINGS_KEYS = ["LINE_TOKEN", "GROUP_ID", "fallback_email_to"] as const;

function isSupabaseSettingsUnavailable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === "PGRST205" ||
    candidate.message?.includes("system_settings") ||
    candidate.message?.includes("SUPABASE_SERVICE_ROLE_KEY")
  );
}

async function readSupabaseSettings(): Promise<SystemSettings> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("system_settings")
    .select("key, value");

  if (error) throw error;

  const settingsMap = Object.fromEntries((data || []).map((item) => [item.key, item.value]));
  return normalizeSystemSettings(settingsMap);
}

async function writeSupabaseSettings(settings: SystemSettings) {
  const supabase = getSupabaseAdmin();
  const updates = SETTINGS_KEYS.map((key) => ({ key, value: settings[key] }));

  const { error } = await supabase
    .from("system_settings")
    .upsert(updates, { onConflict: "key" });

  if (error) throw error;
}

export async function GET() {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    return NextResponse.json(await readSupabaseSettings());
  } catch (error) {
    console.error("Failed to fetch system settings:", error);
    const settings = await readLocalSystemSettings();
    return NextResponse.json({
      ...settings,
      storage: "local_fallback",
      warning: isSupabaseSettingsUnavailable(error)
        ? "Settings table is not initialized in Supabase. Using local fallback storage."
        : "Unable to load Supabase settings. Using local fallback storage.",
    });
  }
}

export async function POST(req: Request) {
  const requestContext = getRequestAuditContext(req);
  const user = await getAppUser();
  if (!user) {
    await logActivity({
      ...requestContext,
      eventType: "security",
      eventName: "settings_update_unauthorized",
      statusCode: 401,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminRole(user.role)) {
    await logActivity({
      ...requestContext,
      user,
      eventType: "security",
      eventName: "settings_update_forbidden",
      statusCode: 403,
      targetType: "system_settings",
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const settings = normalizeSystemSettings(body);

    try {
      await writeSupabaseSettings(settings);
      await logActivity({
        ...requestContext,
        user,
        eventType: "settings_change",
        eventName: "system_settings_updated",
        statusCode: 200,
        targetType: "system_settings",
        targetLabel: "line_incident_notification_settings",
        metadata: {
          keys: SETTINGS_KEYS,
          storage: "supabase",
        },
      });
      return NextResponse.json({ success: true, message: "Settings updated successfully" });
    } catch (error) {
      if (!isSupabaseSettingsUnavailable(error)) throw error;

      console.warn("Supabase settings table unavailable; saving settings locally.", error);
      await writeLocalSystemSettings(settings);
      await logActivity({
        ...requestContext,
        user,
        eventType: "settings_change",
        eventName: "system_settings_updated_local_fallback",
        statusCode: 200,
        targetType: "system_settings",
        targetLabel: "line_incident_notification_settings",
        metadata: {
          keys: SETTINGS_KEYS,
          storage: "local_fallback",
        },
      });

      return NextResponse.json({
        success: true,
        storage: "local_fallback",
        message: "Settings saved locally because Supabase system_settings is not initialized",
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update system settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
