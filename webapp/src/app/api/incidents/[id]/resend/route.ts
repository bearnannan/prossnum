import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/server-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { incidentRecordToPayload } from "@/lib/incidents/payload";
import { createLineFlexMessage } from "@/lib/incidents/flex-message";
import { sendLineNotification } from "@/lib/incidents/line-client";
import { recordLineAttempt } from "@/lib/incidents/notification-attempts";
import { getRequestAuditContext, logActivity } from "@/lib/activity-logger";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestContext = getRequestAuditContext(req);
  const user = await getAppUser();
  if (!user) {
    await logActivity({
      ...requestContext,
      eventType: "security",
      eventName: "incident_notification_retry_unauthorized",
      statusCode: 401,
      targetType: "incident",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const correlationId = crypto.randomUUID();

  try {
    const supabase = getSupabaseAdmin();
    
    // 1. Fetch incident from Supabase
    const { data: incident, error: fetchError } = await supabase
      .from("incidents")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !incident) {
      await logActivity({
        ...requestContext,
        user,
        eventType: "mission_control",
        eventName: "incident_notification_retry_missing_incident",
        statusCode: 404,
        targetType: "incident",
        targetId: id,
        metadata: {
          correlationId,
        },
      });
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    // 2. Parse record to notification payload
    const payload = incidentRecordToPayload(incident);

    // 3. Create Flex Message and dispatch push notification
    // Pass the payload as the 3rd argument to enable automated fallback email dispatch on quota block!
    const lineResponse = await sendLineNotification(
      createLineFlexMessage(payload),
      correlationId,
      payload,
      { incidentId: id }
    );
    await recordLineAttempt({
      incidentId: id,
      correlationId,
      response: lineResponse,
      channel: "manual_resend",
    });

    // 4. Update incident row with the dispatch audit outcome
    await supabase
      .from("incidents")
      .update({
        line_notification_sent_at:
          lineResponse.status === "success" ? new Date().toISOString() : null,
        line_notification_error:
          lineResponse.status === "error" ? lineResponse.message : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (lineResponse.status === "error") {
      const statusCode =
        lineResponse.statusCode && lineResponse.statusCode >= 400 && lineResponse.statusCode < 600
          ? lineResponse.statusCode
          : 400;

      await logActivity({
        ...requestContext,
        user,
        eventType: "mission_control",
        eventName: "incident_notification_retry_failed",
        statusCode,
        targetType: "incident",
        targetLabel: incident.incident_no || id,
        targetId: id,
        metadata: {
          incidentNo: incident.incident_no,
          lineStatus: lineResponse.status,
          message: lineResponse.message,
          correlationId,
        },
      });

      return NextResponse.json({
        success: false,
        error: lineResponse.message,
        line: lineResponse,
        correlationId,
      }, { status: statusCode });
    }

    await logActivity({
      ...requestContext,
      user,
      eventType: "mission_control",
      eventName: "incident_notification_retried",
      statusCode: 200,
      targetType: "incident",
      targetLabel: incident.incident_no || id,
      targetId: id,
      metadata: {
        incidentNo: incident.incident_no,
        lineStatus: lineResponse.status,
        correlationId,
      },
    });

    return NextResponse.json({
      success: true,
      line: lineResponse,
      correlationId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resend incident notification";
    await logActivity({
      ...requestContext,
      user,
      eventType: "mission_control",
      eventName: "incident_notification_retry_error",
      statusCode: 500,
      targetType: "incident",
      targetId: id,
      metadata: {
        message,
        correlationId,
      },
    });
    return NextResponse.json({ error: message, correlationId }, { status: 500 });
  }
}
