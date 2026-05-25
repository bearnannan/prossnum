"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type ClientActivityEvent = "page_view" | "navigation" | "button_click" | "export_download";

interface ActivityPayload {
  eventType: ClientActivityEvent;
  eventName: string;
  route?: string;
  referrer?: string;
  targetType?: string;
  targetLabel?: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}

function getSessionId() {
  const key = "prossnum_activity_session_id";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const next = createClientId();
  window.sessionStorage.setItem(key, next);
  return next;
}

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

function readableLabel(element: Element, options: { allowTextContent?: boolean } = {}) {
  const label =
    element.getAttribute("data-audit-label") ||
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.getAttribute("href") ||
    element.getAttribute("name") ||
    (options.allowTextContent ? element.textContent : null) ||
    element.id ||
    element.tagName.toLowerCase();

  return label?.replace(/\s+/g, " ").trim().slice(0, 180) || "unlabeled";
}

function postActivity(payload: ActivityPayload, sessionId: string) {
  const body = JSON.stringify({
    ...payload,
    sessionId,
    referrer: document.referrer || undefined,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/activity", new Blob([body], { type: "application/json" }));
    return;
  }

  fetch("/api/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export default function ActivityTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousRoute = useRef<string | null>(null);
  const lastClickAt = useRef(0);
  const viewedSections = useRef<Set<string>>(new Set());
  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return getSessionId();
  }, []);

  const route = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => {
    if (!sessionId) return;

    postActivity({
      eventType: "page_view",
      eventName: "route_viewed",
      route,
      metadata: {
        previousRoute: previousRoute.current,
      },
    }, sessionId);

    if (previousRoute.current && previousRoute.current !== route) {
      postActivity({
        eventType: "navigation",
        eventName: "route_changed",
        route,
        metadata: {
          from: previousRoute.current,
          to: route,
        },
      }, sessionId);
    }

    previousRoute.current = route;
    viewedSections.current.clear();
  }, [route, sessionId]);

  useEffect(() => {
    if (!sessionId || typeof IntersectionObserver === "undefined") return;

    const candidates = Array.from(document.querySelectorAll("[data-audit-section], main, section"));
    if (!candidates.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target;
          const label = readableLabel(element);
          const sectionId = element.getAttribute("data-audit-id") || element.id || label;
          const key = `${route}:${sectionId}`;
          if (viewedSections.current.has(key)) continue;
          viewedSections.current.add(key);

          postActivity({
            eventType: "page_view",
            eventName: "section_viewed",
            route,
            targetType: "section",
            targetLabel: label,
            targetId: sectionId,
          }, sessionId);
        }
      },
      { threshold: 0.45 }
    );

    candidates.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [route, sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const interactive = target.closest("button, a, [role='button'], [data-audit-click]");
      if (!interactive) return;

      const now = Date.now();
      if (now - lastClickAt.current < 250) return;
      lastClickAt.current = now;

      const anchor = interactive.closest("a");
      const isNavigation = Boolean(anchor?.getAttribute("href"));
      const label = readableLabel(interactive, { allowTextContent: true });
      const isExportAction = /\b(export|download|pdf|csv|excel|jpeg|txt)\b/i.test(label);

      postActivity({
        eventType: isNavigation ? "navigation" : isExportAction ? "export_download" : "button_click",
        eventName: isNavigation ? "navigation_click" : isExportAction ? "export_clicked" : "button_clicked",
        route,
        targetType: interactive.tagName.toLowerCase(),
        targetLabel: label,
        targetId: interactive.getAttribute("data-audit-id") || interactive.id || null,
        metadata: {
          href: anchor?.getAttribute("href") || null,
          classes: interactive.className ? String(interactive.className).slice(0, 240) : null,
        },
      }, sessionId);
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [route, sessionId]);

  return null;
}
