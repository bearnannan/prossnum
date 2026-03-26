"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createRoot } from "react-dom/client";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { StationData, ClientSystemData } from "./api/sheet-data/route";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import { Skeleton, SkeletonLayout } from "@/components/Skeleton";
import ExportBentoReportRaw from '@/components/ExportBentoReport';
import StationModal from '@/components/StationModal';
import ClientSystemModal from '@/components/ClientSystemModal';
import TopNavBar from '@/components/TopNavBar';
import SideNavBar from '@/components/SideNavBar';

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
  loading: () => <div className="h-full w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-zinc-500 text-sm">Loading Map...</div>
});

const ProgressChart = dynamic(() => import('@/components/ProgressChart'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-zinc-500 text-sm">Loading Chart...</div>
});

const DistrictProgressChart = dynamic(() => import('@/components/DistrictProgressChart'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-zinc-500 text-sm">Loading Chart...</div>
});

const ExportBentoReport = dynamic(() => import('@/components/ExportBentoReport'), {
  ssr: false,
});

const ComparisonChart = dynamic(() => import('@/components/ComparisonChart'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-zinc-500 text-sm">Loading Chart...</div>
});

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<'station' | 'client'>('station');
  const { data: responseData, error: swrError, isLoading: swrIsLoading, mutate } = useSWR(`/api/sheet-data?sheet=${activeCategory}`, fetcher, {
    dedupingInterval: 60000,
    keepPreviousData: true,
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    if (activeCategory === 'station') {
      text += `รายงานความคืบหน้างานก่อสร้างฐานรากและติดตั้งเสาสัญญาณ ${commonPoleHeight} สถานีลูกข่าย ${districtsStr} จ.กาญจนบุรี เขต11 (เพชรบุรี)\n\n`;
    } else {
       text += `รายงานการติดตั้งระบบลูกข่าย (${districtsStr})\n\n`;
    }

    const groupedEntries = Object.entries(grouped) as [string, any[]][];
    groupedEntries.forEach(([district, items], gIdx) => {
      text += `📍 อำเภอ${district}\n\n`;
      items.forEach((item, idx) => {
        if (activeCategory === 'client') {
          text += `[${idx + 1}]. ${item.stationName}\n`;
          text += `   - พิกัด: ${item.lat}, ${item.lon}\n`;
          text += `   - ความสูงเสา: ${item.poleHeight}\n`;
          text += `   - ระบบไฟฟ้า: ${item.electricProgress}% (ระยะสาย Main: ${item.electricMain})\n`;
          text += `   - ระบบกราวด์: ${item.groundProgress}% (AC: ${item.groundAC} Ω | Equip: ${item.groundEquip} Ω)\n`;
          text += `   - สาย Feeder: ${item.feederProgress}% (Yagi No: ${item.yagiNo} | ระยะ feed: ${item.feedDistance})\n`;
          text += `   - การติดตั้งอุปกรณ์บนเสา: ${item.towerProgress}%\n`;
          text += `   - การติดตั้งเครื่องวิทยุฯ: ${item.radioProgress}%\n`;
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
      const { toJpeg } = await import('html-to-image');
      const jsPDF = (await import('jspdf')).default;
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
      const { toJpeg } = await import('html-to-image');
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

  const districts = useMemo(() => Array.from(new Set(data.map(d => d.district).filter(Boolean))), [data]);
  const filteredData = useMemo(() => data.filter(item => {
    const matchesSearch = item.stationName.toLowerCase().includes(searchTerm.toLowerCase()) || item.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = filterDistrict === "All" || item.district === filterDistrict;
    const matchesStatus = filterStatus === "All" || (filterStatus === "Completed" && (item.endDate && item.endDate !== "-")) || (filterStatus === "In Progress" && (item.startDate && item.startDate !== "-" && !item.endDate));
    return matchesSearch && matchesDistrict && matchesStatus;
  }), [data, searchTerm, filterDistrict, filterStatus]);

  const sortedData = useMemo(() => [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;
    const aVal = a[sortConfig.key] ?? "";
    const bVal = b[sortConfig.key] ?? "";
    return sortConfig.direction === "asc" ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
  }), [filteredData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ key: key as any, direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc" }));
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen font-sans">
      <TopNavBar onLogout={handleLogout} onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <SideNavBar activeCategory={activeCategory} onCategoryChange={setActiveCategory} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <main className="lg:ml-[280px] pt-16 lg:pt-20 p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        <StationModal isOpen={isStationModalOpen} onClose={() => setIsStationModalOpen(false)} onSave={fetchSheetData} editingStation={editingStation} districts={districts} />
        <ClientSystemModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} onSave={fetchSheetData} editingStation={editingStation} districts={districts} />

        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">
              {activeCategory === 'client' ? "ระบบลูกข่าย" : "ข้อมูลสถานี"}
            </h1>
            <p className="text-zinc-500 text-sm">
              {activeCategory === 'client' ? "ติดตามความคืบหน้าการติดตั้ง" : "ติดตามงานโครงสร้างและพื้นฐาน"}
            </p>
          </div>
          <button onClick={() => { setEditingStation(null); activeCategory === 'client' ? setIsClientModalOpen(true) : setIsStationModalOpen(true); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> เพิ่ม{activeCategory === 'client' ? 'งาน' : 'สถานี'}
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Overall / Total */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined font-icon">analytics</span>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">ภาพรวม {activeCategory === 'client' ? 'ลูกข่าย' : 'งานโครงสร้าง'}</p>
              <h3 className="text-2xl font-black text-blue-600">
                {data.length > 0 ? Math.round(data.reduce((acc, d) => {
                  const p = activeCategory === 'client' 
                    ? (parseFloat(d.electricProgress || 0) + parseFloat(d.groundProgress || 0) + parseFloat(d.feederProgress || 0)) / 3
                    : (parseFloat(d.foundationProgress || 0) + parseFloat(d.poleInstallationProgress || 0)) / 2;
                  return acc + p;
                }, 0) / data.length) : 0}%
              </h3>
            </div>
          </div>

          {activeCategory === 'client' ? (
            <>
              {/* Client Spec Card 2: Electric */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                  <span className="material-symbols-outlined font-icon">bolt</span>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">ระบบไฟฟ้า</p>
                  <h3 className="text-2xl font-black text-indigo-600">
                    {data.length > 0 ? Math.round(data.reduce((acc, d) => acc + parseFloat(d.electricProgress || 0), 0) / data.length) : 0}%
                  </h3>
                </div>
              </div>
              {/* Client Spec Card 3: Ground */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined font-icon">nest_eco_leaf</span>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">ระบบกราวด์</p>
                  <h3 className="text-2xl font-black text-emerald-600">
                    {data.length > 0 ? Math.round(data.reduce((acc, d) => acc + parseFloat(d.groundProgress || 0), 0) / data.length) : 0}%
                  </h3>
                </div>
              </div>
              {/* Client Spec Card 4: Feeder */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                  <span className="material-symbols-outlined font-icon">settings_input_antenna</span>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">สาย FEEDER</p>
                  <h3 className="text-2xl font-black text-amber-600">
                    {data.length > 0 ? Math.round(data.reduce((acc, d) => acc + parseFloat(d.feederProgress || 0), 0) / data.length) : 0}%
                  </h3>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Station Spec Card 2: Foundation */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600">
                  <span className="material-symbols-outlined font-icon">foundation</span>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">เฉลี่ยฐานราก</p>
                  <h3 className="text-2xl font-black text-cyan-600">
                    {data.length > 0 ? Math.round(data.reduce((acc, d) => acc + parseFloat(d.foundationProgress || 0), 0) / data.length) : 0}%
                  </h3>
                </div>
              </div>
              {/* Station Spec Card 3: Pole */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                  <span className="material-symbols-outlined font-icon">vertical_align_top</span>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">เฉลี่ยติดตั้งเสา</p>
                  <h3 className="text-2xl font-black text-orange-600">
                    {data.length > 0 ? Math.round(data.reduce((acc, d) => acc + parseFloat(d.poleInstallationProgress || 0), 0) / data.length) : 0}%
                  </h3>
                </div>
              </div>
              {/* Station Spec Card 4: Success Count */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                  <span className="material-symbols-outlined font-icon">verified</span>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">สำเร็จทั้งโครงการ</p>
                  <h3 className="text-2xl font-black text-green-600">
                    {data.filter(d => {
                      const p = (parseFloat(d.foundationProgress || 0) + parseFloat(d.poleInstallationProgress || 0)) / 2;
                      return p >= 100;
                    }).length} / {data.length}
                  </h3>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3 mb-6">
             <button onClick={() => setChartTab('average')} className={`px-4 py-2 rounded-xl text-sm font-bold ${chartTab === 'average' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}>เฉลี่ยรายอำเภอ</button>
             <button onClick={() => setChartTab('comparison')} className={`px-4 py-2 rounded-xl text-sm font-bold ${chartTab === 'comparison' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}>เปรียบเทียบ</button>
          </div>
          <div className="h-[400px]">
            {chartTab === 'average' ? <DistrictProgressChart data={data} category={activeCategory} /> : <ComparisonChart data={data} category={activeCategory} />}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-black">{activeCategory === 'client' ? "รายการระบบลูกข่าย (แบบละเอียด)" : "รายการข้อมูลสถานี (แบบละเอียด)"}</h2>
            <div className="flex flex-wrap gap-2">
              <input type="text" placeholder="ค้นหา..." className="px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none outline-none text-sm w-[200px]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <button onClick={() => { setExportType('pdf'); setIsExportModalOpen(true); }} className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-sm">download</span> Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin">
            <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase font-black sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('district')}>อำเภอ {sortConfig?.key === 'district' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('stationName')}>สถานี {sortConfig?.key === 'stationName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  {activeCategory === 'station' ? (
                    <>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">ฐานราก (%)</th>
                      <th className="px-4 py-3">ติดตั้งเสา (%)</th>
                      <th className="px-4 py-3">ความสูงเสา</th>
                      <th className="px-4 py-3">พิกัด (Lat/Lon)</th>
                      <th className="px-4 py-3">เริ่มงาน</th>
                      <th className="px-4 py-3">เสร็จงาน</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3">ไฟฟ้า (%)</th>
                      <th className="px-4 py-3">กราวด์ (%)</th>
                      <th className="px-4 py-3">AC Ω</th>
                      <th className="px-4 py-3">Feeder (%)</th>
                      <th className="px-4 py-3">Radio (%)</th>
                      <th className="px-4 py-3">RSSI</th>
                      <th className="px-4 py-3">ขอมิเตอร์</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-right sticky right-0 bg-zinc-50 dark:bg-zinc-800">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {sortedData.map((item, idx) => {
                  const progress = activeCategory === 'client' 
                    ? (parseFloat(item.electricProgress) + parseFloat(item.groundProgress) + parseFloat(item.feederProgress)) / 3
                    : (parseFloat(item.foundationProgress) + parseFloat(item.poleInstallationProgress)) / 2;
                  
                  return (
                    <tr key={item.id || idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors group">
                      <td className="px-4 py-3 font-bold">{item.district}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-blue-600 dark:text-blue-400">{item.stationName}</div>
                        <div className="text-[10px] text-zinc-400 truncate max-w-[150px]">{item.remark || "ไม่มีหมายเหตุ"}</div>
                      </td>
                      {activeCategory === 'station' ? (
                        <>
                          <td className="px-4 py-3 text-zinc-500">{item.type}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${parseFloat(item.foundationProgress) >= 100 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                              {item.foundationProgress}%
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${parseFloat(item.poleInstallationProgress) >= 100 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                              {item.poleInstallationProgress}%
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono">{item.poleHeight}</td>
                          <td className="px-4 py-3 text-[10px] text-zinc-500">
                             {item.lat.toFixed(4)}, {item.lon.toFixed(4)}
                          </td>
                          <td className="px-4 py-3">{formatDateDisplay(item.startDate)}</td>
                          <td className="px-4 py-3">{formatDateDisplay(item.endDate)}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">{item.electricProgress}%</td>
                          <td className="px-4 py-3">{item.groundProgress}%</td>
                          <td className="px-4 py-3 font-mono">{item.groundAC || "-"}</td>
                          <td className="px-4 py-3">{item.feederProgress}%</td>
                          <td className="px-4 py-3">{item.radioProgress}%</td>
                          <td className="px-4 py-3 font-mono">{item.rssi || "-"}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.meterRequest === 'ยื่นแล้ว' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                              {item.meterRequest || "ยังไม่ได้ยื่น"}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 text-right sticky right-0 bg-white dark:bg-zinc-900 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] group-hover:bg-zinc-50/50 dark:group-hover:bg-zinc-800/50">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleEditClick(item)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button onClick={() => handleDeleteClick(item)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors">
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

        <div className="h-[400px] rounded-3xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800">
           <MapView data={data} category={activeCategory} />
        </div>
      </main>

      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-2xl font-black">Export Data</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-zinc-100 flex items-center justify-center">×</button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              <div className="flex gap-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                 <button onClick={() => setExportType('pdf')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${exportType === 'pdf' ? 'bg-white shadow-sm' : 'text-zinc-500'}`}>PDF REPORT</button>
                 <button onClick={() => setExportType('jpeg')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${exportType === 'jpeg' ? 'bg-white shadow-sm' : 'text-zinc-500'}`}>JPEG IMAGE</button>
                 <button onClick={() => setExportType('txt')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${exportType === 'txt' ? 'bg-white shadow-sm' : 'text-zinc-500'}`}>TXT SUMMARY</button>
              </div>
              <div className="space-y-4">
                {districts.map(d => {
                  const districtStations = data.filter(s => s.district === d);
                  const selectedInDistrict = selectedExportStations.filter(s => s.startsWith(`${d}|`));
                  const isAllSelected = selectedInDistrict.length === districtStations.length && districtStations.length > 0;
                  const isExpanded = expandedDistricts.includes(d);

                  return (
                    <div key={d} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                      <div className="p-4 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer font-bold flex-1">
                          <input 
                            type="checkbox" 
                            checked={isAllSelected} 
                            onChange={(e) => {
                              const keys = districtStations.map(s => `${s.district}|${s.stationName}`);
                              if (e.target.checked) setSelectedExportStations(prev => [...new Set([...prev, ...keys])]);
                              else setSelectedExportStations(prev => prev.filter(k => !keys.includes(k)));
                            }} 
                            className="w-5 h-5 rounded-md accent-zinc-900" 
                          />
                          <span className="text-zinc-900 dark:text-zinc-100">{d}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded-full text-zinc-500">
                            {selectedInDistrict.length}/{districtStations.length}
                          </span>
                        </label>
                        <button 
                          onClick={() => setExpandedDistricts(prev => isExpanded ? prev.filter(item => item !== d) : [...prev, d])}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                          <span className={`material-symbols-outlined transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        </button>
                      </div>
                      
                      {isExpanded && (
                        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {districtStations.map(s => {
                            const key = `${s.district}|${s.stationName}`;
                            const isSelected = selectedExportStations.includes(key);
                            return (
                              <label key={key} className="flex items-center gap-2 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl cursor-pointer transition-colors group">
                                <input 
                                  type="checkbox" 
                                  checked={isSelected} 
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedExportStations(prev => [...prev, key]);
                                    else setSelectedExportStations(prev => prev.filter(k => k !== key));
                                  }}
                                  className="w-4 h-4 rounded-md accent-blue-600"
                                />
                                <span className={`text-xs ${isSelected ? 'text-blue-600 font-bold' : 'text-zinc-500'} group-hover:text-zinc-900 dark:group-hover:text-zinc-100`}>
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
            </div>
            <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 flex gap-4">
               <button onClick={() => setIsExportModalOpen(false)} className="flex-1 py-4 font-bold rounded-2xl hover:bg-zinc-100">Cancel</button>
               <button onClick={exportType === 'txt' ? handleExportTXT : (exportType === 'jpeg' ? handleExportJPEG : handleExportPDF)} className="flex-1 py-4 bg-zinc-900 text-white font-bold rounded-2xl shadow-xl hover:opacity-90">Confirm Export</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
