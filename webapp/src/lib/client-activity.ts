type ClientActivityEvent = "page_view" | "navigation" | "button_click" | "export_download" | "failed_auth";

function createClientId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

export function logClientActivity({
  eventType,
  eventName,
  targetType,
  targetLabel,
  targetId,
  metadata,
}: {
  eventType: ClientActivityEvent;
  eventName: string;
  targetType?: string;
  targetLabel?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  if (typeof window === "undefined") return;

  const sessionKey = "prossnum_activity_session_id";
  const sessionId = window.sessionStorage.getItem(sessionKey) || createClientId();
  window.sessionStorage.setItem(sessionKey, sessionId);

  fetch("/api/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType,
      eventName,
      route: `${window.location.pathname}${window.location.search}`,
      referrer: document.referrer || undefined,
      sessionId,
      targetType,
      targetLabel,
      targetId,
      metadata,
    }),
    keepalive: true,
  }).catch(() => undefined);
}
