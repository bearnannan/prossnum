'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useMissionControl } from '@/hooks/useMissionControl';
import { LiveMetrics } from '@/components/LiveMetrics';
import { AssetInspector } from '@/components/AssetInspector';
import Link from 'next/link';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-zinc-900 rounded-xl text-zinc-500 text-sm animate-pulse">Initializing Tactical Map...</div>
});

export default function MissionControlPage() {
  const { stations, clients, isLoading, lastUpdate } = useMissionControl();
  const [activeLayer, setActiveLayer] = useState<'station' | 'client'>('station');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [showIntro, setShowIntro] = useState(true);

  // Auto-hide intro after 2.5s
  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen bg-[#06050a] text-white overflow-hidden flex flex-col font-sans selection:bg-blue-500/30">
      <AnimatePresence>
        {showIntro && (
          <motion.div 
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[100] bg-[#06050a] flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.4)] mb-6">
                <span className="material-symbols-outlined text-white text-4xl animate-pulse">satellite_alt</span>
              </div>
              <h1 className="text-2xl font-black uppercase tracking-[0.4em] text-white mb-2">ProssNum</h1>
              <div className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.5em] animate-pulse">Initializing Tactical Link...</div>
              
              <div className="mt-12 w-48 h-[1px] bg-zinc-800 relative overflow-hidden">
                <motion.div 
                  initial={{ left: '-100%' }}
                  animate={{ left: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent w-1/2"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tactical Header */}
      <header className="h-16 border-b border-zinc-800/40 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between z-50">
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

          <div className="h-8 w-[1px] bg-zinc-800/50" />

          <nav className="flex items-center gap-1 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
            <button
              onClick={() => { setActiveLayer('station'); setSelectedAsset(null); }}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                activeLayer === 'station' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Infrastructure
            </button>
            <button
              onClick={() => { setActiveLayer('client'); setSelectedAsset(null); }}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                activeLayer === 'client' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Client Ops
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 rounded-full border border-zinc-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-zinc-400 uppercase tracking-tighter">System Nominal</span>
          </div>
          <div className="text-zinc-500 uppercase tracking-tighter">
            SYNC_TIME: {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
        {/* Full Screen Map */}
        <div className="absolute inset-0 z-0">
          <MapView 
            data={activeLayer === 'station' ? stations : clients} 
            category={activeLayer} 
            tactical 
            onSelect={setSelectedAsset}
            activeAssetId={selectedAsset?.id}
          />
          
          {/* Scanning Overlay Effect */}
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            <motion.div 
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-[2px] bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(6,5,10,0.4)_100%)]" />
          </div>
        </div>

        {/* Floating HUD Panel */}
        <div className="absolute top-6 left-6 bottom-6 w-[360px] pointer-events-none z-40 flex flex-col gap-4">
          <div className="pointer-events-auto glass-panel bg-zinc-950/60 backdrop-blur-2xl p-6 border-zinc-800/40 shadow-2xl flex flex-col gap-6">
            <AnimatePresence mode="wait">
              {selectedAsset ? (
                <AssetInspector 
                  key="inspector"
                  asset={selectedAsset} 
                  onClose={() => setSelectedAsset(null)} 
                />
              ) : (
                <motion.div
                  key="metrics"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-6"
                >
                  <section>
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <span className="w-4 h-[1px] bg-zinc-700" />
                      Sector Metrics
                    </div>
                    <LiveMetrics stations={stations} clients={clients} />
                  </section>

                  <section className="flex flex-col gap-4">
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                      <span className="w-4 h-[1px] bg-zinc-700" />
                      Operational Summary
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/30">
                        <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Status</div>
                        <div className="text-xs font-black text-emerald-400 uppercase tracking-tighter">Normal</div>
                      </div>
                      <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/30">
                        <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Coverage</div>
                        <div className="text-xs font-black text-blue-400 uppercase tracking-tighter">94.2%</div>
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mini Data Cards */}
          {!selectedAsset && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="pointer-events-auto glass-panel bg-zinc-950/40 backdrop-blur-xl p-4 border-zinc-800/30 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-400 text-xl">cloud_sync</span>
              </div>
              <div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Direct Uplink</div>
                <div className="text-xs font-black text-white uppercase tracking-tighter">Realtime Engine Active</div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Info Badges */}
        <div className="absolute top-6 right-6 z-10 flex flex-col gap-2 items-end">
           <div className="glass-panel px-4 py-2 bg-zinc-950/60 border-zinc-800/40 text-right">
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Sector</div>
              <div className="text-lg font-bold text-white tracking-tight">Thailand North-East</div>
           </div>
           
           <div className="flex gap-2">
             <div className="glass-panel px-3 py-1.5 bg-zinc-950/60 border-zinc-800/40 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Signal: -72dBm</span>
             </div>
             <div className="glass-panel px-3 py-1.5 bg-zinc-950/60 border-zinc-800/40 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Power: Nominal</span>
             </div>
           </div>
        </div>

        <div className="absolute bottom-6 right-6 z-10">
           <div className="glass-panel px-4 py-3 bg-zinc-950/80 border-zinc-800/50 flex items-center gap-6 shadow-2xl">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Uplink Status</span>
                <span className="text-xs font-black text-emerald-400 uppercase tracking-tight">99.9% Uptime</span>
              </div>
              <div className="h-6 w-[1px] bg-zinc-800" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Latency</span>
                <span className="text-xs font-black text-blue-400 uppercase tracking-tight">24ms</span>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
