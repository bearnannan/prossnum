# design-system-retro-neon.md — Tech Stack + Retro Neon Design System
# codename: NEXCORE | Retro Neon Aesthetic v2.1

---

## Overview

Nexus IMS ใช้ **Ant Design 6** เป็น base component และ **Tailwind CSS v4** สำหรับ layout/override
Design direction: **Retro Neon Cyberpunk** — dark foundation กับ neon accents ที่ตัดกันอย่างชัดเจน

> ⚠️ อัปเดตครั้งใหญ่: เปลี่ยนจาก "Neon Glass Enterprise" (light bg) เป็น "Retro Neon" (dark bg)

---

## 1. Tech Stack

```txt
Frontend:    Next.js 16 (App Router) + React 19 + TypeScript 5
UI Base:     Ant Design 6.x
UI Utility:  Tailwind CSS v4
State:       Zustand
Deploy:      Vercel
```

### Stack Responsibility

| Layer | Tool | ใช้ทำอะไร |
|---|---|---|
| Frontend | Next.js 16 App Router | โครงสร้าง route, layout, server/client boundary และ deploy บน Vercel |
| React | React 19 | Component architecture สำหรับ dashboard และ interaction |
| Language | TypeScript 5 | Type safety สำหรับ role, status, priority, config และ API data |
| UI Base | Ant Design 6.x | Component enterprise เช่น Table, Form, Modal, Menu, Select, DatePicker |
| UI Utility | Tailwind CSS v4 | Layout, spacing, responsive, custom neon theme, glow, grid และ override visual |
| State | Zustand | Client state เช่น sidebar, filter, modal, command palette, selected item |
| Deploy | Vercel | Hosting และ CI/CD สำหรับ Next.js |

### Design Responsibility

```txt
Ant Design  = component behavior + accessibility + enterprise pattern
Tailwind    = visual identity + layout + retro neon styling
Zustand     = lightweight client-side state
```

> ใช้ Ant Design เป็นฐาน component แล้วใช้ Tailwind CSS v4 คุม mood แบบ Retro Neon เพื่อไม่ต้อง override Ant Design กระจัดกระจาย

---

## 2. Retro Neon Design Direction

### Visual Keywords

```txt
dark / cyberpunk / neon glow / grid / geometric / high contrast / futuristic dashboard
```

### Mood

- พื้นหลังต้องมืดเป็นหลัก
- ใช้ neon เป็น accent ไม่ใช่สีพื้นหลักทั้งหน้า
- ใช้ glow กับ action, active state, badge, alert และ priority
- Body text ไม่ควรใส่ glow เพื่อให้อ่านง่าย
- Dashboard ต้องยังดูเป็น enterprise system ไม่ใช่ game UI เต็มรูปแบบ

### Neon Role

| Color | Role |
|---|---|
| Cyan | Primary action, active state, focus, link |
| Magenta | Critical, alert, notification |
| Green | Success, resolved |
| Yellow | Warning, in progress |
| Orange | High priority |
| Purple | Assigned, secondary accent |

## 3. Color Tokens — Retro Neon Palette

```css
/* globals.css — Tailwind v4 @theme */
@import "tailwindcss";

@theme {
  /* ═══════════════════════════════════════
     NEON CORE — สีหลักที่เรืองแสง
     ═══════════════════════════════════════ */
  --color-neon-cyan:       #00f0ff;
  --color-neon-magenta:    #ff00a0;
  --color-neon-yellow:     #f0e800;
  --color-neon-green:      #00ff88;
  --color-neon-purple:     #b829dd;
  --color-neon-orange:     #ff7b00;

  /* Glow variants (lower opacity for backgrounds) */
  --color-neon-cyan-glow:    rgba(0, 240, 255, 0.15);
  --color-neon-magenta-glow: rgba(255, 0, 160, 0.15);
  --color-neon-yellow-glow:  rgba(240, 232, 0, 0.15);
  --color-neon-green-glow:   rgba(0, 255, 136, 0.15);
  --color-neon-purple-glow:  rgba(184, 41, 221, 0.15);

  /* ═══════════════════════════════════════
     DARK FOUNDATION — พื้นหลังมืดทั้งระบบ
     ═══════════════════════════════════════ */
  --color-dark-base:       #0a0a0f;
  --color-dark-elevated:   #12121a;
  --color-dark-surface:    #1a1a25;
  --color-dark-border:     rgba(255, 255, 255, 0.08);
  --color-dark-border-hover: rgba(0, 240, 255, 0.25);

  /* ═══════════════════════════════════════
     SEMANTIC MAPPING — สถานะต่างๆ
     ═══════════════════════════════════════ */
  --color-priority-critical: #ff00a0;  /* magenta neon */
  --color-priority-high:     #ff7b00;  /* orange neon */
  --color-priority-medium:   #00f0ff;  /* cyan neon */
  --color-priority-low:      #6b7280;  /* muted gray */

  --color-status-new:         #00f0ff;
  --color-status-assigned:    #b829dd;
  --color-status-in_progress: #f0e800;
  --color-status-pending:     #6b7280;
  --color-status-resolved:    #00ff88;
  --color-status-closed:      #059669;
  --color-status-cancelled:   #4b5563;

  /* ═══════════════════════════════════════
     TYPOGRAPHY
     ═══════════════════════════════════════ */
  --font-display: "Orbitron", "DM Sans", system-ui, sans-serif;
  --font-body:    "Inter", system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", "Courier New", monospace;

  /* ═══════════════════════════════════════
     NEON SHADOWS / GLOW PRESETS
     ═══════════════════════════════════════ */
  --shadow-neon-cyan:    0 0 5px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.3), 0 0 40px rgba(0, 240, 255, 0.1);
  --shadow-neon-magenta: 0 0 5px rgba(255, 0, 160, 0.5), 0 0 20px rgba(255, 0, 160, 0.3), 0 0 40px rgba(255, 0, 160, 0.1);
  --shadow-neon-green:   0 0 5px rgba(0, 255, 136, 0.5), 0 0 20px rgba(0, 255, 136, 0.3), 0 0 40px rgba(0, 255, 136, 0.1);
  --shadow-neon-yellow:  0 0 5px rgba(240, 232, 0, 0.5), 0 0 20px rgba(240, 232, 0, 0.3), 0 0 40px rgba(240, 232, 0, 0.1);
  --shadow-neon-purple:  0 0 5px rgba(184, 41, 221, 0.5), 0 0 20px rgba(184, 41, 221, 0.3), 0 0 40px rgba(184, 41, 221, 0.1);

  --shadow-card:         0 4px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
  --shadow-card-hover:   0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 240, 255, 0.1);
}
```

---

## 4. Typography — Retro Tech

```css
@layer base {
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

  body {
    background-color: var(--color-dark-base);
    color: #e2e8f0;
    font-family: var(--font-body);
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
    letter-spacing: 0.02em;
  }

  /* Neon text glow for headings */
  .neon-text-cyan {
    color: var(--color-neon-cyan);
    text-shadow: 0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.3);
  }

  .neon-text-magenta {
    color: var(--color-neon-magenta);
    text-shadow: 0 0 10px rgba(255, 0, 160, 0.5), 0 0 20px rgba(255, 0, 160, 0.3);
  }
}
```

---

## 5. Background Patterns — Grid & Geometric

```css
@layer utilities {
  /* ═══════════════════════════════════════
     RETRO GRID BACKGROUND
     ═══════════════════════════════════════ */
  .bg-grid {
    background-image: 
      linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .bg-grid-fine {
    background-image: 
      linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px);
    background-size: 20px 20px;
  }

  /* Perspective grid (floor effect) */
  .bg-grid-perspective {
    background-image: 
      linear-gradient(rgba(0, 240, 255, 0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 240, 255, 0.06) 1px, transparent 1px);
    background-size: 60px 60px;
    transform: perspective(500px) rotateX(60deg);
    transform-origin: center top;
  }

  /* ═══════════════════════════════════════
     GEOMETRIC ACCENTS
     ═══════════════════════════════════════ */
  .geo-corner {
    position: relative;
  }
  .geo-corner::before,
  .geo-corner::after {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    border: 2px solid var(--color-neon-cyan);
  }
  .geo-corner::before {
    top: -1px; left: -1px;
    border-right: 0; border-bottom: 0;
  }
  .geo-corner::after {
    bottom: -1px; right: -1px;
    border-left: 0; border-top: 0;
  }

  /* Lightning line decoration */
  .lightning-line {
    position: relative;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--color-neon-cyan), transparent);
    box-shadow: 0 0 8px var(--color-neon-cyan);
  }

  /* Hexagon pattern overlay */
  .bg-hexagon {
    background-image: url("data:image/svg+xml,%3Csvg width='28' height='49' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300f0ff' fill-opacity='0.04'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-7.5L27.99 34H28v2.31h-.01L17 42.65V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
}
```

---

## 6. GlassCard — Dark Neon Variant

```tsx
// src/components/ui/GlassCard.tsx
import { cn } from "@/lib/utils/cn";

interface GlassCardProps {
  children:  React.ReactNode;
  className?: string;
  hover?:     boolean;
  padding?:   boolean;
  glow?:      'cyan' | 'magenta' | 'green' | 'yellow' | 'purple' | 'none';
  geo?:       boolean; // แสดงมุม geometric
}

export function GlassCard({ 
  children, 
  className, 
  hover = true, 
  padding = true,
  glow = 'none',
  geo = false,
}: GlassCardProps) {
  const glowStyles = {
    cyan:    'hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] hover:border-neon-cyan/30',
    magenta: 'hover:shadow-[0_0_20px_rgba(255,0,160,0.15)] hover:border-neon-magenta/30',
    green:   'hover:shadow-[0_0_20px_rgba(0,255,136,0.15)] hover:border-neon-green/30',
    yellow:  'hover:shadow-[0_0_20px_rgba(240,232,0,0.15)] hover:border-neon-yellow/30',
    purple:  'hover:shadow-[0_0_20px_rgba(184,41,221,0.15)] hover:border-neon-purple/30',
    none:    'hover:shadow-card-hover',
  };

  return (
    <div
      className={cn(
        "rounded-xl relative",
        padding && "p-6",
        "bg-dark-surface/80 backdrop-blur-[16px]",
        "border border-dark-border",
        "shadow-card",
        "transition-all duration-300",
        hover && "hover:-translate-y-0.5",
        hover && glowStyles[glow],
        geo && "geo-corner",
        className
      )}
    >
      {children}
    </div>
  );
}
```

---

## 7. StatusBadge & PriorityBadge — Neon Glow

```tsx
// src/components/ui/StatusBadge.tsx
import { STATUS_CONFIG } from "@/config/incident.config";

export function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status];
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

// src/components/ui/PriorityBadge.tsx
import { PRIORITY_CONFIG } from "@/config/incident.config";

export function PriorityBadge({ priority }: { priority: keyof typeof PRIORITY_CONFIG }) {
  const cfg = PRIORITY_CONFIG[priority];
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
```

---

## 8. SLATimer — Neon Progress Bar

```tsx
// src/components/ui/SLATimer.tsx
"use client";

import { useEffect, useState } from "react";
import { getSLAProgress } from "@/lib/utils/sla";

interface SLATimerProps {
  createdAt: string;
  dueAt:     string;
  label?:    string;
}

export function SLATimer({ createdAt, dueAt, label = "SLA" }: SLATimerProps) {
  const [progress, setProgress] = useState(() =>
    getSLAProgress(new Date(createdAt), new Date(dueAt))
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(getSLAProgress(new Date(createdAt), new Date(dueAt)));
    }, 30_000);
    return () => clearInterval(timer);
  }, [createdAt, dueAt]);

  const COLOR = {
    ok:       "#00ff88",
    warning:  "#f0e800",
    breached: "#ff00a0",
  }[progress.status];

  const remainingHrs = Math.floor(progress.remainingMs / 3_600_000);
  const remainingMin = Math.floor((progress.remainingMs % 3_600_000) / 60_000);

  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
      <div className="flex justify-between text-[10px] font-bold tracking-wider uppercase">
        <span className="text-slate-400">{label}</span>
        <span style={{ color: COLOR, textShadow: `0 0 6px ${COLOR}80` }}>
          {progress.status === "breached"
            ? "BREACHED"
            : `${remainingHrs}H ${remainingMin}M`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
        <div
          className="h-full rounded-full transition-all duration-500 relative"
          style={{
            width:      `${progress.pct * 100}%`,
            background: `linear-gradient(90deg, ${COLOR}80, ${COLOR})`,
            boxShadow:  `0 0 10px ${COLOR}, 0 0 20px ${COLOR}40`,
          }}
        >
          {/* Scan line effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
```

---

## 9. Header — Dark Neon Nav

```tsx
// src/components/layout/Header.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

const navVariants = {
  hidden:  { y: -60, opacity: 0, filter: "blur(10px)" },
  visible: {
    y: 0, opacity: 1, filter: "blur(0px)",
    transition: { duration: 1.0, ease: [0.22, 1, 0.36, 1] as const },
  },
};

interface HeaderProps {
  user: {
    id:         string;
    full_name:  string | null;
    avatar_url: string | null;
    email:      string;
  };
  role: string;
  onMenuToggle?: () => void;
}

export default function Header({ user, role, onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const supabase = createClient();

  const ROLE_LABEL: Record<string, string> = {
    super_admin: "SUPER ADMIN",
    admin:       "ADMIN",
    supervisor:  "SUPERVISOR",
    technician:  "TECHNICIAN",
    viewer:      "VIEWER",
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  };

  return (
    <motion.nav
      variants={navVariants}
      initial="hidden"
      animate="visible"
      className="fixed top-0 w-full z-50 h-16 flex justify-between items-center px-4 sm:px-8"
      style={{
        background:           "rgba(10, 10, 15, 0.85)",
        backdropFilter:       "blur(24px) saturate(1.5)",
        WebkitBackdropFilter: "blur(24px) saturate(1.5)",
        borderBottom:         "1px solid rgba(0, 240, 255, 0.15)",
        boxShadow:            "0 0 20px rgba(0, 240, 255, 0.05), 0 4px 16px rgba(0,0,0,0.5)",
      }}
    >
      {/* Left: Hamburger + Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-400 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-xl transition-all duration-200"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <Link href="/dashboard" className="flex items-center gap-2.5">
          {/* Nexus hexagon logo — neon cyan */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.4)]"
            style={{ background: "linear-gradient(135deg, #00f0ff20, #00f0ff40)", border: "1px solid rgba(0,240,255,0.3)" }}>
            <svg width="18" height="18" viewBox="0 0 40 44" fill="none">
              <polygon points="20,2 38,12 38,32 20,42 2,32 2,12"
                stroke="#00f0ff" strokeWidth="2" fill="rgba(0,240,255,0.1)" 
                style={{ filter: "drop-shadow(0 0 4px rgba(0,240,255,0.6))" }} />
              <circle cx="20" cy="22" r="4" fill="#00f0ff" 
                style={{ filter: "drop-shadow(0 0 6px rgba(0,240,255,0.8))" }} />
            </svg>
          </div>
          <div>
            <span className="text-base font-extrabold tracking-wider text-white"
              style={{ textShadow: "0 0 10px rgba(0,240,255,0.3)" }}>
              NEXUS
            </span>
            <span className="hidden sm:inline text-[10px] font-bold text-neon-cyan ml-1.5 px-1.5 py-0.5 bg-neon-cyan/10 rounded-md tracking-widest uppercase border border-neon-cyan/30"
              style={{ boxShadow: "0 0 8px rgba(0,240,255,0.1)" }}>
              IMS
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Nav Links (RBAC-aware) */}
      <div className="hidden md:flex items-center gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <NavPill href="/dashboard"  label="DASHBOARD" />
        <NavPill href="/incidents"  label="INCIDENTS" />
        {["super_admin","admin","supervisor"].includes(role) && (
          <NavPill href="/reports" label="REPORTS" />
        )}
        {["super_admin","admin"].includes(role) && (
          <NavPill href="/users" label="USERS" />
        )}
      </div>

      {/* Right: Notification + Settings + User */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Notification Bell */}
        <button className="hidden sm:flex p-2 text-slate-400 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-xl transition-all duration-200 relative">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-neon-magenta shadow-[0_0_6px_#ff00a0] ring-2 ring-dark-base" />
        </button>

        {/* Settings */}
        <button className="hidden sm:flex p-2 text-slate-400 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-xl transition-all duration-200">
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>

        {/* User Profile + Logout */}
        <div className="flex items-center gap-3 ml-2 pl-3 border-l border-slate-700">
          <div className="hidden sm:flex flex-col items-end text-right">
            <div className="text-xs font-bold text-white tracking-wide leading-none"
              style={{ textShadow: "0 0 6px rgba(255,255,255,0.2)" }}>
              {user.full_name || user.email}
            </div>
            <span className="text-[9px] font-bold text-neon-cyan/70 uppercase tracking-widest mt-0.5">
              {ROLE_LABEL[role] ?? role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            disabled={isPending}
            title={`${user.full_name || user.email} · Click to logout`}
            className="group relative w-9 h-9 rounded-xl overflow-hidden border border-slate-600 hover:border-neon-magenta/50 transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: user.avatar_url
                ? "transparent"
                : "linear-gradient(135deg, #ff00a020, #b829dd40)",
              boxShadow: user.avatar_url ? "none" : "0 0 10px rgba(255,0,160,0.2)",
            }}
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || "User"}
                className="w-full h-full object-cover group-hover:opacity-40 transition-opacity duration-300"
              />
            ) : (
              <span className="material-symbols-outlined text-neon-magenta text-sm"
                style={{ textShadow: "0 0 4px rgba(255,0,160,0.5)" }}>
                person
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
              <span className="material-symbols-outlined text-neon-magenta text-base"
                style={{ textShadow: "0 0 6px rgba(255,0,160,0.6)" }}>logout</span>
            </div>
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

function NavPill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all duration-200",
        "text-slate-400 hover:text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-[0_0_8px_rgba(0,240,255,0.15)]"
      )}
    >
      {label}
    </Link>
  );
}
```

---

## 10. Ghost Sidebar — Dark Neon

```tsx
// src/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/dashboard",        icon: "dashboard",      label: "Dashboard",       roles: ["*"] },
  { href: "/incidents",        icon: "report",         label: "Incidents",       roles: ["*"] },
  { href: "/incidents/new",    icon: "add_circle",     label: "New Incident",    roles: ["super_admin","admin","supervisor","technician"] },
  { href: "/users",            icon: "group",          label: "Users",           roles: ["super_admin","admin"] },
  { href: "/roles",            icon: "shield_person",  label: "Roles",           roles: ["super_admin"] },
  { href: "/equipment-types",  icon: "hardware",       label: "Equipment",       roles: ["super_admin","admin"] },
  { href: "/sla",              icon: "timer",          label: "SLA Policies",    roles: ["super_admin","admin"] },
  { href: "/zones",            icon: "location_on",    label: "Zones",           roles: ["super_admin","admin"] },
  { href: "/reports",          icon: "bar_chart",      label: "Reports",         roles: ["super_admin","admin","supervisor","viewer"] },
  { href: "/invitations",      icon: "mail",           label: "Invitations",     roles: ["super_admin","admin"] },
  { href: "/notifications",    icon: "notifications",  label: "Notifications",   roles: ["*"] },
  { href: "/settings",         icon: "settings",       label: "Settings",        roles: ["super_admin","admin"] },
];

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.includes("*") || item.roles.includes(role)
  );

  return (
    <aside
      className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-60 flex flex-col py-4 px-3 overflow-y-auto bg-grid"
      style={{
        background:     "rgba(10, 10, 15, 0.60)",
        backdropFilter: "blur(16px)",
        borderRight:    "1px solid rgba(0, 240, 255, 0.10)",
        boxShadow:      "inset -10px 0 20px rgba(0,0,0,0.3), 0 0 20px rgba(0,240,255,0.03)",
      }}
    >
      {/* Lightning line top */}
      <div className="lightning-line mb-4 opacity-50" />

      <nav className="flex flex-col gap-0.5">
        {visibleItems.map(item => {
          const isActive = pathname === item.href ||
                           (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                "text-sm font-medium transition-all duration-200 relative",
                isActive
                  ? "bg-neon-cyan/10 text-neon-cyan font-semibold border border-neon-cyan/20"
                  : "text-slate-400 hover:bg-neon-cyan/5 hover:text-neon-cyan/80"
              )}
              style={isActive ? { 
                boxShadow: "0 0 12px rgba(0,240,255,0.1), inset 0 0 8px rgba(0,240,255,0.05)",
                textShadow: "0 0 4px rgba(0,240,255,0.3)"
              } : {}}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              {item.label}
              {isActive && (
                <span className="absolute right-2 w-1 h-4 rounded-full bg-neon-cyan shadow-[0_0_6px_#00f0ff]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom lightning line */}
      <div className="mt-auto lightning-line opacity-30" />
    </aside>
  );
}
```

---

## 11. Ant Design v6 Theme — Dark Neon Override

```typescript
// src/providers/AntdProvider.tsx
const nexcoreTheme = {
  token: {
    colorPrimary:     "#00f0ff",
    colorBgContainer: "rgba(26, 26, 37, 0.80)",
    colorBgElevated:  "rgba(18, 18, 26, 0.95)",
    colorText:        "#e2e8f0",
    colorTextSecondary: "#94a3b8",
    colorBorder:      "rgba(0, 240, 255, 0.15)",
    colorBorderSecondary: "rgba(255, 255, 255, 0.08)",
    borderRadius:     8,
    fontFamily:       '"Inter", system-ui, sans-serif',
    fontSize:         14,
    boxShadow:        "0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,240,255,0.05)",
    boxShadowSecondary: "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(0,240,255,0.08)",
  },
  components: {
    Table: {
      headerBg:   "rgba(0, 240, 255, 0.04)",
      rowHoverBg: "rgba(0, 240, 255, 0.04)",
      colorText:  "#e2e8f0",
      headerColor: "#00f0ff",
      borderColor: "rgba(0, 240, 255, 0.10)",
      stickyScrollBarBg: "rgba(0, 240, 255, 0.20)",
    },
    Modal: {
      contentBg: "rgba(18, 18, 26, 0.95)",
      headerBg:  "transparent",
      footerBg:  "transparent",
      titleColor: "#00f0ff",
      boxShadow: "0 0 40px rgba(0,240,255,0.1), 0 25px 50px rgba(0,0,0,0.5)",
    },
    Menu: {
      itemBg:            "transparent",
      itemHoverBg:       "rgba(0, 240, 255, 0.06)",
      itemSelectedBg:    "rgba(0, 240, 255, 0.12)",
      itemSelectedColor: "#00f0ff",
      groupTitleColor:   "rgba(0, 240, 255, 0.50)",
    },
    Form: {
      itemMarginBottom: 20,
      verticalLabelPadding: "0 0 4px",
      labelColor: "#94a3b8",
    },
    Input: {
      colorBgContainer: "rgba(10, 10, 15, 0.60)",
      colorBorder:      "rgba(0, 240, 255, 0.20)",
      colorText:        "#e2e8f0",
      activeBorderColor: "#00f0ff",
      hoverBorderColor: "rgba(0, 240, 255, 0.40)",
      boxShadow: "0 0 0 2px rgba(0,240,255,0.10)",
    },
    Button: {
      primaryColor: "#0a0a0f",
      primaryBg:    "#00f0ff",
      primaryShadow: "0 0 10px rgba(0,240,255,0.3)",
    },
    Select: {
      colorBgContainer: "rgba(10, 10, 15, 0.60)",
      colorBorder:      "rgba(0, 240, 255, 0.20)",
      colorText:        "#e2e8f0",
      optionSelectedBg: "rgba(0, 240, 255, 0.12)",
      optionSelectedColor: "#00f0ff",
    },
    Card: {
      colorBgContainer: "rgba(26, 26, 37, 0.60)",
      colorBorderSecondary: "rgba(0, 240, 255, 0.10)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,240,255,0.05)",
    },
  },
};
```

---

## 12. Login Page — Retro Neon Dark

```css
/* Login page specific styles */
.login-page {
  background: 
    radial-gradient(ellipse at 20% 50%, rgba(184, 41, 221, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 50%, rgba(0, 240, 255, 0.10) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 100%, rgba(255, 0, 160, 0.08) 0%, transparent 50%),
    linear-gradient(180deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%);
  position: relative;
  overflow: hidden;
}

/* Animated grid floor */
.login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  transform: perspective(500px) rotateX(60deg);
  transform-origin: center bottom;
  animation: gridScroll 20s linear infinite;
  pointer-events: none;
}

@keyframes gridScroll {
  0% { background-position: 0 0; }
  100% { background-position: 0 50px; }
}

/* Floating geometric shapes */
.login-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  animation: floatOrb 8s ease-in-out infinite;
}
.login-orb-1 {
  width: 300px; height: 300px;
  background: rgba(0, 240, 255, 0.08);
  top: -10%; right: -5%;
  animation-delay: 0s;
}
.login-orb-2 {
  width: 250px; height: 250px;
  background: rgba(255, 0, 160, 0.06);
  bottom: -10%; left: -5%;
  animation-delay: 2s;
}
.login-orb-3 {
  width: 200px; height: 200px;
  background: rgba(184, 41, 221, 0.07);
  top: 40%; left: 30%;
  animation-delay: 4s;
}

@keyframes floatOrb {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

/* Login card */
.login-card {
  background: rgba(18, 18, 26, 0.80);
  backdrop-filter: blur(40px) saturate(1.5);
  border: 1px solid rgba(0, 240, 255, 0.15);
  box-shadow: 
    0 8px 32px rgba(0,0,0,0.5), 
    0 32px 64px rgba(0,0,0,0.3),
    0 0 40px rgba(0,240,255,0.05),
    inset 0 1px 0 rgba(255,255,255,0.05);
}

/* Neon buttons */
.btn-neon-line {
  background: linear-gradient(135deg, #06C755, #04A847);
  box-shadow: 0 0 15px rgba(6, 199, 85, 0.3);
  border: none;
  position: relative;
  overflow: hidden;
}
.btn-neon-line:hover {
  box-shadow: 0 0 25px rgba(6, 199, 85, 0.5);
  transform: scale(1.02);
}
.btn-neon-line::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s;
}
.btn-neon-line:hover::after {
  transform: translateX(100%);
}

.btn-neon-google {
  background: linear-gradient(135deg, #4285F4, #1a73e8);
  box-shadow: 0 0 15px rgba(66, 133, 244, 0.3);
  border: none;
}
.btn-neon-google:hover {
  box-shadow: 0 0 25px rgba(66, 133, 244, 0.5);
  transform: scale(1.02);
}
```

---

## 13. Animation Utilities — Retro Neon

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); filter: blur(4px); }
  to   { opacity: 1; transform: translateY(0); filter: blur(0); }
}

@keyframes neonPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes neonFlicker {
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
  20%, 24%, 55% { opacity: 0.4; }
}

@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}

@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

@keyframes borderGlow {
  0%, 100% { border-color: rgba(0, 240, 255, 0.2); box-shadow: 0 0 5px rgba(0,240,255,0.1); }
  50% { border-color: rgba(0, 240, 255, 0.4); box-shadow: 0 0 15px rgba(0,240,255,0.2); }
}

/* Utility classes */
.animate-neon-pulse {
  animation: neonPulse 2s ease-in-out infinite;
}

.animate-neon-flicker {
  animation: neonFlicker 3s linear infinite;
}

.animate-border-glow {
  animation: borderGlow 3s ease-in-out infinite;
}

.animate-shimmer {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  background-size: 200% 100%;
  animation: shimmer 2s linear infinite;
}
```

---

## 14. Incident Config — Updated Neon Colors

```typescript
// src/config/incident.config.ts
export const PRIORITY_CONFIG = {
  critical: { 
    label: 'CRITICAL', 
    color: '#ff00a0', 
    bg: 'rgba(255,0,160,0.12)',   
    glow: '0 0 12px rgba(255,0,160,0.4)'   
  },
  high:     { 
    label: 'HIGH',     
    color: '#ff7b00', 
    bg: 'rgba(255,123,0,0.12)',  
    glow: '0 0 12px rgba(255,123,0,0.35)' 
  },
  medium:   { 
    label: 'MEDIUM',   
    color: '#00f0ff', 
    bg: 'rgba(0,240,255,0.12)',  
    glow: '0 0 12px rgba(0,240,255,0.35)' 
  },
  low:      { 
    label: 'LOW',      
    color: '#6b7280', 
    bg: 'rgba(107,114,128,0.08)', 
    glow: 'none'                           
  },
} as const;

export const STATUS_CONFIG = {
  new:         { label: 'NEW',         color: '#00f0ff' },
  assigned:    { label: 'ASSIGNED',    color: '#b829dd' },
  in_progress: { label: 'IN PROGRESS', color: '#f0e800' },
  pending:     { label: 'PENDING',     color: '#6b7280' },
  resolved:    { label: 'RESOLVED',    color: '#00ff88' },
  closed:      { label: 'CLOSED',      color: '#059669' },
  cancelled:   { label: 'CANCELLED',   color: '#4b5563' },
} as const;
```

---

## 15. Dashboard Layout — Dark Foundation

```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-base text-slate-200 bg-grid relative">
      {/* Ambient glow overlays */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-magenta/5 rounded-full blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header /* ... */ />
        <Sidebar /* ... */ />
        <main className="ml-60 pt-16 min-h-screen">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

---


---

## 16. Package Recommendation

```bash
npm install antd zustand clsx tailwind-merge
npm install -D tailwindcss
```

Optional animation:

```bash
npm install framer-motion
```

ใช้ `framer-motion` เฉพาะ page transition, header, modal หรือ micro-interaction ที่จำเป็นเท่านั้น

---

## 17. Implementation Checklist

- [ ] ตั้งค่า `@theme` ใน `app/globals.css`
- [ ] ตั้งค่า `AntdProvider` ด้วย `theme.darkAlgorithm`
- [ ] ใช้ `bg-dark-base` เป็นพื้นหลังหลัก
- [ ] ใช้ `text-neon-cyan` สำหรับ primary active state
- [ ] ใช้ `text-neon-magenta` สำหรับ critical/alert
- [ ] ใช้ badge สีตาม `STATUS_CONFIG` และ `PRIORITY_CONFIG`
- [ ] ใช้ glow เฉพาะ component สำคัญ ไม่ใช้กับ body text
- [ ] รวม Ant Design override ไว้ที่ provider เดียว
- [ ] ใช้ Zustand สำหรับ UI state ที่เป็น client-side
- [ ] ตรวจ contrast ของ text/table/form ก่อน deploy

## Related Pages

- [flows/auth-flow.md](../flows/auth-flow.md) — Login page full implementation (updated for neon)
- [ui/page-map.md](page-map.md) — Routes + component tree
- [decisions/adr-001-stack.md](../decisions/adr-001-stack.md) — Stack selection
- [../log.md](../log.md) — Migration timeline
