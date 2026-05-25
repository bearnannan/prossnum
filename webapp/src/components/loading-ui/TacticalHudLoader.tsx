"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TacticalHudLoaderProps {
  label?: string;
  sublabel?: string;
  className?: string;
}

const PARTICLES = [
  { x: "18%", y: "24%", d: 0.1 },
  { x: "76%", y: "18%", d: 0.4 },
  { x: "68%", y: "72%", d: 0.8 },
  { x: "29%", y: "78%", d: 1.1 },
  { x: "51%", y: "32%", d: 1.4 },
  { x: "84%", y: "55%", d: 1.7 },
];

export default function TacticalHudLoader({
  label = "LOADING LIVE COORDINATES",
  sublabel = "Synchronizing OSM telemetry stream",
  className,
}: TacticalHudLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative flex h-full min-h-[320px] w-full items-center justify-center overflow-hidden bg-dark-base text-neon-cyan",
        className
      )}
    >
      <div className="absolute inset-0 bg-grid opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.14),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.68))]" />
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-neon-cyan/12 to-transparent"
        animate={{ y: ["-25%", "115%"], opacity: [0, 0.85, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
      />

      {PARTICLES.map((particle, index) => (
        <motion.span
          key={`${particle.x}-${particle.y}`}
          aria-hidden="true"
          className="absolute h-1.5 w-1.5 rounded-full bg-neon-cyan shadow-[0_0_12px_rgba(0,240,255,0.9)]"
          style={{ left: particle.x, top: particle.y }}
          animate={{
            opacity: [0.15, 1, 0.2],
            scale: [0.7, 1.55, 0.8],
            x: [0, index % 2 === 0 ? 14 : -12, 0],
            y: [0, index % 3 === 0 ? -10 : 9, 0],
          }}
          transition={{ duration: 2.2 + index * 0.16, delay: particle.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      <motion.div
        className="geo-corner relative w-[min(92vw,560px)] overflow-hidden rounded-lg border border-neon-cyan/25 bg-dark-surface/78 p-5 shadow-[0_0_30px_rgba(0,240,255,0.14),inset_0_0_28px_rgba(0,240,255,0.04)] backdrop-blur-xl sm:p-6"
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent" />
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,240,255,0.055)_1px,transparent_1px)] bg-[length:100%_8px] opacity-70" />

        <div className="relative grid grid-cols-[112px_minmax(0,1fr)] items-center gap-5 max-sm:grid-cols-1">
          <div className="relative mx-auto h-28 w-28">
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-neon-cyan/35"
              animate={{ scale: [0.86, 1.08, 0.86], opacity: [0.35, 0.85, 0.35] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute inset-2 rounded-full border border-dashed border-neon-yellow/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute inset-5 rounded-full border border-neon-magenta/30"
              animate={{ rotate: -360 }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-12 w-[2px] origin-bottom rounded-full bg-gradient-to-t from-neon-cyan via-neon-cyan/70 to-transparent shadow-[0_0_14px_rgba(0,240,255,0.8)]"
              style={{ transformOrigin: "50% 100%" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-cyan shadow-[0_0_18px_rgba(0,240,255,0.9)]"
              animate={{ scale: [0.8, 1.35, 0.8], opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
            {[0, 90, 180, 270].map((degree) => (
              <span
                key={degree}
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-[1px] w-14 origin-left bg-neon-cyan/20"
                style={{ transform: `rotate(${degree}deg)` }}
              />
            ))}
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-neon-yellow">
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-neon-yellow shadow-[0_0_10px_rgba(240,232,0,0.85)]"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.1, repeat: Infinity }}
              />
              Tactical Map Link
            </div>
            <motion.div
              className="font-mono text-sm font-black uppercase tracking-[0.26em] text-neon-cyan sm:text-base"
              animate={{ opacity: [0.72, 1, 0.72], x: [0, 1.5, -1.5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              {label}
            </motion.div>
            <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {sublabel}
            </div>

            <div className="mt-5 grid grid-cols-8 gap-1">
              {Array.from({ length: 8 }).map((_, index) => (
                <motion.span
                  key={index}
                  aria-hidden="true"
                  className="h-1.5 rounded-full bg-neon-cyan/20"
                  animate={{ backgroundColor: ["rgba(0,240,255,0.16)", "rgba(0,240,255,0.9)", "rgba(0,240,255,0.16)"] }}
                  transition={{ duration: 1.2, delay: index * 0.12, repeat: Infinity, ease: "easeInOut" }}
                />
              ))}
            </div>

            <div className="mt-4 h-1 overflow-hidden rounded-full bg-neon-cyan/10">
              <motion.div
                className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-neon-cyan to-neon-yellow shadow-[0_0_12px_rgba(0,240,255,0.75)]"
                animate={{ x: ["-100%", "320%"] }}
                transition={{ duration: 1.35, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      <span className="sr-only">{label}</span>
    </div>
  );
}
