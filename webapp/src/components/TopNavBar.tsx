"use client";

import React from "react";
import { useRouter } from "next/navigation";
import SyncIndicator from "./SyncIndicator";

interface TopNavBarProps {
  onLogout?: () => void;
  onMenuToggle?: () => void;
}

export default function TopNavBar({ onLogout, onMenuToggle }: TopNavBarProps) {
  const router = useRouter();
  
  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 h-16 flex justify-between items-center px-4 sm:px-8"
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
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
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
        <a className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" href="#">
          Dashboard
        </a>
        <a className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-700/50" href="/report">
          Analytics
        </a>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="mr-1 sm:mr-2">
          <SyncIndicator />
        </div>
        
        <button className="hidden sm:flex p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200 relative">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-zinc-900"></span>
        </button>
        <button className="hidden sm:flex p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200">
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>
        
        {/* Logout Avatar */}
        <button 
          onClick={handleLogout}
          className="group relative w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-premium-sm hover:shadow-premium-md transition-all duration-300 hover:scale-105 active:scale-95"
          title="Click to Logout"
        >
          <span className="material-symbols-outlined text-white text-sm group-hover:rotate-12 transition-transform duration-300">logout</span>
        </button>
      </div>
    </nav>

  );
}
