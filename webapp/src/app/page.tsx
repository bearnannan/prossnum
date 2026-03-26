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
    let text = `${dateStr}\n\n`;

    (Object.entries(grouped) as [string, any[]][]).forEach(([district, items]) => {
      text += `📍 ${district}\n`;
      items.forEach((item, idx) => {
        text += `[${idx+1}]. ${item.stationName}\n`;
        if (activeCategory === 'client') {
          text += `ไฟฟ้า: ${item.electricProgress}% | กราวด์: ${item.groundProgress}% | Feeder: ${item.feederProgress}%\n`;
        } else {
          text += `ฐานราก: ${item.foundationProgress}% | ติดตั้งเสา: ${item.poleInstallationProgress}%\n`;
        }
        text += `สถานะ: ${item.remark || "-"}\n---\n`;
      });
      text += `\n`;
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
      const districtsToExport = Array.from(new Set(filtered.map(d => d.district)));
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      let isFirst = true;

      for (const d of districtsToExport) {
        const stations = filtered.filter(s => s.district === d);
        const container = document.createElement('div');
        Object.assign(container.style, { position: 'fixed', top: '0', left: '0', width: '1122px', height: '794px', zIndex: '-1000', backgroundColor: '#F3F4F6' });
        document.body.appendChild(container);
        const root = createRoot(container);
        await new Promise<void>(res => {
          root.render(<ExportBentoReportRaw district={d} stations={stations} category={activeCategory} />);
          setTimeout(res, 500);
        });
        const imgData = await toJpeg(container, { quality: 0.95, width: 1122, height: 794, pixelRatio: 2 });
        root.unmount();
        document.body.removeChild(container);
        if (!isFirst) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
        isFirst = false;
      }
      pdf.save(`report_${activeCategory}.pdf`);
    } catch (err: any) {
      alert("Error: " + err.message);
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
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600"><span className="material-symbols-outlined">cell_tower</span></div>
            <div><p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">ทั้งหมด</p><h3 className="text-2xl font-black">{data.length}</h3></div>
          </div>
          {/* Add more stat cards here if needed */}
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
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between gap-4">
            <h2 className="text-xl font-black">รายการข้อมูล</h2>
            <div className="flex flex-wrap gap-2">
              <input type="text" placeholder="ค้นหา..." className="px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none outline-none text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <button onClick={() => { setExportType('pdf'); setIsExportModalOpen(true); }} className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold flex items-center gap-2">Export</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase font-bold">
                <tr>
                  <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('district')}>อำเภอ</th>
                  <th className="px-6 py-4">สถานี</th>
                  <th className="px-6 py-4 text-center">ความคืบหน้า</th>
                  <th className="px-6 py-4 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {sortedData.map((item, idx) => {
                  const progress = activeCategory === 'client' 
                    ? (parseFloat(item.electricProgress) + parseFloat(item.groundProgress) + parseFloat(item.feederProgress)) / 3
                    : (parseFloat(item.foundationProgress) + parseFloat(item.poleInstallationProgress)) / 2;
                  return (
                    <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold">{item.district}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold">{item.stationName}</div>
                        <div className="text-xs text-zinc-400">{item.type}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="font-bold w-10 text-right">{Math.round(progress)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEditClick(item)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg">แก้ไข</button>
                          <button onClick={() => handleDeleteClick(item)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 rounded-lg">ลบ</button>
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
                 <button onClick={() => setExportType('txt')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${exportType === 'txt' ? 'bg-white shadow-sm' : 'text-zinc-500'}`}>TXT SUMMARY</button>
              </div>
              <div className="space-y-4">
                {districts.map(d => (
                  <div key={d} className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <label className="flex items-center gap-3 cursor-pointer font-bold">
                       <input type="checkbox" checked={selectedExportStations.filter(s => s.startsWith(d)).length === data.filter(s => s.district === d).length} onChange={(e) => {
                          const keys = data.filter(s => s.district === d).map(s => `${s.district}|${s.stationName}`);
                          if (e.target.checked) setSelectedExportStations(prev => [...new Set([...prev, ...keys])]);
                          else setSelectedExportStations(prev => prev.filter(k => !keys.includes(k)));
                       }} className="w-5 h-5 rounded-md" />
                       {d}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 flex gap-4">
               <button onClick={() => setIsExportModalOpen(false)} className="flex-1 py-4 font-bold rounded-2xl hover:bg-zinc-100">Cancel</button>
               <button onClick={exportType === 'txt' ? handleExportTXT : handleExportPDF} className="flex-1 py-4 bg-zinc-900 text-white font-bold rounded-2xl shadow-xl hover:opacity-90">Confirm Export</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
