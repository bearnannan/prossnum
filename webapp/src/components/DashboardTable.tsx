import React, { memo, useSyncExternalStore } from 'react';
import { ProgressBar } from '@/components/ProgressBar';
import { formatDateDisplay } from '@/hooks/useExport';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from './ui/StatusBadge';
import { PriorityBadge } from './ui/PriorityBadge';

const rowVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98, filter: 'blur(8px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      delay: Math.min(i * 0.04, 0.8),
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
  exit: { 
    opacity: 0, 
    x: 40, 
    scale: 0.95,
    filter: 'blur(12px)',
    transition: { 
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as const
    } 
  }
};

const subscribeHydration = () => () => undefined;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export const DashboardTable = memo(function DashboardTable({
  activeCategory,
  filteredData,
  sortedData,
  searchTerm,
  setSearchTerm,
  setExportType,
  setIsExportModalOpen,
  handleSort,
  sortConfig,
  handleEditClick,
  handleDeleteClick
}: {
  activeCategory: 'station' | 'client';
  filteredData: any[];
  sortedData: any[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  setExportType: React.Dispatch<React.SetStateAction<"pdf" | "jpeg" | "txt" | "csv">>;
  setIsExportModalOpen: (value: boolean) => void;
  handleSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  handleEditClick: (item: any) => void;
  handleDeleteClick: (item: any) => void;
}) {
  const isHydrated = useSyncExternalStore(
    subscribeHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  );

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-12 flex flex-col overflow-hidden z-10 rounded-xl bg-dark-surface/80 border border-dark-border shadow-card backdrop-blur-[16px] transition-all duration-300">
      {/* Table Header Bar */}
      <div className="p-5 sm:p-6 border-b border-dark-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)', textShadow: "0 0 8px rgba(255,255,255,0.1)" }}>
            {activeCategory === 'client' ? "รายการระบบลูกข่าย" : "รายการข้อมูลสถานี"}
          </h2>
          <div className="text-xs text-slate-400 font-bold tracking-wide uppercase mt-0.5">
            {activeCategory === 'station' 
              ? "โครงการก่อสร้างสถานีฐานและเสาสัญญาณ" 
              : "โครงการติดตั้งระบบ Client ภายในอาคาร"}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-base">search</span>
            <input 
              type="text" 
              aria-label="ค้นหาสถานี"
              placeholder="ค้นหาสถานี..." 
              className="pl-9 pr-4 py-2 bg-slate-900/60 border border-dark-border rounded-xl text-sm w-[200px] text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-neon-cyan/20 focus:border-neon-cyan/50 focus:bg-slate-900 transition-all duration-200" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <button 
            aria-label="Export options"
            onClick={() => { setExportType('pdf'); setIsExportModalOpen(true); }} 
            className="group px-4 py-2 bg-neon-cyan text-dark-base rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:opacity-90 hover:scale-[1.02] transition-all duration-200 shadow-[0_0_12px_rgba(0,240,255,0.2)] hover:shadow-[0_0_18px_rgba(0,240,255,0.4)]"
          >
            <span className="material-symbols-outlined text-sm group-hover:translate-y-0.5 transition-transform duration-200">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin">
        <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap table-premium border-separate border-spacing-0">
          <thead className="text-[10px] text-slate-400 uppercase font-bold tracking-wider sticky top-0 z-20 bg-dark-elevated border-b border-dark-border shadow-none">
            <tr>
              <th className="px-5 py-4 cursor-pointer hover:text-neon-cyan transition-colors" onClick={() => handleSort('district')}>
                จังหวัด/อำเภอ {sortConfig?.key === 'district' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className="px-5 py-4 cursor-pointer hover:text-neon-cyan transition-colors" onClick={() => handleSort('stationName')}>
                สถานี {sortConfig?.key === 'stationName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              {activeCategory === 'station' ? (
                <>
                  <th className="px-5 py-4">สถานะ</th>
                  <th className="px-5 py-4">ระดับภัย</th>
                  <th className="px-5 py-4 min-w-[140px]">ฐานราก</th>
                  <th className="px-5 py-4 min-w-[140px]">ติดตั้งเสา</th>
                  <th className="px-5 py-4">ความสูงเสา</th>
                  <th className="px-5 py-4">พิกัด</th>
                  <th className="px-5 py-4">เริ่มงาน</th>
                </>
              ) : (
                <>
                  <th className="px-5 py-4">สถานะ</th>
                  <th className="px-5 py-4 min-w-[140px]">ไฟฟ้า</th>
                  <th className="px-5 py-4 min-w-[140px]">กราวด์</th>
                  <th className="px-5 py-4">AC Ω</th>
                  <th className="px-5 py-4 min-w-[140px]">Feeder</th>
                  <th className="px-5 py-4 text-center">วางวิทยุ</th>
                  <th className="px-5 py-4">RSSI</th>
                  <th className="px-5 py-4">ขอมิเตอร์</th>
                  <th className="px-5 py-4 text-center">ติดตั้งมิเตอร์</th>
                </>
              )}
              <th className="px-5 py-4 text-right sticky right-0 z-20 bg-dark-elevated border-b border-dark-border shadow-none">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {!isHydrated ? (
              <tr>
                <td colSpan={activeCategory === 'station' ? 10 : 11} className="px-5 py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center opacity-60">
                    <span className="material-symbols-outlined text-5xl mb-4 text-slate-600" aria-hidden="true">hourglass_empty</span>
                    <p className="text-sm font-bold tracking-wider uppercase text-neon-cyan" style={{ textShadow: "0 0 6px rgba(0, 240, 255, 0.2)" }}>
                      กำลังโหลดข้อมูล
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                <AnimatePresence initial={false}>
                  {sortedData.map((item, idx) => {
                // Compute dynamic statuses for high-delight cyberpunk visual badges
                const foundation = parseFloat(item.foundationProgress || 0);
                const pole = parseFloat(item.poleInstallationProgress || 0);
                const electric = parseFloat(item.electricProgress || 0);
                const ground = parseFloat(item.groundProgress || 0);

                let computedStatus: 'new' | 'assigned' | 'in_progress' | 'resolved' = 'new';
                let computedPriority: 'critical' | 'high' | 'medium' | 'low' = 'low';

                if (activeCategory === 'station') {
                  const avg = (foundation + pole) / 2;
                  if (avg >= 100) computedStatus = 'resolved';
                  else if (avg > 0) computedStatus = 'in_progress';
                  else computedStatus = 'new';

                  if (avg < 30) computedPriority = 'critical';
                  else if (avg < 80) computedPriority = 'medium';
                  else computedPriority = 'low';
                } else {
                  const avg = (electric + ground) / 2;
                  if (avg >= 100) computedStatus = 'resolved';
                  else if (avg > 0) computedStatus = 'in_progress';
                  else computedStatus = 'new';

                  if (avg < 35) computedPriority = 'high';
                  else if (avg < 80) computedPriority = 'medium';
                  else computedPriority = 'low';
                }

                return (
                  <motion.tr 
                    layout
                    key={item.id || idx} 
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileHover={{ backgroundColor: 'rgba(0, 240, 255, 0.04)', x: 4 }}
                    custom={idx}
                    className={`group transition-all duration-300 relative ${item._syncStatus === 'pending' ? 'opacity-75 shimmer-row' : ''}`}
                  >
                    <td className="px-5 py-4 border-b border-dark-border">
                      <div className="font-bold text-white text-xs tracking-tight">{item.district}</div>
                      <div className="text-[9px] text-neon-cyan/70 font-black uppercase tracking-wider">จ.{item.province || 'กาญจนบุรี'}</div>
                    </td>
                    <td className="px-5 py-4 border-b border-dark-border">
                      <div className="flex items-center gap-2">
                          <div className="font-bold text-neon-cyan text-xs" style={{ textShadow: "0 0 6px rgba(0, 240, 255, 0.2)" }}>{item.stationName}</div>
                          {item._syncStatus === 'pending' && (
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded shadow-sm bg-neon-yellow/10 border border-neon-yellow/30 animate-pulse" title="Saved locally, waiting to sync">
                                  <span className="w-1.5 h-1.5 rounded-full bg-neon-yellow shadow-[0_0_6px_#f0e800]"></span>
                                  <span className="text-[9px] font-bold text-neon-yellow uppercase tracking-tighter">Local</span>
                              </div>
                          )}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold truncate max-w-[150px]">{item.remark || "ไม่มีหมายเหตุ"}</div>
                    </td>
                    {activeCategory === 'station' ? (
                      <>
                        <td className="px-5 py-4 border-b border-dark-border">
                          <StatusBadge status={computedStatus} />
                        </td>
                        <td className="px-5 py-4 border-b border-dark-border">
                          <PriorityBadge priority={computedPriority} />
                        </td>
                        <td className="px-5 py-4 border-b border-dark-border">
                          <ProgressBar value={foundation} color="cyan" />
                        </td>
                        <td className="px-5 py-4 border-b border-dark-border">
                          <ProgressBar value={pole} color="orange" />
                        </td>
                        <td className="px-5 py-4 border-b border-dark-border">
                          <span className="font-mono text-xs text-slate-300">{item.poleHeight || "-"}</span>
                        </td>
                        <td className="px-5 py-4 border-b border-dark-border">
                          <span className="text-[9px] text-slate-400 font-mono">{item.lat?.toFixed(4)}, {item.lon?.toFixed(4)}</span>
                        </td>
                        <td className="px-5 py-4 border-b border-dark-border text-xs text-slate-400 font-medium">{formatDateDisplay(item.startDate)}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-4 border-b border-dark-border">
                          <StatusBadge status={computedStatus} />
                        </td>
                        <td className="px-5 py-4 border-b border-dark-border">
                          <ProgressBar value={electric} color="indigo" />
                        </td>
                        <td className="px-5 py-4 border-b border-dark-border">
                          <ProgressBar value={ground} color="emerald" />
                        </td>
                        <td className="px-5 py-4 border-b border-dark-border">
                          <span className="font-mono text-xs text-slate-300">{item.groundAC || "-"}</span>
                        </td>
                        <td className="px-5 py-4 border-b border-dark-border">
                          <ProgressBar value={parseFloat(item.feederProgress || 0)} color="amber" />
                        </td>
                        <td className="px-5 py-4 border-b border-dark-border text-center">
                          {Number(item.radioProgress) === 100 ? (
                            <span className="material-symbols-outlined text-neon-cyan text-lg animate-neon-pulse" style={{ fontVariationSettings: "'FILL' 1", textShadow: "0 0 6px #00f0ff" }}>check_circle</span>
                          ) : (
                            <span className="material-symbols-outlined text-slate-600 text-lg">cancel</span>
                          )}
                        </td>
                        <td className="px-5 py-4 border-b border-dark-border font-mono text-xs text-slate-300">{item.rssi || "-"}</td>
                        <td className="px-5 py-4 border-b border-dark-border">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            item.meterRequest === 'ยื่นแล้ว' 
                            ? 'bg-neon-green/10 text-neon-green border border-neon-green/30 shadow-[0_0_8px_rgba(0,255,136,0.15)]' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {item.meterRequest || "ยังไม่ได้ยื่น"}
                          </span>
                        </td>
                        <td className="px-5 py-4 border-b border-dark-border text-center">
                          <div className="flex flex-col items-center">
                            {item.meterInstalled ? (
                              <span className="material-symbols-outlined text-neon-green text-lg" style={{ fontVariationSettings: "'FILL' 1", textShadow: "0 0 6px #00ff88" }}>check_circle</span>
                            ) : (
                              <span className="material-symbols-outlined text-slate-600 text-lg">cancel</span>
                            )}
                            {item.meterNo && (
                              <span className="text-[9px] text-slate-400 font-mono mt-0.5">{item.meterNo}</span>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                    <td className="px-5 py-4 border-b border-dark-border text-right sticky right-0 z-10 bg-dark-surface/90 border-l border-dark-border shadow-none group-hover:bg-dark-surface/95 transition-colors duration-300">
                      <div className="flex justify-end gap-1 opacity-100 transition-all duration-300">
                        <button aria-label="Edit item" onClick={() => handleEditClick(item)} className="p-1.5 hover:bg-neon-cyan/20 text-neon-cyan rounded-lg transition-all duration-200 hover:scale-110 active:scale-95">
                          <span className="material-symbols-outlined text-sm" aria-hidden="true">edit</span>
                        </button>
                        <button aria-label="Delete item" onClick={() => handleDeleteClick(item)} className="p-1.5 hover:bg-neon-magenta/20 text-neon-magenta rounded-lg transition-all duration-200 hover:scale-110 active:scale-95">
                          <span className="material-symbols-outlined text-sm" aria-hidden="true">delete</span>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
                  })}
                </AnimatePresence>
                {sortedData.length === 0 && (
                  <tr>
                    <td colSpan={activeCategory === 'station' ? 10 : 11} className="px-5 py-16 text-center text-slate-500">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 0.6, scale: 1 }}
                        className="flex flex-col items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-5xl mb-4 text-slate-600" aria-hidden="true">inbox_customize</span>
                        <p className="text-sm font-bold tracking-wider uppercase text-neon-cyan" style={{ textShadow: "0 0 6px rgba(0, 240, 255, 0.2)" }}>ไม่พบข้อมูลที่ค้นหา</p>
                      </motion.div>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
