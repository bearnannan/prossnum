import { PRIORITY_CONFIG } from "@/config/incident.config";

export function PriorityBadge({ priority }: { priority: keyof typeof PRIORITY_CONFIG }) {
  const cfg = PRIORITY_CONFIG[priority] || { label: String(priority).toUpperCase(), color: '#6b7280' };
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold tracking-wide uppercase"
      style={{
        color:      cfg.color,
        background: `${cfg.color}15`,
        border:     `1px solid ${cfg.color}40`,
        boxShadow:  `0 0 10px ${cfg.color}25`,
        textShadow: `0 0 6px ${cfg.color}50`,
      }}
    >
      {cfg.label}
    </span>
  );
}
