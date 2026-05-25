import type { NotificationAttemptSummary } from "@/lib/incidents/notification-attempts";

function toneClass(tone: "cyan" | "green" | "magenta" | "yellow" | "purple" | "orange") {
  return {
    cyan: "border-neon-cyan/20 text-neon-cyan shadow-[0_0_18px_rgba(0,240,255,0.08)]",
    green: "border-neon-green/20 text-neon-green shadow-[0_0_18px_rgba(0,255,136,0.08)]",
    magenta: "border-neon-magenta/20 text-neon-magenta shadow-[0_0_18px_rgba(255,0,160,0.08)]",
    yellow: "border-neon-yellow/20 text-neon-yellow shadow-[0_0_18px_rgba(240,232,0,0.08)]",
    purple: "border-neon-purple/20 text-neon-purple shadow-[0_0_18px_rgba(184,41,221,0.08)]",
    orange: "border-neon-orange/20 text-neon-orange shadow-[0_0_18px_rgba(255,123,0,0.08)]",
  }[tone];
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "cyan" | "green" | "magenta" | "yellow" | "purple" | "orange";
}) {
  return (
    <div className={`rounded-lg border bg-dark-surface/80 p-4 backdrop-blur-2xl ${toneClass(tone)}`}>
      <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

export function NotificationOpsMetrics({ summary }: { summary: NotificationAttemptSummary }) {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Metric label="Attempts" value={summary.total} tone="cyan" />
      <Metric label="Success Rate" value={`${summary.successRate}%`} tone="green" />
      <Metric label="Failed" value={summary.failed} tone="magenta" />
      <Metric label="Failed 24h" value={summary.failed24h} tone="yellow" />
      <Metric label="SMTP Fallback" value={summary.smtpFallback} tone="purple" />
      <Metric label="Manual Retry" value={summary.manualResend} tone="orange" />
    </section>
  );
}
