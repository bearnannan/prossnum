import React from 'react';
import { ProgressBar } from '@/components/ProgressBar';
import { formatDateDisplay } from '@/hooks/useExport';

export function DashboardTable({
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
  setExportType: React.Dispatch<React.SetStateAction<"pdf" | "jpeg" | "txt">>;
  setIsExportModalOpen: (value: boolean) => void;
  handleSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  handleEditClick: (item: any) => void;
  handleDeleteClick: (item: any) => void;
}) {
  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-12 glass-panel flex flex-col overflow-hidden z-10 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
      {/* Table Header Bar */}
      <div className="p-5 sm:p-6 border-b border-zinc-100/80 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>
            {activeCategory === 'client' ? "รายการระบบลูกข่าย" : "รายการข้อมูลสถานี"}
          </h2>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            {filteredData.length} รายการ {searchTerm && `• ค้นหา "${searchTerm}"`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-base">search</span>
            <input 
              type="text" 
              aria-label="ค้นหาสถานี"
              placeholder="ค้นหาสถานี..." 
              className="pl-9 pr-4 py-2.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-800 border-none outline-none text-sm w-[200px] placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-zinc-700 transition-all duration-200" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <button 
            aria-label="Export options"
            onClick={() => { setExportType('pdf'); setIsExportModalOpen(true); }} 
            className="group px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-all duration-200 shadow-premium-sm hover:shadow-premium-md"
          >
            <span className="material-symbols-outlined text-sm group-hover:translate-y-0.5 transition-transform duration-200">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
        <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap table-premium">
          <thead className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-wider sticky top-0 z-10" style={{ background: 'rgba(248,250,252,0.95)', backdropFilter: 'blur(8px)' }}>
            <tr>
              <th className="px-5 py-3.5 cursor-pointer hover:text-zinc-600 transition-colors" onClick={() => handleSort('district')}>
                จังหวัด/อำเภอ {sortConfig?.key === 'district' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className="px-5 py-3.5 cursor-pointer hover:text-zinc-600 transition-colors" onClick={() => handleSort('stationName')}>
                สถานี {sortConfig?.key === 'stationName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              {activeCategory === 'station' ? (
                <>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5 min-w-[140px]">ฐานราก</th>
                  <th className="px-5 py-3.5 min-w-[140px]">ติดตั้งเสา</th>
                  <th className="px-5 py-3.5">ความสูงเสา</th>
                  <th className="px-5 py-3.5">พิกัด</th>
                  <th className="px-5 py-3.5">เริ่มงาน</th>
                  <th className="px-5 py-3.5">เสร็จงาน</th>
                </>
              ) : (
                <>
                  <th className="px-5 py-3.5 min-w-[140px]">ไฟฟ้า</th>
                  <th className="px-5 py-3.5 min-w-[140px]">กราวด์</th>
                  <th className="px-5 py-3.5">AC Ω</th>
                  <th className="px-5 py-3.5 min-w-[140px]">Feeder</th>
                  <th className="px-5 py-3.5">Radio (%)</th>
                  <th className="px-5 py-3.5">Radio SN</th>
                  <th className="px-5 py-3.5">RSSI</th>
                  <th className="px-5 py-3.5">ขอมิเตอร์</th>
                </>
              )}
              <th className="px-5 py-3.5 text-right sticky right-0 z-10" style={{ background: 'rgba(248,250,252,0.95)' }}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100/60 dark:divide-zinc-800/60">
            {sortedData.map((item, idx) => {
              return (
                <tr 
                  key={item.id || idx} 
                  className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors duration-200 relative"
                  style={{ animation: `fadeInUp 0.3s cubic-bezier(0.16,1,0.3,1) ${Math.min(idx * 0.03, 0.5)}s both` }}
                >
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">{item.district}</div>
                    <div className="text-[10px] text-zinc-400 font-medium">จ.{item.province || 'กาญจนบุรี'}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-blue-600 dark:text-blue-400 text-xs">{item.stationName}</div>
                    <div className="text-[10px] text-zinc-400 truncate max-w-[150px]">{item.remark || "ไม่มีหมายเหตุ"}</div>
                  </td>
                  {activeCategory === 'station' ? (
                    <>
                      <td className="px-5 py-3.5">
                        <span className="pill-badge bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <ProgressBar value={parseFloat(item.foundationProgress || 0)} color="cyan" />
                      </td>
                      <td className="px-5 py-3.5">
                        <ProgressBar value={parseFloat(item.poleInstallationProgress || 0)} color="orange" />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{item.poleHeight}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] text-zinc-400 font-mono">{item.lat?.toFixed(4)}, {item.lon?.toFixed(4)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-500">{formatDateDisplay(item.startDate)}</td>
                      <td className="px-5 py-3.5 text-xs text-zinc-500">{formatDateDisplay(item.endDate)}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3.5">
                        <ProgressBar value={parseFloat(item.electricProgress || 0)} color="indigo" />
                      </td>
                      <td className="px-5 py-3.5">
                        <ProgressBar value={parseFloat(item.groundProgress || 0)} color="emerald" />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{item.groundAC || "-"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <ProgressBar value={parseFloat(item.feederProgress || 0)} color="amber" />
                      </td>
                      <td className="px-5 py-3.5 text-xs">{item.radioProgress}%</td>
                      <td className="px-5 py-3.5 font-mono text-[10px] text-zinc-500">{item.radioSN || "-"}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-zinc-600">{item.rssi || "-"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`pill-badge ${item.meterRequest === 'ยื่นแล้ว' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'}`}>
                          {item.meterRequest || "ยังไม่ได้ยื่น"}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="px-5 py-3.5 text-right sticky right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/10 transition-colors duration-200">
                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                      <button aria-label="Edit item" onClick={() => handleEditClick(item)} className="p-1.5 hover:bg-blue-100/80 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95">
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">edit</span>
                      </button>
                      <button aria-label="Delete item" onClick={() => handleDeleteClick(item)} className="p-1.5 hover:bg-red-100/80 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95">
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sortedData.length === 0 && (
              <tr>
                <td colSpan={activeCategory === 'station' ? 8 : 9} className="px-5 py-12 text-center text-zinc-500 dark:text-zinc-400">
                  <div className="flex flex-col items-center justify-center opacity-60">
                    <span className="material-symbols-outlined text-4xl mb-3" aria-hidden="true">inbox_customize</span>
                    <p className="text-sm font-medium tracking-wide">ไม่พบข้อมูลที่ค้นหา</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
