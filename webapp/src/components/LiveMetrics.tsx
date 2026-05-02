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
    <div className="flex flex-wrap gap-4 p-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex-1 min-w-[200px] glass-panel p-4 flex items-center gap-4 relative overflow-hidden"
        >
          <div className={`p-3 rounded-xl bg-zinc-800/50 ${stat.color}`}>
             <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</div>
            <div className="text-2xl font-bold text-white tracking-tight">
              <AnimatePresence mode="wait">
                <motion.span
                  key={stat.value}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="inline-block"
                >
                  {stat.value}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
          <motion.div
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute -right-2 -bottom-2 w-16 h-16 rounded-full blur-2xl ${stat.color.replace('text-', 'bg-')}/20`}
          />
        </motion.div>
      ))}
    </div>
  );
};
