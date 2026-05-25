import { NextResponse } from "next/server";
import { logActivity, getRequestAuditContext, type ActivityEventType } from "@/lib/activity-logger";
import { getAppUser } from "@/lib/server-auth";

const CLIENT_EVENT_TYPES = new Set<ActivityEventType>([
  "page_view",
  "navigation",
  "button_click",
  "export_download",
  "failed_auth",
]);

function safeString(value: unknown) {
  return typeof value === "string" ? value : null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const eventType = safeString(body.eventType) as ActivityEventType | null;

    if (!eventType || !CLIENT_EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ error: "Unsupported activity event" }, { status: 400 });
    }

    const requestContext = getRequestAuditContext(req);
    const user = await getAppUser();

    await logActivity({
      ...requestContext,
      user,
      eventType,
      eventName: safeString(body.eventName) || eventType,
      route: safeString(body.route) || requestContext.route,
      referrer: safeString(body.referrer) || requestContext.referrer,
      sessionId: safeString(body.sessionId),
      targetType: safeString(body.targetType),
      targetLabel: safeString(body.targetLabel),
      targetId: safeString(body.targetId),
      metadata: typeof body.metadata === "object" && body.metadata !== null
        ? (body.metadata as Record<string, unknown>)
        : {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record activity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
