import { STATUS_CONFIG } from "@/config/incident.config";

export function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] || { label: String(status).toUpperCase(), color: '#6b7280' };
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold tracking-wide"
      style={{ 
        color: cfg.color, 
        background: `${cfg.color}15`,
        border: `1px solid ${cfg.color}40`,
        boxShadow: `0 0 8px ${cfg.color}30`,
        textShadow: `0 0 4px ${cfg.color}60`,
      }}
    >
      <span 
        className="w-1.5 h-1.5 rounded-full mr-2 animate-pulse" 
        style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} 
      />
      {cfg.label}
    </span>
  );
}
