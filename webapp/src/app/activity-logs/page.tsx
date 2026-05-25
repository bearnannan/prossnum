"use client";

import React, { useEffect, useMemo, useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import SideNavBar from "@/components/SideNavBar";
import AdminRouteGuard from "@/components/AdminRouteGuard";

type ActivityEventType =
  | "all"
  | "page_view"
  | "navigation"
  | "button_click"
  | "login"
  | "logout"
  | "failed_auth"
  | "mission_control"
  | "settings_change"
  | "export_download"
  | "security";

interface ActivityLogRow {
  id: string;
  event_type: Exclude<ActivityEventType, "all">;
  event_name: string;
  user_id: string | null;
  user_name: string | null;
  user_source: string | null;
  route: string | null;
  target_type: string | null;
  target_label: string | null;
  target_id: string | null;
  status_code: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface MigrationStatus {
  status: string;
  checks: Record<string, { ok: boolean; message: string; count?: number | null }>;
}

const EVENT_TYPES: ActivityEventType[] = [
  "all",
  "page_view",
  "navigation",
  "button_click",
  "login",
  "logout",
  "failed_auth",
  "mission_control",
  "settings_change",
  "export_download",
  "security",
];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    hour12: false,
  });
}

function eventClass(eventType: string) {
  if (eventType === "failed_auth" || eventType === "security") return "border-neon-magenta/25 bg-neon-magenta/10 text-neon-magenta";
  if (eventType === "login" || eventType === "logout") return "border-neon-green/25 bg-neon-green/10 text-neon-green";
  if (eventType === "settings_change" || eventType === "export_download") return "border-neon-yellow/25 bg-neon-yellow/10 text-neon-yellow";
  return "border-neon-cyan/25 bg-neon-cyan/10 text-neon-cyan";
}

export default function ActivityLogsPage() {
  const [eventType, setEventType] = useState<ActivityEventType>("all");
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<ActivityLogRow[]>([]);
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [selectedLog, setSelectedLog] = useState<ActivityLogRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("eventType", eventType);
    params.set("limit", "150");
    if (search.trim()) params.set("search", search.trim());
    return params.toString();
  }, [eventType, search]);

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [logsRes, statusRes] = await Promise.all([
        fetch(`/api/activity/logs?${queryString}`, { cache: "no-store" }),
        fetch("/api/activity/status", { cache: "no-store" }),
      ]);
      const logsJson = await logsRes.json();
      const statusJson = await statusRes.json();
      if (!logsRes.ok) throw new Error(logsJson.error || "Failed to load activity logs");
      setLogs(logsJson.data || []);
      if (statusRes.ok) setStatus(statusJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  return (
    <AdminRouteGuard>
    <div className="dark min-h-screen bg-dark-base bg-grid text-slate-200">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[12%] top-[-20%] h-96 w-96 rounded-full bg-neon-cyan/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[12%] h-96 w-96 rounded-full bg-neon-magenta/5 blur-[120px]" />
      </div>

      <TopNavBar onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <SideNavBar
        activeCategory="station"
        onCategoryChange={() => undefined}
        provinces={[]}
        selectedProvince="All"
        onProvinceChange={() => undefined}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <main className="relative z-10 mx-auto max-w-[1800px] p-4 pt-20 sm:p-6 lg:ml-[280px] lg:p-8">
        <header className="rounded-lg border border-neon-cyan/15 bg-dark-surface/72 p-5 shadow-card backdrop-blur-2xl geo-corner">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-neon-cyan">
                Security Audit
              </div>
              <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">Activity Log Center</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
                Inspect page views, navigation, UI clicks, authentication events, exports, settings changes, and operational actions.
              </p>
            </div>
            <button
              type="button"
              onClick={loadLogs}
              className="w-fit cursor-pointer rounded-lg border border-neon-cyan/25 bg-neon-cyan/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-neon-cyan transition-colors hover:bg-neon-cyan/15"
            >
              Refresh
            </button>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {status ? Object.entries(status.checks).map(([key, check]) => (
            <div key={key} className={`rounded-lg border p-3 ${check.ok ? "border-neon-green/20 bg-neon-green/5" : "border-neon-magenta/25 bg-neon-magenta/10"}`}>
              <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">{key}</div>
              <div className={`mt-1 text-xs font-black ${check.ok ? "text-neon-green" : "text-neon-magenta"}`}>
                {check.ok ? "Ready" : "Needs Migration"}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{check.message}</p>
            </div>
          )) : (
            <div className="rounded-lg border border-white/10 bg-dark-surface/60 p-3 text-sm text-slate-500 md:col-span-3">
              Migration status is loading.
            </div>
          )}
        </section>

        <section className="mt-5 rounded-lg border border-white/10 bg-dark-surface/74 p-3 shadow-card backdrop-blur-2xl">
          <div className="flex flex-col gap-3 lg:flex-row">
            <select
              value={eventType}
              onChange={(event) => setEventType(event.target.value as ActivityEventType)}
              className="neon-input rounded-md px-3 py-2 text-xs font-bold lg:w-[260px]"
            >
              {EVENT_TYPES.map((item) => (
                <option key={item} value={item}>{item.replace(/_/g, " ").toUpperCase()}</option>
              ))}
            </select>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="neon-input rounded-md px-3 py-2 text-xs font-bold"
              placeholder="Search users, routes, events, targets..."
            />
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-neon-magenta/25 bg-neon-magenta/10 p-3 text-sm text-neon-magenta">
              {error}
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-lg border border-white/10">
            <div className="grid grid-cols-[160px_180px_minmax(160px,1fr)_minmax(160px,1fr)_90px] gap-2 border-b border-white/10 bg-dark-base/70 px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500 max-xl:hidden">
              <div>Time</div>
              <div>Event</div>
              <div>User / Route</div>
              <div>Target</div>
              <div>Status</div>
            </div>

            <div className="max-h-[620px] overflow-auto">
              {isLoading && <div className="p-5 text-sm text-slate-500">Loading activity logs...</div>}
              {!isLoading && logs.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No activity logs match the current filters.</div>}
              {!isLoading && logs.map((log) => (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => setSelectedLog(log)}
                  className="grid w-full cursor-pointer grid-cols-1 gap-2 border-b border-white/5 px-3 py-3 text-left transition-colors hover:bg-neon-cyan/[0.04] xl:grid-cols-[160px_180px_minmax(160px,1fr)_minmax(160px,1fr)_90px]"
                >
                  <div className="font-mono text-[10px] text-slate-500">{formatDateTime(log.created_at)}</div>
                  <div>
                    <span className={`inline-flex rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${eventClass(log.event_type)}`}>
                      {log.event_type}
                    </span>
                    <div className="mt-1 text-xs font-bold text-white">{log.event_name}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-slate-200">{log.user_name || log.user_id || "anonymous"}</div>
                    <div className="mt-1 truncate font-mono text-[10px] text-slate-500">{log.route || "-"}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs text-slate-300">{log.target_label || log.target_type || "-"}</div>
                    <div className="mt-1 truncate font-mono text-[10px] text-slate-500">{log.target_id || "-"}</div>
                  </div>
                  <div className="font-mono text-xs text-slate-400">{log.status_code || "-"}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {selectedLog && (
          <div className="fixed inset-0 z-[90] bg-black/70 p-4 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
            <div
              className="ml-auto h-full max-w-[560px] overflow-auto rounded-lg border border-neon-cyan/20 bg-dark-surface p-4 shadow-[0_0_28px_rgba(0,240,255,0.16)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-cyan">Activity Detail</div>
                  <h2 className="mt-2 text-lg font-black text-white">{selectedLog.event_name}</h2>
                </div>
                <button type="button" onClick={() => setSelectedLog(null)} className="rounded-md border border-white/10 px-2 py-1 text-slate-400">
                  Close
                </button>
              </div>
              <pre className="mt-4 overflow-auto rounded-lg border border-white/10 bg-dark-base/80 p-3 text-xs leading-relaxed text-slate-300">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
    </AdminRouteGuard>
  );
}
