import { NextResponse } from "next/server";
import { createLineFlexMessage } from "@/lib/incidents/flex-message";
import { sendLineNotification } from "@/lib/incidents/line-client";
import { incidentRecordToPayload, normalizePriorityForUpdate } from "@/lib/incidents/server";
import { recordLineAttempt } from "@/lib/incidents/notification-attempts";
import { COMPLETED_STATUS } from "@/lib/incidents/sla";
import { getAppUser } from "@/lib/server-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getRequestAuditContext, logActivity } from "@/lib/activity-logger";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, context: RouteContext) {
  const requestContext = getRequestAuditContext(req);
  const user = await getAppUser();
  if (!user) {
    await logActivity({
      ...requestContext,
      eventType: "security",
      eventName: "incident_update_unauthorized",
      statusCode: 401,
      targetType: "incident",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const correlationId = crypto.randomUUID();

  try {
    const { id } = await context.params;
    const body = (await req.json()) as Record<string, unknown>;
    const supabase = getSupabaseAdmin();

    const { data: existing, error: fetchError } = await supabase
      .from("incidents")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (existing.repair_status === COMPLETED_STATUS) {
      await logActivity({
        ...requestContext,
        user,
        eventType: "mission_control",
        eventName: "incident_update_blocked_completed",
        statusCode: 409,
        targetType: "incident",
        targetLabel: existing.incident_no || id,
        targetId: id,
        metadata: {
          correlationId,
          currentStatus: existing.repair_status,
        },
      });
      return NextResponse.json(
        { error: "Completed incidents are locked and cannot be edited", correlationId },
        { status: 409 }
      );
    }

    const updatePayload = normalizePriorityForUpdate(body, existing);
    const { data, error } = await supabase
      .from("incidents")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    let line = null;
    if (
      typeof updatePayload.repair_status === "string" &&
      updatePayload.repair_status !== existing.repair_status
    ) {
      const notificationPayload = incidentRecordToPayload(data);
      line = await sendLineNotification(
        createLineFlexMessage(notificationPayload),
        correlationId,
        notificationPayload,
        { incidentId: id }
      );
      await recordLineAttempt({
        incidentId: id,
        correlationId,
        response: line,
        channel: "line_primary",
      });

      await supabase
        .from("incidents")
        .update({
          line_notification_sent_at: line.status === "success" ? new Date().toISOString() : null,
          line_notification_error: line.status === "error" ? line.message : null,
        })
        .eq("id", id);
    }

    await logActivity({
      ...requestContext,
      user,
      eventType: "mission_control",
      eventName: typeof updatePayload.repair_status === "string" &&
        updatePayload.repair_status !== existing.repair_status
          ? "incident_status_updated"
          : "incident_updated",
      statusCode: 200,
      targetType: "incident",
      targetLabel: data.incident_no || id,
      targetId: id,
      metadata: {
        incidentNo: data.incident_no,
        changedFields: Object.keys(updatePayload),
        previousStatus: existing.repair_status,
        nextStatus: data.repair_status,
        lineStatus: line && typeof line === "object" && "status" in line ? line.status : null,
        correlationId,
      },
    });

    return NextResponse.json({ data, line, correlationId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update incident";
    await logActivity({
      ...requestContext,
      user,
      eventType: "mission_control",
      eventName: "incident_update_failed",
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
