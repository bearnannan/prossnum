import { NextResponse } from "next/server";
import { createLineFlexMessage } from "@/lib/incidents/flex-message";
import { sendLineNotification } from "@/lib/incidents/line-client";
import { incidentRecordToPayload, parseIncomingPayload, payloadToIncidentInsert } from "@/lib/incidents/payload";
import { recordLineAttempt } from "@/lib/incidents/notification-attempts";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

async function readPayload(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return req.json();
  }
  return req.text();
}

export async function POST(req: Request) {
  const correlationId = crypto.randomUUID();

  try {
    const rawPayload = await readPayload(req);
    const payload = parseIncomingPayload(rawPayload);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("incidents")
      .insert([payloadToIncidentInsert(payload, "webhook")])
      .select()
      .single();

    if (error) {
      throw error;
    }

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

    const statusCode = lineResponse.status === "success" ? 200 : lineResponse.statusCode || 502;
    return NextResponse.json(
      {
        status: lineResponse.status,
        message: lineResponse.message,
        incident: data,
        correlationId,
      },
      { status: statusCode }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook error";
    console.error(JSON.stringify({ event: "incident_webhook_error", correlationId, message }));
    return NextResponse.json(
      { status: "error", message, correlationId },
      { status: 400 }
    );
  }
}
