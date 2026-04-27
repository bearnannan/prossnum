import React from 'react';

export function StatCard({ icon, iconFill, label, value, color, glowClass, className }: {
  icon: string; iconFill?: boolean; label: string; value: string | number;
  color: string; glowClass: string; className?: string;
}) {
  return (
    <div
      className={`glass-panel p-5 flex items-center gap-4 interactive-card hover:${glowClass} animate-fade-in-up ${className || ''}`}
    >
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-premium-sm`}>
        <span className="material-symbols-outlined text-white text-lg" style={iconFill ? { fontVariationSettings: "'FILL' 1" } : {}} aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-semibold tracking-[0.05em] truncate">{label}</p>
        <h3 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-none mt-0.5" style={{ fontFamily: 'var(--font-headline)' }}>
          {value}
        </h3>
      </div>
    </div>
  );
}
