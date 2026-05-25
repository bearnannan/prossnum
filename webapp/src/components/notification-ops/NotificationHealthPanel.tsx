"use client";

import { useEffect, useState } from "react";

interface HealthPayload {
  status: "success" | "degraded";
  service: string;
  latencyMs: number;
  checks: Record<string, { ok?: boolean; message?: string; count?: number; data?: unknown } | unknown>;
  error?: string;
}

function stateClass(ok?: boolean) {
  if (ok === true) return "border-neon-green/25 bg-neon-green/10 text-neon-green";
  if (ok === false) return "border-neon-magenta/25 bg-neon-magenta/10 text-neon-magenta";
  return "border-neon-yellow/25 bg-neon-yellow/10 text-neon-yellow";
}

export function NotificationHealthPanel() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/incidents/health", { cache: "no-store" });
        const json = await res.json();
        if (active) setHealth(json);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    const interval = window.setInterval(load, 60000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section className="rounded-lg border border-neon-green/15 bg-dark-surface/82 p-4 shadow-card backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neon-green/25 bg-neon-green/10 text-neon-green">
            <span className="material-symbols-outlined text-[20px]">health_and_safety</span>
          </div>
          <div>
            <div className="text-sm font-black uppercase tracking-[0.16em] text-white">Health Diagnostics</div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              {isLoading ? "Checking..." : `${health?.service || "incident-notification-system"} | ${health?.latencyMs || 0}ms`}
            </div>
          </div>
        </div>
        <span
          className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
            health?.status === "success"
              ? "border-neon-green/30 bg-neon-green/10 text-neon-green"
              : "border-neon-magenta/30 bg-neon-magenta/10 text-neon-magenta"
          }`}
        >
          {health?.status || "loading"}
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        {health &&
          Object.entries(health.checks || {}).map(([key, value]) => {
            const check = value as { ok?: boolean; message?: string; count?: number };
            return (
              <div key={key} className={`rounded-lg border px-3 py-2 ${stateClass(check.ok)}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em]">{key}</span>
                  <span className="font-mono text-xs">{check.count ?? (check.ok ? "OK" : "CHECK")}</span>
                </div>
                {check.message && <div className="mt-1 text-[11px] text-slate-400">{check.message}</div>}
              </div>
            );
          })}
      </div>
    </section>
  );
}
