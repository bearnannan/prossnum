import type {
  NotificationAttemptChannelFilter,
  NotificationAttemptFilters,
  NotificationAttemptSinceFilter,
  NotificationAttemptStatusFilter,
} from "@/hooks/useNotificationAttempts";

const STATUS_OPTIONS: NotificationAttemptStatusFilter[] = ["all", "success", "error"];
const CHANNEL_OPTIONS: NotificationAttemptChannelFilter[] = [
  "all",
  "line_primary",
  "line_backup",
  "smtp_fallback",
  "manual_resend",
];
const SINCE_OPTIONS: NotificationAttemptSinceFilter[] = ["1h", "24h", "7d", "30d", "all"];

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/40 ${
        active
          ? "border-neon-cyan/50 bg-neon-cyan/15 text-neon-cyan shadow-[0_0_12px_rgba(0,240,255,0.12)]"
          : "border-white/10 bg-dark-base/50 text-slate-400 hover:border-neon-cyan/25 hover:text-neon-cyan"
      }`}
    >
      {children}
    </button>
  );
}

export function NotificationAttemptFilters({
  filters,
  onChange,
}: {
  filters: NotificationAttemptFilters;
  onChange: (filters: NotificationAttemptFilters) => void;
}) {
  return (
    <section className="rounded-lg border border-neon-cyan/15 bg-dark-surface/82 p-4 shadow-card backdrop-blur-2xl geo-corner">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neon-cyan/25 bg-neon-cyan/10 text-neon-cyan">
          <span className="material-symbols-outlined text-[20px]">filter_alt</span>
        </div>
        <div>
          <div className="text-sm font-black uppercase tracking-[0.16em] text-white">Filters</div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Delivery attempts
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <input
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          className="neon-input text-sm"
          placeholder="Search incident, station, correlation ID"
        />

        <div>
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Status</div>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((status) => (
              <FilterButton
                key={status}
                active={filters.status === status}
                onClick={() => onChange({ ...filters, status })}
              >
                {status}
              </FilterButton>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Channel</div>
          <div className="grid grid-cols-2 gap-2">
            {CHANNEL_OPTIONS.map((channel) => (
              <FilterButton
                key={channel}
                active={filters.channel === channel}
                onClick={() => onChange({ ...filters, channel })}
              >
                {channel.replace("_", " ")}
              </FilterButton>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Time Range</div>
          <div className="grid grid-cols-5 gap-2">
            {SINCE_OPTIONS.map((since) => (
              <FilterButton
                key={since}
                active={filters.since === since}
                onClick={() => onChange({ ...filters, since })}
              >
                {since}
              </FilterButton>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
