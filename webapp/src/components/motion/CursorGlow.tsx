"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, useSpring, useMotionValue, useTransform, AnimatePresence } from "framer-motion";

export function CursorGlow() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number }[]>([]);

  const springConfig = { damping: 30, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Parallax multipliers for different layers
  const x1 = useTransform(smoothX, (val) => val * 1.05);
  const y1 = useTransform(smoothY, (val) => val * 1.05);
  const x2 = useTransform(smoothX, (val) => val * 0.95);
  const y2 = useTransform(smoothY, (val) => val * 0.95);
  const x3 = useTransform(smoothX, (val) => val * 0.85);
  const y3 = useTransform(smoothY, (val) => val * 0.85);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleClick = (e: MouseEvent) => {
      const id = Date.now();
      setClicks((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setClicks((prev) => prev.filter((click) => click.id !== id));
      }, 1000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleClick);
    };
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {/* ─── Layers ─── */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full blur-[140px] bg-orange-500/10 dark:bg-orange-600/5"
        style={{ x: x1, y: y1, left: -400, top: -400 }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[100px] bg-amber-500/15 dark:bg-amber-600/10"
        style={{ x: x2, y: y2, left: -300, top: -300 }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[80px] bg-orange-400/20 dark:bg-orange-500/15"
        style={{ x: x3, y: y3, left: -200, top: -200 }}
      />

      {/* ─── Click Blooms ─── */}
      <AnimatePresence>
        {clicks.map((click) => (
          <motion.div
            key={click.id}
            initial={{ opacity: 0.8, scale: 0, x: click.x, y: click.y }}
            animate={{ opacity: 0, scale: 4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
            className="absolute w-20 h-20 bg-orange-400/30 rounded-full blur-2xl left-[-40px] top-[-40px]"
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

