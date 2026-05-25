"use client";

import { useEffect, useState } from "react";
import { getSLAProgress } from "@/lib/utils/sla";

interface SLATimerProps {
  createdAt: string;
  dueAt:     string;
  label?:    string;
}

export function SLATimer({ createdAt, dueAt, label = "SLA" }: SLATimerProps) {
  const [progress, setProgress] = useState(() =>
    getSLAProgress(new Date(createdAt), new Date(dueAt))
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(getSLAProgress(new Date(createdAt), new Date(dueAt)));
    }, 30_000);
    return () => clearInterval(timer);
  }, [createdAt, dueAt]);

  const COLOR = {
    ok:       "#00ff88",
    warning:  "#f0e800",
    breached: "#ff00a0",
  }[progress.status];

  const remainingHrs = Math.floor(progress.remainingMs / 3_600_000);
  const remainingMin = Math.floor((progress.remainingMs % 3_600_000) / 60_000);

  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
      <div className="flex justify-between text-[10px] font-bold tracking-wider uppercase">
        <span className="text-slate-400">{label}</span>
        <span style={{ color: COLOR, textShadow: `0 0 6px ${COLOR}80` }}>
          {progress.status === "breached"
            ? "BREACHED"
            : `${remainingHrs}H ${remainingMin}M`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
        <div
          className="h-full rounded-full transition-all duration-500 relative"
          style={{
            width:      `${progress.pct * 100}%`,
            background: `linear-gradient(90deg, ${COLOR}80, ${COLOR})`,
            boxShadow:  `0 0 10px ${COLOR}, 0 0 20px ${COLOR}40`,
          }}
        >
          {/* Scan line effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
