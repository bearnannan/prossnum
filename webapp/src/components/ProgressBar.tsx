import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

export function ProgressBar({ value, color = 'blue' }: { value: number; color?: string }) {
  const [prevValue, setPrevValue] = useState(value);
  const [isSurging, setIsSurging] = useState(false);

  if (value !== prevValue) {
    setPrevValue(value);
    if (value > prevValue) {
      setIsSurging(true);
    }
  }

  useEffect(() => {
    if (isSurging) {
      const timer = setTimeout(() => setIsSurging(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [isSurging]);

  const colorMap: Record<string, string> = {
    blue:    'from-neon-cyan/40 to-neon-cyan',
    cyan:    'from-neon-cyan/40 to-neon-cyan',
    orange:  'from-neon-orange/40 to-neon-orange',
    emerald: 'from-neon-green/40 to-neon-green',
    indigo:  'from-neon-purple/40 to-neon-purple',
    amber:   'from-neon-yellow/40 to-neon-yellow',
    green:   'from-neon-green/40 to-neon-green',
    rose:    'from-neon-magenta/40 to-neon-magenta',
  };

  const shadowMap: Record<string, string> = {
    blue:    'shadow-[0_0_10px_#00f0ff]',
    cyan:    'shadow-[0_0_10px_#00f0ff]',
    orange:  'shadow-[0_0_10px_#ff7b00]',
    emerald: 'shadow-[0_0_10px_#00ff88]',
    indigo:  'shadow-[0_0_10px_#b829dd]',
    amber:   'shadow-[0_0_10px_#f0e800]',
    green:   'shadow-[0_0_10px_#00ff88]',
    rose:    'shadow-[0_0_10px_#ff00a0]',
  };

  const glowColorMap: Record<string, string> = {
    blue:    'bg-neon-cyan',
    cyan:    'bg-neon-cyan',
    orange:  'bg-neon-orange',
    emerald: 'bg-neon-green',
    indigo:  'bg-neon-purple',
    amber:   'bg-neon-yellow',
    green:   'bg-neon-green',
    rose:    'bg-neon-magenta',
  };

  const gradient = colorMap[color] || colorMap.blue;
  const glowColor = glowColorMap[color] || glowColorMap.blue;
  const glowShadow = shadowMap[color] || shadowMap.blue;
  const raw = isNaN(value) ? 0 : value;
  const pct = Math.min(100, Math.max(0, raw));
  
  return (
    <div className="flex items-center gap-3 w-full group/progress">
      <div className="progress-bar flex-1 h-[7px] bg-slate-900 border border-slate-800 rounded-full overflow-hidden relative shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] as const }}
          className={`h-full rounded-full bg-gradient-to-r ${gradient} ${glowShadow} relative`}
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
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent z-10"
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <motion.span 
        key={pct}
        initial={{ opacity: 0, scale: 0.8, x: 5 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        className={cn(
          "text-[10px] font-black tracking-tighter tabular-nums min-w-[32px] text-right transition-colors duration-300",
          pct >= 100 ? 'text-neon-green' : 'text-slate-400',
          "group-hover/progress:text-white"
        )}
        style={pct >= 100 ? { textShadow: "0 0 6px rgba(0, 255, 136, 0.4)" } : {}}
      >
        {Math.round(pct)}%
      </motion.span>
    </div>
  );
}
