"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  NotificationAttemptChannel,
  NotificationAttemptRow,
  NotificationAttemptSummary,
} from "@/lib/incidents/notification-attempts";

export type NotificationAttemptStatusFilter = "all" | "success" | "error";
export type NotificationAttemptChannelFilter = "all" | NotificationAttemptChannel;
export type NotificationAttemptSinceFilter = "1h" | "24h" | "7d" | "30d" | "all";

export interface NotificationAttemptFilters {
  status: NotificationAttemptStatusFilter;
  channel: NotificationAttemptChannelFilter;
  since: NotificationAttemptSinceFilter;
  search: string;
}

const EMPTY_SUMMARY: NotificationAttemptSummary = {
  total: 0,
  success: 0,
  failed: 0,
  failed24h: 0,
  smtpFallback: 0,
  manualResend: 0,
  successRate: 0,
};

export function useNotificationAttempts(filters: NotificationAttemptFilters) {
  const [attempts, setAttempts] = useState<NotificationAttemptRow[]>([]);
  const [summary, setSummary] = useState<NotificationAttemptSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [realtimeState, setRealtimeState] = useState<"connecting" | "live" | "degraded">("connecting");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("status", filters.status);
    params.set("channel", filters.channel);
    params.set("since", filters.since);
    params.set("limit", "200");
    if (filters.search.trim()) params.set("search", filters.search.trim());
    return params.toString();
  }, [filters.channel, filters.search, filters.since, filters.status]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/incidents/notification-attempts?${queryString}`, {
        cache: "no-store",
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to load notification attempts");
      setAttempts(json.data || []);
      setSummary(json.summary || EMPTY_SUMMARY);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notification attempts");
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const channel = supabase
      .channel("notification-ops-attempts")
      .on("postgres_changes", { event: "*", schema: "public", table: "incident_notification_attempts" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, refresh)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeState("live");
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setRealtimeState("degraded");
        }
      });

    const fallback = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 60000);

    return () => {
      window.clearInterval(fallback);
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return {
    attempts,
    summary,
    isLoading,
    error,
    lastUpdate,
    realtimeState,
    refresh,
  };
}
