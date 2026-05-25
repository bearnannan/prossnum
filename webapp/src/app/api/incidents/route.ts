import { NextResponse } from "next/server";
import { createLineFlexMessage } from "@/lib/incidents/flex-message";
import { sendLineNotification } from "@/lib/incidents/line-client";
import { incidentInputToPayload, incidentRecordToPayload, payloadToIncidentInsert } from "@/lib/incidents/payload";
import { recordLineAttempt } from "@/lib/incidents/notification-attempts";
import { getAppUser } from "@/lib/server-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getRequestAuditContext, logActivity } from "@/lib/activity-logger";
import type { IncidentInput } from "@/lib/incidents/types";

export async function GET(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("incidents")
      .select("*")
      .order("reported_at", { ascending: false });

    if (status && status !== "all") query = query.eq("repair_status", status);
    if (priority && priority !== "all") query = query.eq("priority", priority);
    if (search) {
      query = query.or(
        `incident_no.ilike.%${search}%,station.ilike.%${search}%,reporter.ilike.%${search}%,issue_description.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch incidents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const requestContext = getRequestAuditContext(req);
  const user = await getAppUser();
  if (!user) {
    await logActivity({
      ...requestContext,
      eventType: "security",
      eventName: "incident_create_unauthorized",
      statusCode: 401,
      targetType: "incident",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const correlationId = crypto.randomUUID();

  try {
    const input = (await req.json()) as IncidentInput;
    const payload = incidentInputToPayload(input);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("incidents")
      .insert([payloadToIncidentInsert(payload, user.id)])
      .select()
      .single();

    if (error) throw error;

    const notificationPayload = incidentRecordToPayload(data);
    const lineResponse = await sendLineNotification(createLineFlexMessage(notificationPayload), correlationId, notificationPayload, {
      incidentId: data.id,
    });
    await recordLineAttempt({
      incidentId: data.id,
      correlationId,
      response: lineResponse,
      channel: "line_primary",
    });
    await supabase
      .from("incidents")
      .update({
        line_notification_sent_at:
          lineResponse.status === "success" ? new Date().toISOString() : null,
        line_notification_error:
          lineResponse.status === "error" ? lineResponse.message : null,
      })
      .eq("id", data.id);

    await logActivity({
      ...requestContext,
      user,
      eventType: "mission_control",
      eventName: "incident_created",
      statusCode: 201,
      targetType: "incident",
      targetLabel: data.incident_no || data.id,
      targetId: data.id,
      metadata: {
        incidentNo: data.incident_no,
        assetType: data.asset_type,
        assetId: data.asset_id,
        priority: data.priority,
        repairStatus: data.repair_status,
        lineStatus: lineResponse.status,
        correlationId,
      },
    });

    return NextResponse.json(
      {
        data,
        line: lineResponse,
        correlationId,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create incident";
    await logActivity({
      ...requestContext,
      user,
      eventType: "mission_control",
      eventName: "incident_create_failed",
      statusCode: 500,
      targetType: "incident",
      metadata: {
        message,
        correlationId,
      },
    });
    return NextResponse.json({ error: message, correlationId }, { status: 500 });
  }
}
