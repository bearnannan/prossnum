import type { NotificationAttemptRow } from "@/lib/incidents/notification-attempts";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 border-b border-white/5 py-2 last:border-0">
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">{label}</span>
      <span className="min-w-0 break-words text-sm text-slate-300">{value}</span>
    </div>
  );
}

export function NotificationAttemptInspector({
  attempt,
  isRetrying,
  onRetry,
}: {
  attempt: NotificationAttemptRow | null;
  isRetrying: boolean;
  onRetry: (attempt: NotificationAttemptRow) => void;
}) {
  return (
    <section className="rounded-lg border border-neon-cyan/15 bg-dark-surface/86 p-4 shadow-card backdrop-blur-2xl geo-corner">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neon-cyan/25 bg-neon-cyan/10 text-neon-cyan">
          <span className="material-symbols-outlined text-[20px]">manage_search</span>
        </div>
        <div>
          <div className="text-sm font-black uppercase tracking-[0.16em] text-white">Attempt Inspector</div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Delivery trace
          </div>
        </div>
      </div>

      {!attempt ? (
        <div className="mt-5 rounded-lg border border-white/10 bg-dark-base/55 p-5 text-sm leading-relaxed text-slate-500">
          Select a delivery attempt to inspect its incident, correlation ID, and retry options.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-lg border border-white/10 bg-dark-base/55 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neon-cyan">
              {attempt.incident?.incident_no || "No Incident Link"}
            </div>
            <h3 className="mt-2 text-lg font-black text-white">
              {attempt.incident?.asset_name || attempt.incident?.station || "-"}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{attempt.message || "-"}</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-dark-base/40 p-4">
            <InfoRow label="Channel" value={attempt.channel} />
            <InfoRow label="Status" value={attempt.status} />
            <InfoRow label="Status Code" value={attempt.status_code || "-"} />
            <InfoRow label="Created" value={formatDateTime(attempt.created_at)} />
            <InfoRow label="Correlation" value={attempt.correlation_id || "-"} />
            <InfoRow label="Token Source" value={attempt.token_source || "-"} />
            <InfoRow label="Repair" value={attempt.incident?.repair_status || "-"} />
            <InfoRow label="Latest Error" value={attempt.incident?.line_notification_error || "-"} />
          </div>

          <button
            type="button"
            onClick={() => onRetry(attempt)}
            disabled={!attempt.incident_id || isRetrying}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-neon-yellow/30 bg-neon-yellow/10 px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-neon-yellow transition-all duration-200 hover:bg-neon-yellow/15 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            {isRetrying ? "Retrying..." : "Retry Notification"}
          </button>
        </div>
      )}
    </section>
  );
}
