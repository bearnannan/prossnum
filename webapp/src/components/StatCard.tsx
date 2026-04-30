import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform, animate, useMotionValue } from 'framer-motion';

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration: 0.8,
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
      ease: [0.16, 1, 0.3, 1] as const
    });
    return () => controls.stop();
  }, [value]);

  return <>{displayValue}</>;
}

export function StatCard({ icon, iconFill, label, value, color, glowClass, className }: {
  icon: string; iconFill?: boolean; label: string; value: string | number;
  color: string; glowClass: string; className?: string;
}) {
  const isNumber = typeof value === 'number';
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseMove={handleMouseMove}
      className={`glass-panel p-5 flex items-center gap-4 interactive-card group overflow-hidden relative hover:${glowClass} animate-fade-in-up ${className || ''}`}
    >
      {/* Spotlight effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(250px circle at ${x}px ${y}px, rgba(59, 130, 246, 0.1), transparent 80%)`
          ),
        }}
      />

      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-premium-sm relative z-10`}>
        <span className="material-symbols-outlined text-white text-lg" style={iconFill ? { fontVariationSettings: "'FILL' 1" } : {}} aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="flex-1 min-w-0 relative z-10">
        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-semibold tracking-[0.05em] truncate">{label}</div>
        <h3 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-none mt-0.5" style={{ fontFamily: 'var(--font-headline)' }}>
          {isNumber ? <AnimatedNumber value={value as number} /> : value}
        </h3>
      </div>
    </motion.div>
  );
}

