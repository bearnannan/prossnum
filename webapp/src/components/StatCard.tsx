import React, { useEffect, useState } from 'react';
import { motion, useTransform, animate, useMotionValue } from 'framer-motion';
import { GlassCard } from './ui/GlassCard';

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration: 0.8,
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
      ease: [0.16, 1, 0.3, 1] as const
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{displayValue}</>;
}

export function StatCard({ icon, iconFill, label, value, color, glowClass, className }: {
  icon: string; iconFill?: boolean; label: string; value: string | number;
  color: string; glowClass: string; className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        setMounted(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const isNumber = typeof value === 'number';
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  // Map old tailwind classes to the new GlassCard neon glow presets
  const glowMap: Record<string, 'cyan' | 'magenta' | 'green' | 'yellow' | 'purple' | 'none'> = {
    'glow-blue':    'cyan',
    'glow-indigo':  'purple',
    'glow-emerald': 'green',
    'glow-amber':   'yellow',
    'glow-cyan':    'cyan',
    'glow-orange':  'purple',
    'glow-green':   'green',
    'glow-rose':    'magenta',
  };

  const glowPreset = glowMap[glowClass] || 'none';

  // Map color presets to bright borders and inner glows
  const cardStyleMap: Record<string, string> = {
    'cyan':    'border-neon-cyan/20! shadow-[0_4px_24px_rgba(0,0,0,0.5),_inset_0_0_12px_rgba(0,240,255,0.08)]!',
    'magenta': 'border-neon-magenta/20! shadow-[0_4px_24px_rgba(0,0,0,0.5),_inset_0_0_12px_rgba(255,0,160,0.08)]!',
    'green':   'border-neon-green/20! shadow-[0_4px_24px_rgba(0,0,0,0.5),_inset_0_0_12px_rgba(0,255,136,0.08)]!',
    'yellow':  'border-neon-yellow/20! shadow-[0_4px_24px_rgba(0,0,0,0.5),_inset_0_0_12px_rgba(240,232,0,0.08)]!',
    'purple':  'border-neon-purple/20! shadow-[0_4px_24px_rgba(0,0,0,0.5),_inset_0_0_12px_rgba(184,41,221,0.08)]!',
    'none':    '',
  };
  const cardStyle = cardStyleMap[glowPreset] || '';

  // Map background gradient classes to cyberpunk neon borders
  const iconColorMap: Record<string, string> = {
    'from-blue-500 to-indigo-600': 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]',
    'from-indigo-500 to-violet-600': 'bg-neon-purple/20 border-neon-purple text-neon-purple shadow-[0_0_10px_rgba(184,41,221,0.2)]',
    'from-emerald-500 to-teal-600': 'bg-neon-green/20 border-neon-green text-neon-green shadow-[0_0_10px_rgba(0,255,136,0.2)]',
    'from-amber-500 to-orange-600': 'bg-neon-yellow/20 border-neon-yellow text-neon-yellow shadow-[0_0_10px_rgba(240,232,0,0.2)]',
    'from-cyan-500 to-blue-600': 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]',
    'from-orange-500 to-rose-600': 'bg-neon-orange/20 border-neon-orange text-neon-orange shadow-[0_0_10px_rgba(255,123,0,0.2)]',
    'from-emerald-500 to-green-600': 'bg-neon-green/20 border-neon-green text-neon-green shadow-[0_0_10px_rgba(0,255,136,0.2)]',
  };

  const iconStyle = iconColorMap[color] || 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseMove={handleMouseMove}
      className={`interactive-card group relative animate-fade-in-up ${className || ''}`}
    >
      <GlassCard 
        glow={glowPreset} 
        padding={true} 
        hover={true} 
        geo={true}
        className={`flex items-center gap-4 bg-dark-surface/60 overflow-hidden ${cardStyle}`}
      >
        {/* Spotlight effect */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: useTransform(
              [mouseX, mouseY],
              ([x, y]) => `radial-gradient(200px circle at ${x}px ${y}px, rgba(0, 240, 255, 0.08), transparent 80%)`
            ),
          }}
        />

        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center relative z-10 ${iconStyle}`}>
          <span className="material-symbols-outlined text-lg" style={iconFill ? { fontVariationSettings: "'FILL' 1" } : {}} aria-hidden="true">
            {icon}
          </span>
        </div>
        <div className="flex-1 min-w-0 relative z-10">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.05em] truncate">{label}</div>
          <h3 
            className="text-2xl font-extrabold tracking-tight text-white leading-none mt-0.5" 
            style={{ 
              fontFamily: 'var(--font-display)',
              textShadow: "0 0 8px rgba(255, 255, 255, 0.1)"
            }}
          >
            {mounted ? (isNumber ? <AnimatedNumber value={value as number} /> : value) : "--"}
          </h3>
        </div>
      </GlassCard>
    </motion.div>
  );
}
