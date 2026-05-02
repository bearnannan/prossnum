'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useMissionControl } from '@/hooks/useMissionControl';
import { LiveMetrics } from '@/components/LiveMetrics';
import Link from 'next/link';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-zinc-900 rounded-xl text-zinc-500 text-sm animate-pulse">Initializing Tactical Map...</div>
});

export default function MissionControlPage() {
  const { stations, clients, audits, isLoading, lastUpdate } = useMissionControl();
  const [activeLayer, setActiveLayer] = useState<'station' | 'client'>('station');

  return (
    <div className="min-h-screen bg-[#0d0b12] text-white overflow-hidden flex flex-col font-sans">
      {/* Tactical Header */}
      <header className="h-16 border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-white text-xl">satellite_alt</span>
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white">ProssNum</h1>
              <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Mission Control</div>
            </div>
          </Link>

          <div className="h-8 w-[1px] bg-zinc-800" />

          <nav className="flex items-center gap-1 p-1 bg-zinc-800/40 rounded-xl border border-zinc-700/30">
            <button
              onClick={() => setActiveLayer('station')}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                activeLayer === 'station' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Infrastructure
            </button>
            <button
              onClick={() => setActiveLayer('client')}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                activeLayer === 'client' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Client Ops
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono tracking-tighter">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-full border border-zinc-700/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-400 uppercase">System Nominal</span>
          </div>
          <div className="text-zinc-500 uppercase">
            Last Sync: {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}
          </div>
        </div>
      </header>

      <main className="flex-1 relative flex">
        {/* Left Stats Panel */}
        <div className="w-[380px] border-r border-zinc-800/50 bg-zinc-900/10 backdrop-blur-sm flex flex-col p-4 gap-4 overflow-y-auto z-40">
          <section>
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="w-4 h-[1px] bg-zinc-700" />
              Global Metrics
            </div>
            <div className="grid grid-cols-1 gap-3">
              <LiveMetrics stations={stations} clients={clients} />
            </div>
          </section>

          <section className="flex-1 flex flex-col min-h-0">
             <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="w-4 h-[1px] bg-zinc-700" />
              Operational Status
            </div>
            <div className="flex-1 glass-panel bg-zinc-900/40 p-4 flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-emerald-400">check_circle</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-tight">Systems Nominal</h3>
              <p className="text-[11px] text-zinc-500">No active alerts or critical issues detected in the current sector.</p>
            </div>
          </section>
        </div>

        {/* Central Map Center */}
        <div className="flex-1 relative bg-[#0d0b12]">
          <div className="absolute inset-0 z-0 opacity-50">
             <MapView data={activeLayer === 'station' ? stations : clients} category={activeLayer} tactical />
          </div>
          
          {/* Map Overlays */}
          <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
             <div className="glass-panel px-4 py-2 bg-zinc-900/60 border-zinc-700/30">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Sector</div>
                <div className="text-lg font-bold text-white tracking-tight">Thailand North-East</div>
             </div>
          </div>

          <div className="absolute bottom-6 right-6 z-10">
             <div className="glass-panel px-4 py-3 bg-zinc-900/80 border-zinc-700/50 flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Uplink Status</span>
                  <span className="text-xs font-black text-emerald-400 uppercase">99.9% Uptime</span>
                </div>
                <div className="h-6 w-[1px] bg-zinc-700" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Latency</span>
                  <span className="text-xs font-black text-blue-400 uppercase">24ms</span>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
