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
  handleExportPDF,
  handleExportCSV
}: {
  isExportModalOpen: boolean;
  setIsExportModalOpen: (val: boolean) => void;
  exportType: "pdf" | "jpeg" | "txt" | "csv";
  setExportType: (val: "pdf" | "jpeg" | "txt" | "csv") => void;
  selectedExportStations: string[];
  setSelectedExportStations: React.Dispatch<React.SetStateAction<string[]>>;
  expandedDistricts: string[];
  setExpandedDistricts: React.Dispatch<React.SetStateAction<string[]>>;
  districts: string[];
  data: any[];
  activeCategory: 'station' | 'client' | 'incident';
  handleExportTXT: (activeCategory: 'station' | 'client' | 'incident', allData: any[]) => void;
  handleExportJPEG: (activeCategory: 'station' | 'client' | 'incident', allData: any[]) => void;
  handleExportPDF: (activeCategory: 'station' | 'client' | 'incident', allData: any[]) => void;
  handleExportCSV: (activeCategory: 'station' | 'client' | 'incident', allData: any[]) => void;
}) {
  if (!isExportModalOpen) return null;

  const totalSelected = selectedExportStations.length;
  const totalStations = data.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: 'fadeInUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}
    >
      {/* Backdrop — dark neon */}
      <div
        className="absolute inset-0 backdrop-blur-xl"
        style={{
          background: 'rgba(0, 0, 0, 0.75)',
          boxShadow: 'inset 0 0 80px rgba(0,240,255,0.03)',
        }}
        onClick={() => setIsExportModalOpen(false)}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] geo-corner"
        style={{
          background: 'rgba(18, 18, 26, 0.97)',
          backdropFilter: 'blur(40px) saturate(1.5)',
          border: '1px solid rgba(0, 240, 255, 0.20)',
          borderRadius: '20px',
          boxShadow: '0 0 40px rgba(0,240,255,0.08), 0 25px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(0,240,255,0.08)',
          animation: 'scaleIn 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Neon top border accent */}
        <div
          className="h-[1px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.6), transparent)' }}
        />

        {/* Modal Header */}
        <div className="px-7 py-5 flex justify-between items-center border-b border-[rgba(0,240,255,0.1)]">
          <div>
            <h3
              className="text-lg font-extrabold tracking-wider text-white"
              style={{ fontFamily: 'var(--font-display)', textShadow: '0 0 10px rgba(0,240,255,0.3)' }}
            >
              <span className="text-neon-cyan">EXPORT</span> DATA
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium tracking-wide uppercase">
              เลือกรูปแบบและสถานีที่ต้องการ
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Selected count badge */}
            {totalSelected > 0 && (
              <span
                className="text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded-lg"
                style={{
                  background: 'rgba(0,240,255,0.1)',
                  border: '1px solid rgba(0,240,255,0.25)',
                  color: '#00f0ff',
                  textShadow: '0 0 6px rgba(0,240,255,0.5)',
                }}
              >
                {totalSelected} / {totalStations}
              </span>
            )}
            <button
              onClick={() => setIsExportModalOpen(false)}
              aria-label="ปิด"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-neon-cyan hover:bg-neon-cyan/10 border border-transparent hover:border-neon-cyan/20 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Export Type Tabs */}
        <div className="px-7 pt-5">
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{ background: 'rgba(10,10,15,0.60)', border: '1px solid rgba(0,240,255,0.10)' }}
          >
            {([
              { key: 'pdf' as const, label: 'PDF', icon: 'picture_as_pdf' },
              { key: 'jpeg' as const, label: 'JPEG', icon: 'image' },
              { key: 'txt' as const, label: 'TXT', icon: 'description' },
              { key: 'csv' as const, label: 'CSV/Excel', icon: 'table_view' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setExportType(tab.key)}
                className="flex-1 py-2.5 rounded-lg font-black text-xs transition-all duration-200 flex items-center justify-center gap-1.5 tracking-wider"
                style={exportType === tab.key ? {
                  background: 'rgba(0,240,255,0.15)',
                  border: '1px solid rgba(0,240,255,0.35)',
                  color: '#00f0ff',
                  textShadow: '0 0 8px rgba(0,240,255,0.5)',
                  boxShadow: '0 0 12px rgba(0,240,255,0.15)',
                } : {
                  color: '#64748b',
                  border: '1px solid transparent',
                }}
              >
                <span className="material-symbols-outlined text-sm" style={exportType === tab.key ? { fontVariationSettings: "'FILL' 1" } : {}}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Station Selection */}
        <div className="p-7 overflow-y-auto flex-1 space-y-2 scrollbar-thin">
          {districts.map(d => {
            const districtStations = data.filter(s => s.district === d);
            const selectedInDistrict = selectedExportStations.filter(s => s.startsWith(`${d}|`));
            const isAllSelected = selectedInDistrict.length === districtStations.length && districtStations.length > 0;
            const isPartial = selectedInDistrict.length > 0 && !isAllSelected;
            const isExpanded = expandedDistricts.includes(d);

            return (
              <div
                key={d}
                className="rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  border: isAllSelected
                    ? '1px solid rgba(0,240,255,0.30)'
                    : isPartial
                    ? '1px solid rgba(0,240,255,0.15)'
                    : '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(26,26,37,0.60)',
                }}
              >
                <div className="p-3.5 flex items-center justify-between gap-2">
                  <label className="flex items-center gap-3 cursor-pointer font-bold flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={el => { if (el) el.indeterminate = isPartial; }}
                      onChange={(e) => {
                        const keys = districtStations.map(s => `${s.district}|${s.stationName || s.station}`);
                        if (e.target.checked) setSelectedExportStations(prev => [...new Set([...prev, ...keys])]);
                        else setSelectedExportStations(prev => prev.filter(k => !keys.includes(k)));
                      }}
                      className="w-4 h-4 rounded-md flex-shrink-0"
                      style={{ accentColor: '#00f0ff' }}
                    />
                    <span
                      className="text-sm font-bold truncate"
                      style={{ color: isAllSelected ? '#00f0ff' : isPartial ? '#94a3b8' : '#64748b' }}
                    >
                      {d}
                    </span>
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 tracking-wider"
                      style={{
                        background: selectedInDistrict.length > 0 ? 'rgba(0,240,255,0.10)' : 'rgba(255,255,255,0.05)',
                        border: selectedInDistrict.length > 0 ? '1px solid rgba(0,240,255,0.20)' : '1px solid rgba(255,255,255,0.06)',
                        color: selectedInDistrict.length > 0 ? '#00f0ff' : '#475569',
                      }}
                    >
                      {selectedInDistrict.length}/{districtStations.length}
                    </span>
                  </label>
                  <button
                    onClick={() => setExpandedDistricts(prev => isExpanded ? prev.filter(item => item !== d) : [...prev, d])}
                    className="p-1.5 rounded-lg transition-all duration-200 flex-shrink-0 text-slate-500 hover:text-neon-cyan hover:bg-neon-cyan/10"
                  >
                    <span className={`material-symbols-outlined text-lg transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>
                </div>

                {isExpanded && (
                  <div
                    className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1"
                    style={{
                      borderTop: '1px solid rgba(0,240,255,0.08)',
                      background: 'rgba(10,10,15,0.40)',
                      animation: 'fadeInUp 0.2s ease',
                    }}
                  >
                    {districtStations.map(s => {
                      const key = `${s.district}|${s.stationName || s.station}`;
                      const isSelected = selectedExportStations.includes(key);
                      return (
                        <label
                          key={key}
                          className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-150 group"
                          style={{
                            background: isSelected ? 'rgba(0,240,255,0.06)' : 'transparent',
                            border: isSelected ? '1px solid rgba(0,240,255,0.15)' : '1px solid transparent',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedExportStations(prev => [...prev, key]);
                              else setSelectedExportStations(prev => prev.filter(k => k !== key));
                            }}
                            className="w-3.5 h-3.5 rounded flex-shrink-0"
                            style={{ accentColor: '#00f0ff' }}
                          />
                          <span
                            className="text-xs font-medium transition-colors duration-150 truncate"
                            style={{ color: isSelected ? '#00f0ff' : '#64748b' }}
                          >
                            {s.stationName || s.station}
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
        <div
          className="px-7 py-5 flex gap-3"
          style={{ borderTop: '1px solid rgba(0,240,255,0.08)' }}
        >
          <button
            onClick={() => setIsExportModalOpen(false)}
            className="flex-1 py-3 font-bold rounded-xl text-sm text-slate-400 hover:text-white transition-all duration-200 border border-dark-border hover:border-slate-600"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (exportType === 'txt') handleExportTXT(activeCategory, data);
              else if (exportType === 'csv') handleExportCSV(activeCategory, data);
              else if (exportType === 'jpeg') handleExportJPEG(activeCategory, data);
              else handleExportPDF(activeCategory, data);
            }}
            className="flex-1 py-3 font-black rounded-xl text-sm text-dark-base hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 tracking-wider uppercase"
            style={{
              background: '#00f0ff',
              boxShadow: '0 0 15px rgba(0,240,255,0.3), 0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
            Confirm Export
          </button>
        </div>
      </div>
    </div>
  );
}
