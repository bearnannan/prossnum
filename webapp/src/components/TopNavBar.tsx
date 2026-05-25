"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Magnetic } from "./motion/Magnetic";
import SyncIndicator from "./SyncIndicator";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { AppRole } from "@/lib/rbac";

const navVariants = {
  hidden:  { y: -60, opacity: 0, filter: "blur(10px)" },
  visible: {
    y: 0, opacity: 1, filter: "blur(0px)",
    transition: { duration: 1.0, ease: [0.22, 1, 0.36, 1] as const },
  },
};

interface TopNavBarProps {
  onLogout?: () => void;
  onMenuToggle?: () => void;
  onSettingsClick?: () => void;
}

export default function TopNavBar({ onLogout, onMenuToggle, onSettingsClick }: TopNavBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();
  const { data: session } = useSession();
  const user = session?.user;
  const [appUser, setAppUser] = React.useState<{
    name: string | null;
    email: string | null;
    role: AppRole;
  } | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/user", { cache: "no-store" })
      .then((response) => response.json())
      .then((json) => {
        if (isMounted) setAppUser(json.user || null);
      })
      .catch(() => {
        if (isMounted) setAppUser(null);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = user?.name || user?.email || appUser?.name || appUser?.email || "User";
  const displayRole = appUser?.role || user?.role || "user";

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      if (session) {
        await signOut({ redirect: false });
      }
      startTransition(() => {
        router.replace('/login');
        router.refresh();
      });
    } catch (err) {
      console.error('Failed to log out', err);
    }
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

        <Link href="/" className="flex items-center gap-2.5">
          {/* Hexagon logo — neon cyan */}
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
            <motion.span 
              className="text-base font-black tracking-widest neon-text-cyan uppercase"
              animate={{ 
                textShadow: [
                  "0 0 8px rgba(0,240,255,0.55), 0 0 2px rgba(0,240,255,0.35)", 
                  "0 0 18px rgba(0,240,255,0.85), 0 0 6px rgba(0,240,255,0.55)", 
                  "0 0 8px rgba(0,240,255,0.55), 0 0 2px rgba(0,240,255,0.35)"
                ] 
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              PROSSNUM
            </motion.span>
            <span className="hidden sm:inline text-[10px] font-bold text-neon-cyan ml-1.5 px-1.5 py-0.5 bg-neon-cyan/10 rounded-md tracking-widest uppercase border border-neon-cyan/35"
              style={{ boxShadow: "0 0 12px rgba(0,240,255,0.25)" }}>
              v5.0
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Nav Links */}
      <div className="hidden md:flex items-center gap-1 p-1 bg-slate-950/85 rounded-xl border border-dark-border">
        <NavPill href="/" label="DASHBOARD" pathname={pathname} />
        <NavPill href="/mission-control" label="INCIDENTS" pathname={pathname} />
        <NavPill href="/report" label="ANALYTICS" pathname={pathname} />
      </div>

      {/* Right: Sync Indicator + Notification + User */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="mr-1 sm:mr-2">
          <SyncIndicator />
        </div>

        {/* Notification Bell */}
        <button className="hidden sm:flex p-2 text-slate-400 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-xl transition-all duration-200 relative">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-neon-magenta shadow-[0_0_6px_#ff00a0] ring-2 ring-dark-base" />
        </button>

        {/* Settings */}
        {displayRole === "admin" && (
          <button
            type="button"
            onClick={onSettingsClick}
            aria-label="LINE Bot Settings"
            title="LINE Bot Settings"
            className="flex p-2 text-slate-400 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-xl transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        )}

        {/* User Profile + Logout */}
        <div className="flex items-center gap-3 ml-2 pl-3 border-l border-dark-border">
          <div className="hidden sm:flex flex-col items-end text-right">
            <div className="text-xs font-bold text-white tracking-wide leading-none"
              style={{ textShadow: "0 0 6px rgba(255,255,255,0.2)" }}>
              {displayName}
            </div>
            <span className="text-[9px] font-bold text-neon-cyan/70 uppercase tracking-widest mt-0.5">
              {displayRole === "admin" ? "ADMIN" : "OPERATOR"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            disabled={isPending}
            title={`${displayName} · Click to logout`}
            className="group relative w-9 h-9 rounded-xl overflow-hidden border border-zinc-600 hover:border-neon-magenta/50 transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: user?.image
                ? "transparent"
                : "linear-gradient(135deg, #ff00a020, #b829dd40)",
              boxShadow: user?.image ? "none" : "0 0 10px rgba(255,0,160,0.2)",
            }}
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
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

function NavPill({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all duration-200",
        isActive
          ? "text-neon-cyan bg-neon-cyan/15 shadow-[0_0_8px_rgba(0,240,255,0.25)] border border-neon-cyan/35 font-extrabold"
          : "text-slate-400 hover:text-neon-cyan hover:bg-neon-cyan/10 border border-transparent"
      )}
    >
      {label}
    </Link>
  );
}
