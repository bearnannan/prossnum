import type { NotificationAttemptRow } from "@/lib/incidents/notification-attempts";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });
}

function statusClass(status: "success" | "error") {
  return status === "success"
    ? "border-neon-green/30 bg-neon-green/10 text-neon-green"
    : "border-neon-magenta/30 bg-neon-magenta/10 text-neon-magenta";
}

function channelClass(channel: string) {
  if (channel === "smtp_fallback") return "border-neon-purple/30 bg-neon-purple/10 text-neon-purple";
  if (channel === "manual_resend") return "border-neon-orange/30 bg-neon-orange/10 text-neon-orange";
  if (channel === "line_backup") return "border-neon-yellow/30 bg-neon-yellow/10 text-neon-yellow";
  return "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan";
}

export function NotificationAttemptTable({
  attempts,
  selectedId,
  isLoading,
  onSelect,
}: {
  attempts: NotificationAttemptRow[];
  selectedId?: string;
  isLoading: boolean;
  onSelect: (attempt: NotificationAttemptRow) => void;
}) {
  return (
    <section className="rounded-lg border border-neon-cyan/15 bg-dark-surface/82 p-4 shadow-card backdrop-blur-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black uppercase tracking-[0.14em] text-white">Delivery History</h2>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            {attempts.length} visible attempts
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-[0.16em] text-slate-500">
              <th className="py-3 pr-4">Time</th>
              <th className="py-3 pr-4">Incident</th>
              <th className="py-3 pr-4">Station</th>
              <th className="py-3 pr-4">Channel</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Code</th>
              <th className="py-3 pr-4">Message</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  Loading delivery history...
                </td>
              </tr>
            ) : attempts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No notification attempts match the current filters.
                </td>
              </tr>
            ) : (
              attempts.map((attempt) => (
                <tr
                  key={attempt.id}
                  onClick={() => onSelect(attempt)}
                  className={`cursor-pointer border-b border-white/5 align-top transition-colors hover:bg-neon-cyan/[0.035] ${
                    selectedId === attempt.id ? "bg-neon-cyan/[0.06]" : ""
                  }`}
                >
                  <td className="py-3 pr-4 font-mono text-[11px] text-slate-400">
                    {formatDateTime(attempt.created_at)}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-black text-white">{attempt.incident?.incident_no || "-"}</div>
                    <div className="mt-1 max-w-[180px] truncate font-mono text-[10px] text-slate-600">
                      {attempt.correlation_id || "-"}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="max-w-[190px] truncate text-slate-300">
                      {attempt.incident?.asset_name || attempt.incident?.station || "-"}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">
                      {attempt.incident?.priority || "-"}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${channelClass(attempt.channel)}`}>
                      {attempt.channel.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${statusClass(attempt.status)}`}>
                      {attempt.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-400">{attempt.status_code || "-"}</td>
                  <td className="py-3 pr-4">
                    <div className="max-w-[280px] truncate text-xs text-slate-400">{attempt.message || "-"}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
