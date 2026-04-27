import React from 'react';

export function ProgressBar({ value, color = 'blue' }: { value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-indigo-500',
    cyan: 'from-cyan-500 to-blue-500',
    orange: 'from-orange-400 to-amber-500',
    emerald: 'from-emerald-500 to-teal-500',
    indigo: 'from-indigo-500 to-violet-500',
    amber: 'from-amber-500 to-orange-500',
    green: 'from-green-500 to-emerald-500',
    rose: 'from-rose-500 to-pink-500',
  };
  const gradient = colorMap[color] || colorMap.blue;
  const raw = isNaN(value) ? 0 : value;
  const pct = Math.min(100, Math.max(0, raw));
  
  return (
    <div className="flex items-center gap-2.5 w-full">
      <div className="progress-bar flex-1">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out relative overflow-hidden`}
          style={{ width: `${pct}%` }}
        >
          {pct > 20 && <div className="absolute inset-0 animate-shimmer opacity-30"></div>}
        </div>
      </div>
      <span className={`text-xs font-bold tabular-nums min-w-[36px] text-right ${pct >= 100 ? 'text-emerald-600' : 'text-zinc-500'}`}>
        {pct}%
      </span>
    </div>
  );
}
