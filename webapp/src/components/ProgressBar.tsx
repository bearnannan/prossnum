import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ProgressBar({ value, color = 'blue' }: { value: number; color?: string }) {
  const [prevValue, setPrevValue] = useState(value);
  const [isSurging, setIsSurging] = useState(false);

  useEffect(() => {
    if (value > prevValue) {
      setIsSurging(true);
      const timer = setTimeout(() => setIsSurging(false), 1200);
      return () => clearTimeout(timer);
    }
    setPrevValue(value);
  }, [value, prevValue]);

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

  const glowColorMap: Record<string, string> = {
    blue: 'bg-blue-400',
    cyan: 'bg-cyan-400',
    orange: 'bg-orange-400',
    emerald: 'bg-emerald-400',
    indigo: 'bg-indigo-400',
    amber: 'bg-amber-400',
    green: 'bg-green-400',
    rose: 'bg-rose-400',
  };

  const gradient = colorMap[color] || colorMap.blue;
  const glowColor = glowColorMap[color] || glowColorMap.blue;
  const raw = isNaN(value) ? 0 : value;
  const pct = Math.min(100, Math.max(0, raw));
  
  return (
    <div className="flex items-center gap-3 w-full group/progress">
      <div className="progress-bar flex-1 h-[7px] bg-zinc-100 dark:bg-zinc-800/40 rounded-full overflow-hidden relative shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] as const }}
          className={`h-full rounded-full bg-gradient-to-r ${gradient} relative`}
        >
          {/* Subtle Continuous Shimmer */}
          <div className="absolute inset-0 animate-shimmer opacity-30 mix-blend-overlay"></div>
          
          {/* Head Light / Glow at the leading edge */}
          <motion.div 
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute right-0 top-0 bottom-0 w-4 blur-sm ${glowColor} opacity-50`} 
          />

          {/* Surge Pulse Effect */}
          <AnimatePresence>
            {isSurging && (
              <motion.div
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: '200%', opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "circOut" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent z-10"
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <motion.span 
        key={pct}
        initial={{ opacity: 0, scale: 0.8, x: 5 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        className={`text-[10px] font-black tracking-tighter tabular-nums min-w-[32px] text-right ${pct >= 100 ? 'text-emerald-500' : 'text-zinc-400 dark:text-zinc-500'} group-hover/progress:text-zinc-900 dark:group-hover/progress:text-zinc-100 transition-colors duration-300`}
      >
        {Math.round(pct)}%
      </motion.span>
    </div>
  );
}

