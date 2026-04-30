"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Magnetic } from "./motion/Magnetic";
import SyncIndicator from "./SyncIndicator";


interface TopNavBarProps {
  onLogout?: () => void;
  onMenuToggle?: () => void;
}

const navVariants = {
  hidden: { y: -60, opacity: 0, filter: "blur(10px)" },
  visible: { 
    y: 0, 
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 1.0,
      ease: [0.22, 1, 0.36, 1] as const,
    }
  }
};


export default function TopNavBar({ onLogout, onMenuToggle }: TopNavBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const { data: session } = useSession();
  const user = session?.user;

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      startTransition(() => {
        router.push('/login');
        router.refresh();
      });
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  return (
    <motion.nav 
      variants={navVariants}

      className="fixed top-0 w-full z-50 h-16 flex justify-between items-center px-4 sm:px-8"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(24px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 16px rgba(0,0,0,0.02)',
      }}
    >
      {/* Left: Menu + Brand */}
      <div className="flex items-center gap-3">
        <Magnetic distance={0.2}>
          <button 
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </Magnetic>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-premium-sm">
            <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>architecture</span>
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-white" style={{ fontFamily: 'var(--font-headline)' }}>
              ProssNum
            </span>
            <span className="hidden sm:inline text-[10px] font-bold text-zinc-400 dark:text-zinc-500 ml-2 px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md tracking-wider uppercase">
              v5.0
            </span>
          </div>
        </div>
      </div>
      
      {/* Center: Nav Links */}
      <div className="hidden md:flex items-center gap-1 p-1 bg-zinc-100/60 dark:bg-zinc-800/40 rounded-xl">
        <Magnetic distance={0.1}>
          <a className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 bg-white dark:bg-zinc-700 text-zinc-900 dark:white shadow-sm block" href="#">
            Dashboard
          </a>
        </Magnetic>
        <Magnetic distance={0.1}>
          <a className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-700/50 block" href="/report">
            Analytics
          </a>
        </Magnetic>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="mr-1 sm:mr-2">
          <SyncIndicator />
        </div>
        
        <Magnetic distance={0.2}>
          <button className="hidden sm:flex p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200 relative">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-zinc-900"></span>
          </button>
        </Magnetic>
        <Magnetic distance={0.2}>
          <button className="hidden sm:flex p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </Magnetic>
        
        {/* Logout Avatar / User Profile */}
        <div className="flex items-center gap-3 ml-2 pl-3 border-l border-zinc-200 dark:border-zinc-800">
          <div className="hidden sm:flex flex-col items-end text-right">
            <div className="text-xs font-bold text-zinc-900 dark:text-white leading-none">
              {user?.name || 'User'}
            </div>
            <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
              {user?.email ? "Developer" : "Infrastructure"}
            </span>
          </div>

          <Magnetic distance={0.2}>
            <button 
              onClick={handleLogout}
              className="group relative w-9 h-9 rounded-xl overflow-hidden shadow-premium-sm hover:shadow-premium-md transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: user?.image 
                  ? 'transparent' 
                  : 'linear-gradient(to bottom right, #3b82f6, #6366f1, #8b5cf6)'
              }}
              title={`Logged in as ${user?.name || 'User'}. Click to Logout.`}
            >
              {user?.image ? (
                <img 
                  src={user.image} 
                  alt={user.name || "User"} 
                  className="w-full h-full object-cover group-hover:opacity-40 transition-opacity duration-300"
                />
              ) : (
                <span className="material-symbols-outlined text-white text-sm group-hover:rotate-12 transition-transform duration-300">
                  person
                </span>
              )}
              
              {/* Overlay Logout Icon on Hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
                <span className="material-symbols-outlined text-white text-base">logout</span>
              </div>
            </button>
          </Magnetic>
        </div>
      </div>
    </motion.nav>
  );
}
