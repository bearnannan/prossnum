import { getIncidentConfigAsync, getStatusColor } from "./config";
import { maskPhoneNumber } from "./format";
import { sendEmailNotification } from "./email-client";
import { recordNotificationAttempt } from "./notification-attempts";
import type { LineApiResponse, LineFlexMessage, NotificationPayload } from "./types";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeLogValue(value: unknown): unknown {
  if (typeof value === "string" && /\d{7,}/.test(value.replace(/\D/g, ""))) {
    return maskPhoneNumber(value);
  }
  return value;
}

function logLineEvent(event: string, payload: Record<string, unknown>) {
  const safePayload = Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, sanitizeLogValue(value)])
  );
  console.info(JSON.stringify({ event, ...safePayload }));
}

function parseLineErrorMessage(responseText: string, statusCode: number) {
  let lineMessage = responseText || "LINE push failed";

  try {
    const parsed = JSON.parse(responseText) as { message?: unknown };
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      lineMessage = parsed.message.trim();
    }
  } catch {
    // LINE usually returns JSON, but keep the raw response when it does not.
  }

  const normalized = lineMessage.replace(/\.+$/, "");

  if (statusCode === 401) {
    return `LINE authentication failed: ${normalized}. Check the channel access token in LINE Settings/system_settings or .env.local.`;
  }

  if (statusCode === 400) {
    return `LINE rejected the request: ${normalized}`;
  }

  if (statusCode === 403) {
    return `LINE authorization/quota failure: ${normalized}`;
  }

  return normalized;
}

export async function sendLineNotification(
  message: LineFlexMessage,
  correlationId = crypto.randomUUID(),
  payload?: NotificationPayload,
  options?: { incidentId?: string | null }
): Promise<LineApiResponse> {
  const config = await getIncidentConfigAsync();
  if (!config.lineChannelAccessToken || !config.lineGroupId) {
    return {
      status: "error",
      message: "LINE_CHANNEL_ACCESS_TOKEN or LINE_GROUP_ID is not configured",
    };
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

    try {
      logLineEvent("line_push_attempt", { correlationId, attempt });
      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.lineChannelAccessToken}`,
        },
        body: JSON.stringify({
          to: config.lineGroupId,
          messages: [message],
        }),
      });

      const responseText = await response.text();
      if (response.ok) {
        logLineEvent("line_push_success", { correlationId, statusCode: response.status });
        return {
          status: "success",
          message: "Notification sent successfully",
          statusCode: response.status,
        };
      }

      const lineErrorMessage = parseLineErrorMessage(responseText, response.status);
      lastError = new Error(lineErrorMessage);
      
      // If it is NOT a transient error, return immediately
      if (![429, 500, 502, 503, 504].includes(response.status)) {
        // Intercept quota limit errors to trigger Level C email fallback
        const isQuotaExceeded = 
          responseText.toLowerCase().includes("limit") || 
          response.status === 400 || 
          response.status === 403;

        if (isQuotaExceeded && payload) {
          console.warn("[Quota Intercept] LINE Messaging API quota exceeded. Triggering alternative email fallback...");
          const status = payload["สถานะการแก้ไข"] || "รอดำเนินการ";
          const incidentNo = payload["หมายเลขแจ้งเสีย"] || "INC-UNKNOWN";
          const statusColor = getStatusColor(status as any);
          
          // Fire-and-forget email dispatch
          sendEmailNotification(payload, status, incidentNo, statusColor).catch((err) => {
            console.error("[Quota Fallback Fail] Failed to send fallback email:", err);
          });
          recordNotificationAttempt({
            incidentId: options?.incidentId,
            channel: "smtp_fallback",
            status: "success",
            message: "SMTP fallback queued after LINE quota/error response",
            correlationId,
          }).catch(() => undefined);
        }

        return {
          status: "error",
          message: lineErrorMessage,
          statusCode: response.status,
        };
      }
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < config.maxRetries) {
      await wait(250 * 2 ** (attempt - 1));
    }
  }

  const messageText = lastError instanceof Error ? lastError.message : "LINE push failed";
  logLineEvent("line_push_error", { correlationId, message: messageText });
  
  // If fallback payload is provided and HMR/API request timed out/failed entirely, also trigger email backup
  if (payload) {
    console.info("[Fallback Trigger] Attempting fallback email delivery due to persistent delivery failure...");
    const status = payload["สถานะการแก้ไข"] || "รอดำเนินการ";
    const incidentNo = payload["หมายเลขแจ้งเสีย"] || "INC-UNKNOWN";
    const statusColor = getStatusColor(status as any);
    sendEmailNotification(payload, status, incidentNo, statusColor).catch((err) => {
      console.error("[Quota Fallback Fail] Failed to send fallback email:", err);
    });
    recordNotificationAttempt({
      incidentId: options?.incidentId,
      channel: "smtp_fallback",
      status: "success",
      message: "SMTP fallback queued after persistent LINE delivery failure",
      correlationId,
    }).catch(() => undefined);
  }

  return {
    status: "error",
    message: messageText,
    statusCode: 502,
  };
}
