"use client";

import { useRef, useState, useMemo, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { StationData, ClientSystemData } from "./api/sheet-data/route";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import { Skeleton, SkeletonLayout } from "@/components/Skeleton";
import TopNavBar from '@/components/TopNavBar';
import SideNavBar from '@/components/SideNavBar';

// ─── Lazy-loaded modals (deferred ~63KB until user clicks "เพิ่มสถานี") ───
const StationModal = dynamic(() => import('@/components/StationModal'), { ssr: false });
const ClientSystemModal = dynamic(() => import('@/components/ClientSystemModal'), { ssr: false });

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(res => {
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json();
});

const formatDateDisplay = (dateStr?: string) => {
  if (!dateStr || dateStr === "-" || dateStr === "") return "-";
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const yy = y.slice(-2);
  return `${d}/${m}/${yy}`;
};

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-zinc-400 text-sm animate-pulse">Loading Map...</div>
});

const ProgressChart = dynamic(() => import('@/components/ProgressChart'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-zinc-400 text-sm animate-pulse">Loading Chart...</div>
});

const DistrictProgressChart = dynamic(() => import('@/components/DistrictProgressChart'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-zinc-400 text-sm animate-pulse">Loading Chart...</div>
});

// ExportBentoReport is now imported dynamically at export-time only (see handleExportPDF/JPEG)

const ComparisonChart = dynamic(() => import('@/components/ComparisonChart'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-zinc-400 text-sm animate-pulse">Loading Chart...</div>
});

/* ─── Progress Bar Component ─── */
function ProgressBar({ value, color = 'blue' }: { value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-indigo-500',
    cyan: 'from-cyan-500 to-blue-500',
    orange: 'from-orange-400 to-amber-500',
    emerald: 'from-emerald-500 to-teal-500',
    indigo: 'from-indigo-500 to-violet-500',
    amber: 'from-amber-500 to-orange-500',
    green: 'from-green-500 to-emerald-500',
    rose: 'from-rose-500 to-pink-500',
  };
  const gradient = colorMap[color] || colorMap.blue;
  const raw = isNaN(value) ? 0 : value;
  const pct = Math.min(100, Math.max(0, raw));
  
  return (
    <div className="flex items-center gap-2.5 w-full">
      <div className="progress-bar flex-1">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out relative overflow-hidden`}
          style={{ width: `${pct}%` }}
        >
          {pct > 20 && <div className="absolute inset-0 animate-shimmer opacity-30"></div>}
        </div>
      </div>
      <span className={`text-xs font-bold tabular-nums min-w-[36px] text-right ${pct >= 100 ? 'text-emerald-600' : 'text-zinc-500'}`}>
        {pct}%
      </span>
    </div>
  );
}

/* ─── Stat Card Component ─── */
function StatCard({ icon, iconFill, label, value, color, glowClass, delay }: {
  icon: string; iconFill?: boolean; label: string; value: string | number;
  color: string; glowClass: string; delay: number;
}) {
  return (
    <div
      className={`glass-panel p-5 flex items-center gap-4 interactive-card hover:${glowClass} animate-fade-in-up`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-premium-sm`}>
        <span className="material-symbols-outlined text-white text-lg" style={iconFill ? { fontVariationSettings: "'FILL' 1" } : {}}>
          {icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-wider truncate">{label}</p>
        <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white" style={{ fontFamily: 'var(--font-headline)' }}>
          {value}
        </h3>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<'station' | 'client'>('station');
  const { data: responseData, error: swrError, isLoading: swrIsLoading, mutate } = useSWR(`/api/sheet-data?sheet=${activeCategory}`, fetcher, {
    dedupingInterval: 60000,
    keepPreviousData: true,
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("All");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any[] = responseData?.data || [];
  const isLoading = swrIsLoading && !responseData;
  const error = swrError?.message || null;
  const [isExporting, setIsExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'txt' | 'jpeg'>('pdf');
  const [colorMode, setColorMode] = useState<'color' | 'grayscale'>('color');
  const [selectedExportStations, setSelectedExportStations] = useState<string[]>([]);
  const [expandedDistricts, setExpandedDistricts] = useState<string[]>([]);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<any | null>(null);
  const [chartTab, setChartTab] = useState<'average' | 'comparison'>('average');
  const { showToast } = useToast();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortConfig, setSortConfig] = useState<{ key: keyof StationData; direction: "asc" | "desc" } | null>(null);

  const exportRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const fetchSheetData = async (msg = "บันทึกข้อมูลเรียบร้อยแล้ว") => {
    await mutate();
    showToast(msg, 'success');
  };

  useEffect(() => {
    setSelectedProvince("All");
  }, [activeCategory]);

  useEffect(() => {
    const channelName = `realtime-${activeCategory}`;
    const tableName = activeCategory === 'station' ? 'stations' : 'client_systems';
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        mutate();
        showToast(`ข้อมูล ${tableName} มีการอัปเดตใหม่`, 'info');
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeCategory, mutate]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  const handleEditClick = (item: any) => {
    setEditingStation(item);
    if (activeCategory === 'client') setIsClientModalOpen(true);
    else setIsStationModalOpen(true);
  };

  const handleDeleteClick = async (item: any) => {
    if (!item.id || !window.confirm(`Are you sure you want to delete ${item.stationName}?`)) return;
    try {
      const res = await fetch(`/api/sheet-data?sheet=${activeCategory}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchSheetData("ลบข้อมูลสำเร็จ");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleExportTXT = () => {
    setIsExportModalOpen(false);
    const filteredExportData = data.filter(d => selectedExportStations.includes(`${d.district}|${d.stationName}`));
    if (filteredExportData.length === 0) return;
    
    const grouped = filteredExportData.reduce((acc, item) => {
      if (!acc[item.district]) acc[item.district] = [];
      acc[item.district].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    
    // Header Logic
    const districtNames = Object.keys(grouped).map(d => `อ.${d}`);
    let districtsStr = "";
    if (districtNames.length === 1) districtsStr = `"${districtNames[0]}"`;
    else if (districtNames.length === 2) districtsStr = `"${districtNames[0]}" และ "${districtNames[1]}"`;
    else {
      const last = districtNames.pop();
      districtsStr = districtNames.map(d => `"${d}"`).join(", ") + ` และ "${last}"`;
    }

    // Pole height (assume the first one if present, otherwise default to legacy "9 เมตร")
    const commonPoleHeight = filteredExportData[0]?.poleHeight || "9 เมตร";
    
    let text = `${dateStr}\n`;
    const commonProvince = filteredExportData[0]?.province || 'กาญจนบุรี';
    if (activeCategory === 'station') {
      text += `รายงานความคืบหน้างานก่อสร้างฐานรากและติดตั้งเสาสัญญาณ ${commonPoleHeight} สถานีลูกข่าย ${districtsStr} จ.${commonProvince} เขต11 (เพชรบุรี)\n\n`;
    } else {
       text += `รายงานการติดตั้งระบบลูกข่าย (${districtsStr}) จ.${commonProvince}\n\n`;
    }

    // ─── Summary: total / completed / in-progress / not-started ───
    const totalStations = filteredExportData.length;
    let completedCount = 0;
    let inProgressCount = 0;
    let notStartedCount = 0;

    filteredExportData.forEach(item => {
      let progress: number;
      if (activeCategory === 'client') {
        progress = (parseFloat(item.electricProgress || 0) + parseFloat(item.groundProgress || 0) + parseFloat(item.feederProgress || 0)) / 3;
      } else {
        progress = (parseFloat(item.foundationProgress || 0) + parseFloat(item.poleInstallationProgress || 0)) / 2;
      }
      if (progress >= 100) completedCount++;
      else if (progress > 0) inProgressCount++;
      else notStartedCount++;
    });

    text += `จำนวนทั้งหมด ${totalStations} สถานี\n`;
    text += `  - ติดตั้งแล้วเสร็จ ${completedCount} สถานี\n`;
    text += `  - อยู่ระหว่างติดตั้ง ${inProgressCount} สถานี\n`;
    text += `  - ยังไม่ได้ติดตั้ง ${notStartedCount} สถานี\n\n`;

    const groupedEntries = Object.entries(grouped) as [string, any[]][];
    groupedEntries.forEach(([district, items], gIdx) => {
      text += `📍 อำเภอ${district}\n\n`;
      items.forEach((item, idx) => {
        if (activeCategory === 'client') {
          text += `[${idx + 1}]. ${item.stationName}\n`;
          text += `   - พิกัด: ${item.lat}, ${item.lon}\n`;
          text += `   - ความสูงเสา: ${item.poleHeight}\n`;
          text += `   - ระบบไฟฟ้า: ${item.electricProgress}% (ระยะสาย Main: ${item.electricMain})\n`;
          text += `   - ระบบกราวด์: ${item.groundProgress}% (AC: ${item.groundAC} Ω | Equip: ${item.groundEquip} Ω)\n`;
          text += `   - สาย Feeder: ${item.feederProgress}% (Yagi No: ${item.yagiNo} | SN: ${item.sn} | ระยะ feed: ${item.feedDistance})\n`;
          text += `   - การติดตั้งอุปกรณ์บนเสา: ${item.towerProgress}%\n`;
          text += `   - การติดตั้งเครื่องวิทยุฯ: ${item.radioProgress}% (SN: ${item.radioSN})\n`;
          text += `   - แบตเตอรี่ SN: ${item.batterySN}\n`;
          text += `   - ขาติดตั้ง: ${item.mountType} | องศา: ${item.angle} | Test Feeder: ${item.testFeeder}\n`;
          text += `   - ยื่นขอมิเตอร์: ${item.meterRequest || "ยังไม่ได้ยื่น"}\n`;
          text += `   - วันที่: ${formatDateDisplay(item.startDate)} - ${formatDateDisplay(item.endDate)}\n`;
          text += `   - หมายเหตุ: ${item.remark || "-"}\n`;
        } else {
          // LEGACY STYLE for Stations
          text += `[${idx + 1}]. ${item.stationName}`;
          if (item.poleHeight) text += ` (${item.poleHeight})`;
          if (item.baseType) text += ` ${item.baseType}`;
          if (item.type) text += ` ${item.type}`;
          text += `\n`;
          text += `งานก่อสร้างฐานราก: ${item.foundationProgress}%\n`;
          text += `งานติดตั้งโครงเสา: ${item.poleInstallationProgress}%\n`;
          text += `** หมายเหตุ: ${item.remark || "-"}\n`;
          text += `เริ่มงาน: ${formatDateDisplay(item.startDate)}\n`;
          text += `เสร็จงาน: ${formatDateDisplay(item.endDate)}\n`;
        }
        
        if (idx < items.length - 1) {
          text += `\n---\n\n`;
        }
      });

      if (gIdx < groupedEntries.length - 1) {
        text += `\n=========================================\n\n`;
      }
    });

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report_${activeCategory}_${dateStr}.txt`;
    link.click();
  };

  const handleExportPDF = async () => {
    setIsExportModalOpen(false);
    if (isExporting) return;
    setIsExporting(true);
    try {
      // Dynamic imports: deferred to export-time only
      const [{ toJpeg }, jsPDFModule, { createRoot }, ExportBentoReportModule] = await Promise.all([
        import('html-to-image'),
        import('jspdf'),
        import('react-dom/client'),
        import('@/components/ExportBentoReport'),
      ]);
      const jsPDF = jsPDFModule.default;
      const ExportBentoReportRaw = ExportBentoReportModule.default;
      await document.fonts.ready;

      const filtered = data.filter(d => selectedExportStations.includes(`${d.district}|${d.stationName}`));
      if (filtered.length === 0) {
        showToast("กรุณาเลือกข้อมูลที่ต้องการ Export", "error");
        setIsExporting(false);
        return;
      }

      const groupedToExport = filtered.reduce((acc, item) => {
        if (!acc[item.district]) acc[item.district] = [];
        acc[item.district].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      const districtKeys = Object.keys(groupedToExport).sort();
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      let isFirst = true;

      for (const d of districtKeys) {
        const stations = groupedToExport[d];
        const container = document.createElement('div');
        Object.assign(container.style, { position: 'fixed', top: '0', left: '-2000px', width: '1122px', height: '794px', zIndex: '-1000' });
        document.body.appendChild(container);
        const root = createRoot(container);
        
        await new Promise<void>(resolve => {
          root.render(<ExportBentoReportRaw district={d} stations={stations} category={activeCategory} />);
          setTimeout(resolve, 800); 
        });

        const el = container.firstChild as HTMLElement;
        const dataUrl = await toJpeg(el, { quality: 1.0, width: 1122, height: 794, pixelRatio: 6.25 });
        
        if (!isFirst) pdf.addPage();
        pdf.addImage(dataUrl, 'JPEG', 0, 0, 297, 210);
        isFirst = false;

        root.unmount();
        document.body.removeChild(container);
      }

      pdf.save(`report_${activeCategory}_${new Date().getTime()}.pdf`);
      showToast('Export PDF สำเร็จ (600 DPI)', 'success');
    } catch (error: any) {
      console.error(error);
      showToast('Export ล้มเหลว: ' + error.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJPEG = async () => {
    setIsExportModalOpen(false);
    if (isExporting) return;
    setIsExporting(true);
    try {
      // Dynamic imports: deferred to export-time only
      const [{ toJpeg }, { createRoot }, ExportBentoReportModule] = await Promise.all([
        import('html-to-image'),
        import('react-dom/client'),
        import('@/components/ExportBentoReport'),
      ]);
      const ExportBentoReportRaw = ExportBentoReportModule.default;
      await document.fonts.ready;
      
      const filtered = data.filter(d => selectedExportStations.includes(`${d.district}|${d.stationName}`));
      if (filtered.length === 0) return;
      
      const groupedToExport = filtered.reduce((acc, item) => {
        if (!acc[item.district]) acc[item.district] = [];
        acc[item.district].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      const districtsToExport = Object.keys(groupedToExport).sort();

      for (const d of districtsToExport) {
        const stations = groupedToExport[d];
        const container = document.createElement('div');
        Object.assign(container.style, { position: 'fixed', top: '0', left: '-2000px', width: '1122px', height: '794px', zIndex: '-1000' });
        document.body.appendChild(container);
        const root = createRoot(container);
        
        await new Promise<void>(res => {
          root.render(<ExportBentoReportRaw district={d} stations={stations} category={activeCategory} />);
          setTimeout(res, 800);
        });

        const el = container.firstChild as HTMLElement;
        const dataUrl = await toJpeg(el, { quality: 1.0, width: 1122, height: 794, pixelRatio: 6.25 });
        const link = document.createElement('a');
        link.download = `report_${d}_${new Date().getTime()}.jpg`;
        link.href = dataUrl;
        link.click();
        
        root.unmount();
        document.body.removeChild(container);
      }
      showToast('Export JPEG สำเร็จ', 'success');
    } catch (error: any) {
      console.error(error);
      showToast('Export ล้มเหลว: ' + error.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const provinces = useMemo(() => Array.from(new Set(data.map(d => d.province).filter(Boolean))) as string[], [data]);
  const districts = useMemo(() => Array.from(new Set(data.map(d => d.district).filter(Boolean))), [data]);
  const filteredData = useMemo(() => data.filter(item => {
    const matchesSearch = item.stationName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.district || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.province || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = filterDistrict === "All" || item.district === filterDistrict;
    const matchesProvince = selectedProvince === "All" || item.province === selectedProvince;
    const matchesStatus = filterStatus === "All" || 
                          (filterStatus === "Completed" && (item.endDate && item.endDate !== "-")) || 
                          (filterStatus === "In Progress" && (item.startDate && item.startDate !== "-" && !item.endDate));
    return matchesSearch && matchesDistrict && matchesProvince && matchesStatus;
  }), [data, searchTerm, filterDistrict, selectedProvince, filterStatus]);

  const sortedData = useMemo(() => [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;
    const aVal = a[sortConfig.key] ?? "";
    const bVal = b[sortConfig.key] ?? "";
    return sortConfig.direction === "asc" ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
  }), [filteredData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ key: key as any, direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc" }));
  };

  // ─── Compute Stats ───
  const overallProgress = filteredData.length > 0 ? Math.round(filteredData.reduce((acc, d) => {
    const p = activeCategory === 'client' 
      ? (parseFloat(d.electricProgress || 0) + parseFloat(d.groundProgress || 0) + parseFloat(d.feederProgress || 0)) / 3
      : (parseFloat(d.foundationProgress || 0) + parseFloat(d.poleInstallationProgress || 0)) / 2;
    return acc + p;
  }, 0) / filteredData.length) : 0;

  const today = new Date();
  const thaiDate = today.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="bg-zinc-50/50 dark:bg-zinc-950/80 architectural-bg text-zinc-900 dark:text-zinc-100 min-h-screen font-sans">
      <TopNavBar onLogout={handleLogout} onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <SideNavBar 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory} 
        provinces={provinces}
        selectedProvince={selectedProvince}
        onProvinceChange={setSelectedProvince}
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      
      <main className="lg:ml-[280px] pt-16 lg:pt-20 p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 auto-rows-min max-w-[1600px] mx-auto">
        <StationModal isOpen={isStationModalOpen} onClose={() => setIsStationModalOpen(false)} onSave={fetchSheetData} editingStation={editingStation} districts={districts} />
        <ClientSystemModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} onSave={fetchSheetData} editingStation={editingStation} districts={districts} />

        {/* ════════════ HEADER ════════════ */}
        <header className="col-span-1 md:col-span-2 lg:col-span-12 glass-panel-elevated p-6 sm:p-8 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-1.5 tracking-wide">{thaiDate}</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>
                {activeCategory === 'client' ? "ระบบลูกข่าย" : "ข้อมูลสถานี"}
              </h1>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1 font-medium">
                {activeCategory === 'client' ? "ติดตามความคืบหน้าการติดตั้งระบบ" : "ติดตามงานโครงสร้างพื้นฐานและฐานราก"}
              </p>
            </div>
            <button 
              onClick={() => { setEditingStation(null); activeCategory === 'client' ? setIsClientModalOpen(true) : setIsStationModalOpen(true); }} 
              className="group px-5 py-2.5 rounded-xl font-bold shadow-premium-sm hover:shadow-premium-md transition-all duration-300 flex items-center gap-2 text-white gradient-primary hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-sm group-hover:rotate-90 transition-transform duration-300">add</span>
              เพิ่ม{activeCategory === 'client' ? 'งาน' : 'สถานี'}
            </button>
          </div>
        </header>

        {/* ════════════ STAT CARDS ════════════ */}
        <div className="col-span-1 md:col-span-2 lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Overall */}
          <StatCard
            icon="analytics" iconFill
            label={`ภาพรวม ${activeCategory === 'client' ? 'ลูกข่าย' : 'งานโครงสร้าง'}`}
            value={`${overallProgress}%`}
            color="from-blue-500 to-indigo-600"
            glowClass="glow-blue"
            delay={0.05}
          />

          {activeCategory === 'client' ? (
            <>
              <StatCard icon="bolt" iconFill label="ระบบไฟฟ้า"
                value={`${filteredData.length > 0 ? Math.round(filteredData.reduce((acc, d) => acc + parseFloat(d.electricProgress || 0), 0) / filteredData.length) : 0}%`}
                color="from-indigo-500 to-violet-600" glowClass="glow-indigo" delay={0.1}
              />
              <StatCard icon="nest_eco_leaf" iconFill label="ระบบกราวด์"
                value={`${filteredData.length > 0 ? Math.round(filteredData.reduce((acc, d) => acc + parseFloat(d.groundProgress || 0), 0) / filteredData.length) : 0}%`}
                color="from-emerald-500 to-teal-600" glowClass="glow-emerald" delay={0.15}
              />
              <StatCard icon="settings_input_antenna" iconFill label="สาย FEEDER"
                value={`${filteredData.length > 0 ? Math.round(filteredData.reduce((acc, d) => acc + parseFloat(d.feederProgress || 0), 0) / filteredData.length) : 0}%`}
                color="from-amber-500 to-orange-600" glowClass="glow-amber" delay={0.2}
              />
            </>
          ) : (
            <>
              <StatCard icon="foundation" iconFill label="เฉลี่ยฐานราก"
                value={`${filteredData.length > 0 ? Math.round(filteredData.reduce((acc, d) => acc + parseFloat(d.foundationProgress || 0), 0) / filteredData.length) : 0}%`}
                color="from-cyan-500 to-blue-600" glowClass="glow-cyan" delay={0.1}
              />
              <StatCard icon="vertical_align_top" iconFill label="เฉลี่ยติดตั้งเสา"
                value={`${filteredData.length > 0 ? Math.round(filteredData.reduce((acc, d) => acc + parseFloat(d.poleInstallationProgress || 0), 0) / filteredData.length) : 0}%`}
                color="from-orange-500 to-rose-600" glowClass="glow-orange" delay={0.15}
              />
              <StatCard icon="verified" iconFill label="สำเร็จทั้งโครงการ"
                value={`${filteredData.filter(d => {
                  const p = (parseFloat(d.foundationProgress || 0) + parseFloat(d.poleInstallationProgress || 0)) / 2;
                  return p >= 100;
                }).length} / ${filteredData.length}`}
                color="from-emerald-500 to-green-600" glowClass="glow-green" delay={0.2}
              />
            </>
          )}
        </div>

        {/* ════════════ CHART + MAP ROW ════════════ */}
        <Suspense fallback={<><div className="col-span-1 md:col-span-2 lg:col-span-7 glass-panel p-6 h-[460px] animate-pulse bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" /><div className="col-span-1 md:col-span-2 lg:col-span-5 glass-panel p-2 h-[460px] animate-pulse bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" /></>}>
        <div className="col-span-1 md:col-span-2 lg:col-span-7 glass-panel p-6 flex flex-col z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="flex items-center gap-1 p-1 bg-zinc-100/70 dark:bg-zinc-800/40 rounded-xl">
              <button onClick={() => setChartTab('average')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${chartTab === 'average' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>
                เฉลี่ยรายอำเภอ
              </button>
              <button onClick={() => setChartTab('comparison')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${chartTab === 'comparison' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>
                เปรียบเทียบ
              </button>
            </div>
          </div>
          <div className="h-[400px]">
            {chartTab === 'average' ? <DistrictProgressChart data={filteredData} category={activeCategory} /> : <ComparisonChart data={filteredData} category={activeCategory} />}
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-5 h-[400px] sm:h-full min-h-[400px] glass-panel p-2 flex flex-col relative animate-fade-in-up z-10" style={{ animationDelay: '0.2s' }}>
          <div className="w-full h-full rounded-2xl overflow-hidden relative z-10"><MapView data={filteredData} category={activeCategory} /></div>
        </div>
        </Suspense>

        {/* ════════════ DATA TABLE ════════════ */}
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
                  placeholder="ค้นหาสถานี..." 
                  className="pl-9 pr-4 py-2.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-800 border-none outline-none text-sm w-[200px] placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-zinc-700 transition-all duration-200" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
              <button 
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
                  const progress = activeCategory === 'client' 
                    ? (parseFloat(item.electricProgress || 0) + parseFloat(item.groundProgress || 0) + parseFloat(item.feederProgress || 0)) / 3
                    : (parseFloat(item.foundationProgress || 0) + parseFloat(item.poleInstallationProgress || 0)) / 2;
                  
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
                          <button onClick={() => handleEditClick(item)} className="p-1.5 hover:bg-blue-100/80 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95">
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button onClick={() => handleDeleteClick(item)} className="p-1.5 hover:bg-red-100/80 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* ════════════ EXPORT MODAL ════════════ */}
      {isExportModalOpen && (
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
                onClick={exportType === 'txt' ? handleExportTXT : (exportType === 'jpeg' ? handleExportJPEG : handleExportPDF)} 
                className="flex-1 py-3.5 text-white font-bold rounded-2xl shadow-premium-sm hover:shadow-premium-md transition-all duration-200 gradient-primary text-sm hover:scale-[1.01] active:scale-[0.99]"
              >
                Confirm Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
