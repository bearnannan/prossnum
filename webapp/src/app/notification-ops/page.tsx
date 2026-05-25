"use client";

import React, { useMemo, useState, useTransition } from "react";
import TopNavBar from "@/components/TopNavBar";
import SideNavBar from "@/components/SideNavBar";
import AdminRouteGuard from "@/components/AdminRouteGuard";
import LineBotSettingsModal from "@/components/LineBotSettingsModal";
import { useToast } from "@/components/Toast";
import { NotificationAttemptFilters } from "@/components/notification-ops/NotificationAttemptFilters";
import { NotificationAttemptInspector } from "@/components/notification-ops/NotificationAttemptInspector";
import { NotificationAttemptTable } from "@/components/notification-ops/NotificationAttemptTable";
import { NotificationHealthPanel } from "@/components/notification-ops/NotificationHealthPanel";
import { NotificationOpsMetrics } from "@/components/notification-ops/NotificationOpsMetrics";
import {
  type NotificationAttemptFilters as AttemptFilters,
  useNotificationAttempts,
} from "@/hooks/useNotificationAttempts";
import type { NotificationAttemptRow } from "@/lib/incidents/notification-attempts";

const DEFAULT_FILTERS: AttemptFilters = {
  status: "all",
  channel: "all",
  since: "24h",
  search: "",
};

function formatClock(value: Date | null) {
  if (!value) return "--:--:--";
  return value.toLocaleTimeString("th-TH", { hour12: false, timeZone: "Asia/Bangkok" });
}

export default function NotificationOpsPage() {
  const [filters, setFilters] = useState<AttemptFilters>(DEFAULT_FILTERS);
  const [selectedAttempt, setSelectedAttempt] = useState<NotificationAttemptRow | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLineSettingsOpen, setIsLineSettingsOpen] = useState(false);
  const [isRetrying, startRetry] = useTransition();
  const { showToast } = useToast();

  const {
    attempts,
    summary,
    isLoading,
    error,
    lastUpdate,
    realtimeState,
    refresh,
  } = useNotificationAttempts(filters);

  const selectedAttemptSafe = useMemo(() => {
    if (!selectedAttempt) return null;
    return attempts.find((attempt) => attempt.id === selectedAttempt.id) || selectedAttempt;
  }, [attempts, selectedAttempt]);

  const retryAttempt = (attempt: NotificationAttemptRow) => {
    if (!attempt.incident_id) {
      showToast("This attempt is not linked to an incident", "error");
      return;
    }

    startRetry(async () => {
      try {
        const res = await fetch(`/api/incidents/${attempt.incident_id}/resend`, {
          method: "POST",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Retry failed");
        showToast("Notification retry dispatched", "success");
        await refresh();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Notification retry failed", "error");
      }
    });
  };

  return (
    <AdminRouteGuard>
    <div className="dark min-h-screen bg-dark-base text-slate-200 bg-grid relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[18%] top-[-18%] h-96 w-96 rounded-full bg-neon-cyan/5 blur-[120px]" />
        <div className="absolute bottom-[-18%] right-[16%] h-96 w-96 rounded-full bg-neon-magenta/5 blur-[120px]" />
      </div>

      <TopNavBar
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onSettingsClick={() => setIsLineSettingsOpen(true)}
      />
      <SideNavBar
        activeCategory="station"
        onCategoryChange={() => undefined}
        provinces={[]}
        selectedProvince="All"
        onProvinceChange={() => undefined}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <main className="relative z-10 mx-auto max-w-[1800px] p-4 pt-20 lg:ml-[280px] sm:p-6 lg:p-8">
        <header className="mb-5 rounded-lg border border-neon-cyan/15 bg-dark-surface/70 p-5 shadow-card backdrop-blur-2xl geo-corner">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-neon-cyan">
                Notification Operations
              </div>
              <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
                Delivery Control Center
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
                Monitor LINE delivery attempts, SMTP fallback, retry actions, and incident notification health.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
              <span className={`rounded-lg border px-3 py-2 ${
                realtimeState === "live"
                  ? "border-neon-green/30 bg-neon-green/10 text-neon-green"
                  : realtimeState === "connecting"
                    ? "border-neon-yellow/30 bg-neon-yellow/10 text-neon-yellow"
                    : "border-neon-magenta/30 bg-neon-magenta/10 text-neon-magenta"
              }`}>
                {realtimeState}
              </span>
              <span className="rounded-lg border border-white/10 bg-dark-base/50 px-3 py-2 text-slate-500">
                Sync {formatClock(lastUpdate)}
              </span>
              <button
                type="button"
                onClick={refresh}
                className="cursor-pointer rounded-lg border border-neon-cyan/25 bg-neon-cyan/10 px-3 py-2 text-neon-cyan transition-colors hover:bg-neon-cyan/15"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        <NotificationOpsMetrics summary={summary} />

        {error && (
          <div className="mt-4 rounded-lg border border-neon-magenta/25 bg-neon-magenta/10 p-4 text-sm text-neon-magenta">
            {error}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[330px_minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <NotificationAttemptFilters filters={filters} onChange={setFilters} />
            <NotificationHealthPanel />
          </div>

          <NotificationAttemptTable
            attempts={attempts}
            selectedId={selectedAttemptSafe?.id}
            isLoading={isLoading}
            onSelect={setSelectedAttempt}
          />

          <NotificationAttemptInspector
            attempt={selectedAttemptSafe}
            isRetrying={isRetrying}
            onRetry={retryAttempt}
          />
        </div>
      </main>

      <LineBotSettingsModal
        isOpen={isLineSettingsOpen}
        onClose={() => setIsLineSettingsOpen(false)}
      />
    </div>
    </AdminRouteGuard>
  );
}
