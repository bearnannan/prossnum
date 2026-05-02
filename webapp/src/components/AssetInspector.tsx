'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AssetInspectorProps {
  asset: any;
  onClose: () => void;
}

export const AssetInspector = ({ asset, onClose }: AssetInspectorProps) => {
  if (!asset) return null;

  const isStation = 'foundationProgress' in asset;

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${asset.status === 'Online' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{isStation ? 'Station Asset' : 'Client System'}</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight leading-none">{asset.name}</h2>
          <p className="text-[10px] font-mono text-zinc-500 mt-2 uppercase tracking-tighter">
            ID: {asset.id?.toString().slice(0, 8)}... | LOC: {Number(asset.lat || 0).toFixed(4)}, {Number(asset.lon || 0).toFixed(4)}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      <div className="h-[1px] w-full bg-gradient-to-r from-zinc-800 to-transparent" />

      <div className="grid grid-cols-2 gap-4">
        {isStation ? (
          <>
            <div className="glass-panel p-3 bg-zinc-800/30 border-zinc-700/20">
              <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Foundation</div>
              <div className="text-lg font-black text-blue-400">{asset.foundationProgress}%</div>
              <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${asset.foundationProgress}%` }}
                  className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                />
              </div>
            </div>
            <div className="glass-panel p-3 bg-zinc-800/30 border-zinc-700/20">
              <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Installation</div>
              <div className="text-lg font-black text-indigo-400">{asset.poleInstallationProgress}%</div>
              <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${asset.poleInstallationProgress}%` }}
                  className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="glass-panel p-3 bg-zinc-800/30 border-zinc-700/20">
              <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Electrical</div>
              <div className="text-lg font-black text-emerald-400">{asset.electricProgress}%</div>
            </div>
            <div className="glass-panel p-3 bg-zinc-800/30 border-zinc-700/20">
              <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Communications</div>
              <div className="text-lg font-black text-blue-400">{asset.feederProgress}%</div>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm">satellite_alt</span>
          Establish Uplink
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className="py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">sensors</span>
            Ping
          </button>
          <button className="py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">map</span>
            Locate
          </button>
        </div>
      </div>
    </motion.div>
  );
};
