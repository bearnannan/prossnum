import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const LiveMetrics = ({ stations, clients }: { stations: any[], clients: any[] }) => {
  const stats = useMemo(() => {
    const totalStations = stations.length;
    const avgStationProgress = totalStations > 0 
      ? Math.round(stations.reduce((acc, s) => acc + (parseFloat(s.foundationProgress || 0) + parseFloat(s.poleInstallationProgress || 0)) / 2, 0) / totalStations)
      : 0;
    
    const totalClients = clients.length;
    const avgClientProgress = totalClients > 0
      ? Math.round(clients.reduce((acc, c) => acc + (parseFloat(c.electricProgress || 0) + parseFloat(c.groundProgress || 0) + parseFloat(c.feederProgress || 0)) / 3, 0) / totalClients)
      : 0;

    return [
      { label: 'ความคืบหน้าสถานี', value: `${avgStationProgress}%`, color: 'text-blue-400', icon: 'analytics' },
      { label: 'ความคืบหน้าระบบลูกข่าย', value: `${avgClientProgress}%`, color: 'text-indigo-400', icon: 'settings_input_antenna' },
      { label: 'สถานีออนไลน์', value: totalStations, color: 'text-emerald-400', icon: 'sensors' },
      { label: 'ระบบลูกข่ายแอคทีฟ', value: totalClients, color: 'text-amber-400', icon: 'hub' },
    ];
  }, [stations, clients]);

  return (
    <div className="flex flex-wrap gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex-1 min-w-[140px] p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/30 relative overflow-hidden group hover:border-zinc-700/50 transition-colors"
        >
          <div className="flex flex-col gap-3 relative z-10">
            <div className={`w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center ${stat.color} shadow-lg shadow-black/20`}>
               <span className="material-symbols-outlined text-lg">{stat.icon}</span>
            </div>
            <div>
              <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-xl font-black text-white tracking-tighter">
                <AnimatePresence>
                  <motion.span
                    key={stat.value}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="inline-block"
                  >
                    {stat.value}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          {/* Subtle Glow Background */}
          <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-3xl opacity-10 ${stat.color.replace('text-', 'bg-')} group-hover:opacity-20 transition-opacity`} />
        </motion.div>
      ))}
    </div>
  );
};
