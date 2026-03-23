"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface TopNavBarProps {
  onLogout?: () => void;
}

export default function TopNavBar({ onLogout }: TopNavBarProps) {
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
    <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-sm dark:shadow-none h-16 flex justify-between items-center px-8 border-b dark:border-zinc-800">
      <div className="text-xl font-black text-blue-950 dark:text-blue-200">Infrastructure Progress</div>
      
      <div className="hidden md:flex items-center gap-8">
        <a className="text-blue-900 dark:text-blue-400 border-b-2 border-blue-900 pb-1 font-bold tracking-tight" href="#">
          Dashboard
        </a>
        <a className="text-zinc-500 dark:text-zinc-400 font-bold tracking-tight hover:text-blue-700 transition-colors" href="/report">
          Analytics
        </a>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all">
          <span className="material-symbols-outlined">settings</span>
        </button>
        
        {/* User Profile */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 cursor-pointer" onClick={handleLogout} title="Click to Logout">
          <span className="material-symbols-outlined text-sm">logout</span>
        </div>
      </div>
    </nav>
  );
}
