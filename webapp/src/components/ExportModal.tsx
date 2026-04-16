import React from 'react';

export function ExportModal({
  isExportModalOpen,
  setIsExportModalOpen,
  exportType,
  setExportType,
  selectedExportStations,
  setSelectedExportStations,
  expandedDistricts,
  setExpandedDistricts,
  districts,
  data,
  activeCategory,
  handleExportTXT,
  handleExportJPEG,
  handleExportPDF
}: {
  isExportModalOpen: boolean;
  setIsExportModalOpen: (val: boolean) => void;
  exportType: "pdf" | "jpeg" | "txt";
  setExportType: (val: "pdf" | "jpeg" | "txt") => void;
  selectedExportStations: string[];
  setSelectedExportStations: React.Dispatch<React.SetStateAction<string[]>>;
  expandedDistricts: string[];
  setExpandedDistricts: React.Dispatch<React.SetStateAction<string[]>>;
  districts: string[];
  data: any[];
  activeCategory: 'station' | 'client';
  handleExportTXT: (activeCategory: 'station' | 'client', allData: any[]) => void;
  handleExportJPEG: (activeCategory: 'station' | 'client', allData: any[]) => void;
  handleExportPDF: (activeCategory: 'station' | 'client', allData: any[]) => void;
}) {
  if (!isExportModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'fadeInUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-lg" onClick={() => setIsExportModalOpen(false)} />
      
      {/* Modal */}
      <div 
        className="relative bg-white dark:bg-zinc-900 rounded-[28px] shadow-premium-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200/50 dark:border-zinc-700/50"
        style={{ animation: 'scaleIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Modal Header */}
        <div className="p-7 pb-5 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>Export Data</h3>
            <p className="text-xs text-zinc-400 mt-0.5">เลือกรูปแบบและสถานีที่ต้องการ</p>
          </div>
          <button 
            onClick={() => setIsExportModalOpen(false)} 
            className="w-9 h-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Export Type Tabs */}
        <div className="px-7">
          <div className="flex gap-1 p-1 bg-zinc-100/70 dark:bg-zinc-800 rounded-xl">
            {[
              { key: 'pdf' as const, label: 'PDF', icon: 'picture_as_pdf' },
              { key: 'jpeg' as const, label: 'JPEG', icon: 'image' },
              { key: 'txt' as const, label: 'TXT', icon: 'description' },
            ].map(tab => (
              <button 
                key={tab.key}
                onClick={() => setExportType(tab.key)} 
                className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  exportType === tab.key 
                    ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' 
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Station Selection */}
        <div className="p-7 overflow-y-auto flex-1 space-y-3">
          {districts.map(d => {
            const districtStations = data.filter(s => s.district === d);
            const selectedInDistrict = selectedExportStations.filter(s => s.startsWith(`${d}|`));
            const isAllSelected = selectedInDistrict.length === districtStations.length && districtStations.length > 0;
            const isExpanded = expandedDistricts.includes(d);

            return (
              <div key={d} className="rounded-2xl border border-zinc-100/80 dark:border-zinc-800 overflow-hidden transition-all duration-200 hover:border-zinc-200 dark:hover:border-zinc-700">
                <div className="p-4 bg-zinc-50/50 dark:bg-zinc-800/20 flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer font-bold flex-1">
                    <input 
                      type="checkbox" 
                      checked={isAllSelected} 
                      onChange={(e) => {
                        const keys = districtStations.map(s => `${s.district}|${s.stationName}`);
                        if (e.target.checked) setSelectedExportStations(prev => [...new Set([...prev, ...keys])]);
                        else setSelectedExportStations(prev => prev.filter(k => !keys.includes(k)));
                      }} 
                      className="w-4 h-4 rounded-md accent-blue-600" 
                    />
                    <span className="text-sm text-zinc-800 dark:text-zinc-200">{d}</span>
                    <span className="pill-badge bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-500 dark:text-zinc-400">
                      {selectedInDistrict.length}/{districtStations.length}
                    </span>
                  </label>
                  <button 
                    onClick={() => setExpandedDistricts(prev => isExpanded ? prev.filter(item => item !== d) : [...prev, d])}
                    className="p-1.5 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 rounded-lg transition-all duration-200"
                  >
                    <span className={`material-symbols-outlined text-zinc-400 text-lg transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>
                </div>
                
                {isExpanded && (
                  <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100/60 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-1" style={{ animation: 'fadeInUp 0.2s ease' }}>
                    {districtStations.map(s => {
                      const key = `${s.district}|${s.stationName}`;
                      const isSelected = selectedExportStations.includes(key);
                      return (
                        <label key={key} className="flex items-center gap-2 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors duration-150 group">
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={(e) => {
                              if (e.target.checked) setSelectedExportStations(prev => [...prev, key]);
                              else setSelectedExportStations(prev => prev.filter(k => k !== key));
                            }}
                            className="w-3.5 h-3.5 rounded accent-blue-600"
                          />
                          <span className={`text-xs transition-colors duration-150 ${isSelected ? 'text-blue-600 font-bold' : 'text-zinc-500'} group-hover:text-zinc-800 dark:group-hover:text-zinc-200`}>
                            {s.stationName}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-7 pt-5 border-t border-zinc-100/80 dark:border-zinc-800 flex gap-3">
          <button onClick={() => setIsExportModalOpen(false)} className="flex-1 py-3.5 font-bold rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 text-sm text-zinc-600">
            Cancel
          </button>
          <button 
            onClick={() => {
              if (exportType === 'txt') handleExportTXT(activeCategory, data);
              else if (exportType === 'jpeg') handleExportJPEG(activeCategory, data);
              else handleExportPDF(activeCategory, data);
            }} 
            className="flex-1 py-3.5 text-white font-bold rounded-2xl shadow-premium-sm hover:shadow-premium-md transition-all duration-200 gradient-primary text-sm hover:scale-[1.01] active:scale-[0.99]"
          >
            Confirm Export
          </button>
        </div>
      </div>
    </div>
  );
}
