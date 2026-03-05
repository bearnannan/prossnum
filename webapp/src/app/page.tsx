"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createRoot } from "react-dom/client";
import dynamic from "next/dynamic";
import { StationData } from "./api/sheet-data/route";
import ExportBentoReportRaw from '@/components/ExportBentoReport';
import StationModal from '@/components/StationModal';

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
  const [data, setData] = useState<StationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'txt' | 'jpeg'>('pdf');
  const [colorMode, setColorMode] = useState<'color' | 'grayscale'>('color');
  const [selectedExportStations, setSelectedExportStations] = useState<string[]>([]);
  const [expandedDistricts, setExpandedDistricts] = useState<string[]>([]);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<StationData | null>(null);
  const [chartTab, setChartTab] = useState<'average' | 'comparison'>('average');
  const router = useRouter();

  // Search, Filter, Sort States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortConfig, setSortConfig] = useState<{ key: keyof StationData; direction: "asc" | "desc" } | null>(null);

  // Refs map: district name -> div element for html2canvas capture
  const exportRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // No inline form state needed — handled by StationModal

  const fetchSheetData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sheet-data");
      if (!res.ok) throw new Error("Failed to fetch data");
      const json = await res.json();
      setData(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  useEffect(() => {
    fetchSheetData();
  }, []);

  const handleEditClick = (station: StationData) => {
    setEditingStation(station);
    setIsStationModalOpen(true);
  };

  const handleDeleteClick = async (station: StationData) => {
    if (!station.rowIndex) return;

    // Check if confirming deletion
    const isConfirmed = window.confirm(`Are you sure you want to delete ${station.stationName}? This action cannot be undone.`);

    if (isConfirmed) {
      try {
        setIsLoading(true);
        const res = await fetch("/api/sheet-data", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rowIndex: station.rowIndex }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to delete data");
        }

        // Re-fetch data to reflect the deletion
        await fetchSheetData();
        alert(`Data deleted successfully!`);
      } catch (err: any) {
        alert(`Error deleting data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };


  // ── Export logic ──────────────────────────────────────────────
  const handleExportTXT = () => {
    setIsExportModalOpen(false);
    if (selectedExportStations.length === 0) return;

    const filteredExportData = data.filter(d =>
      selectedExportStations.includes(`${d.district}|${d.stationName}`)
    );

    // Group by district
    const groupedByDistrict = filteredExportData.reduce((acc, station) => {
      if (!acc[station.district]) {
        acc[station.district] = [];
      }
      acc[station.district].push(station);
      return acc;
    }, {} as Record<string, typeof filteredExportData>);

    // Format date as DD-MM-YY (e.g. 05-03-26)
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    const dateStr = `${day}-${month}-${year}`;

    let textContent = `${dateStr}\n`;
    textContent += `รายงานความคืบหน้างานก่อสร้างฐานรากและติดตั้งเสาสัญญาณ 9 เมตร สถานีลูกข่าย "อ.เลาขวัญ" และ "อ.ห้วยกระเจา" จ.กาญจนบุรี เขต11 (เพชรบุรี)\n\n`;

    const districtKeys = Object.keys(groupedByDistrict);

    districtKeys.forEach((district, dIndex) => {
      const displayDistrict = district.startsWith('อำเภอ') ? district : `อำเภอ${district}`;
      textContent += `📍 ${displayDistrict}\n\n`;

      const stations = groupedByDistrict[district];
      stations.forEach((station, index) => {
        textContent += `[${index + 1}]. สถานีลูกข่าย ${station.stationName} (${station.poleHeight || "ไม่ระบุ"}) ${station.type}\n`;
        textContent += `งานก่อสร้างฐานราก: ${station.foundationProgress || 0}%\n`;
        textContent += `งานติดตั้งโครงเสา: ${station.poleInstallationProgress || 0}%\n`;
        textContent += `** หมายเหตุ: ${station.remark || "-"}\n`;
        textContent += `เริ่มงาน: ${station.startDate || "-"}\n\n`;

        if (index < stations.length - 1) {
          textContent += `---\n\n`;
        }
      });

      if (dIndex < districtKeys.length - 1) {
        textContent += `=========================================\n\n`;
      }
    });

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `progress_summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    setIsExportModalOpen(false);
    if (isExporting || selectedExportStations.length === 0) return;
    setIsExporting(true);
    try {
      const { toJpeg } = await import('html-to-image');
      const jsPDF = (await import('jspdf')).default;

      // Ensure fonts are loaded before capturing
      await document.fonts.ready;

      // Filter data down to only selected stations
      const filteredExportData = data.filter(d =>
        selectedExportStations.includes(`${d.district}|${d.stationName}`)
      );

      const districtsToExport = Array.from(new Set(filteredExportData.map(d => d.district)));

      // A4 landscape: 297 × 210 mm
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      let isFirstPage = true;

      for (const district of districtsToExport) {
        // Only stations in this district that were selected
        const stationsForThisDistrict = filteredExportData.filter(d => d.district === district);

        // Create a temporary container in the actual DOM
        const container = document.createElement('div');
        // Position it off-screen visually but technically in flow enough to not be ignored
        Object.assign(container.style, {
          position: 'fixed',
          top: '0',
          left: '0',
          width: '1122px',
          height: '794px',
          zIndex: '-1000',
          pointerEvents: 'none',
          backgroundColor: '#F3F4F6'
        });
        document.body.appendChild(container);

        // Render the component into the container
        const root = createRoot(container);

        // We need to wait for rendering to finish. 
        // A simple Promise wraps the render to ensure the DOM is populated.
        await new Promise<void>((resolve) => {
          root.render(
            <div id={`export-wrap-${district}`} style={{ width: '100%', height: '100%' }}>
              <ExportBentoReportRaw
                district={district}
                stations={stationsForThisDistrict}
              />
            </div>
          );
          // Wait a frame for React to commit, then another slightly longer delay for charts to animate/render
          setTimeout(resolve, 300);
        });

        // html-to-image renders via SVG foreignObject — natively supports oklch/lab.
        const el = container.firstChild as HTMLElement;

        if (exportType === 'jpeg' && colorMode === 'grayscale') {
          el.style.filter = 'grayscale(100%)';
        }

        // Warming up pass
        await toJpeg(el, { width: 1122, height: 794 }).catch(() => { });

        // Final settings based on export type
        const exportOptions = exportType === 'jpeg' ? {
          quality: 1.0,
          backgroundColor: '#F3F4F6',
          width: 1122,
          height: 794,
          pixelRatio: 6.25, // 96 * 6.25 = 600 DPI
        } : {
          quality: 0.95,
          backgroundColor: '#F3F4F6',
          width: 1122,
          height: 794,
          pixelRatio: 2, // 2x for standard PDF
        };

        const imgData = await toJpeg(el, exportOptions);

        // Clean up DOM immediately
        root.unmount();
        document.body.removeChild(container);

        if (exportType === 'jpeg') {
          // Download individual JPEG for this district
          const link = document.createElement("a");
          link.href = imgData;
          link.download = `report_${district}.jpg`;
          document.body.appendChild(link);
          link.click();
          // Small delay before next to avoid hanging the browser visually if multiple downloads
          await new Promise(r => setTimeout(r, 100));
          document.body.removeChild(link);
        } else {
          // Merge into PDF
          const pdfW = pdf.internal.pageSize.getWidth();
          const pdfH = pdf.internal.pageSize.getHeight();

          if (!isFirstPage) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
          isFirstPage = false;
        }
      }

      if (exportType === 'pdf') {
        pdf.save('district-report.pdf');
      }
    } catch (err: any) {
      alert('Export failed: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // ──────────────────────────────────────────────────────────────

  // Districts list (computed once for export refs + export containers)
  const districts = Array.from(new Set(data.map(d => d.district).filter(Boolean)));

  // ── Search, Filter & Sort Logic ──────────────────────────────
  const filteredData = data.filter((station) => {
    const matchesSearch = station.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.district.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDistrict = filterDistrict === "All" || station.district === filterDistrict;
    const matchesType = filterType === "All" || station.type === filterType;
    let matchesStatus = true;
    if (filterStatus === "Completed") {
      matchesStatus = station.foundationProgress === 100 && station.poleInstallationProgress === 100;
    } else if (filterStatus === "In Progress") {
      matchesStatus = (station.foundationProgress > 0 || station.poleInstallationProgress > 0) &&
        !(station.foundationProgress === 100 && station.poleInstallationProgress === 100);
    } else if (filterStatus === "Not Started") {
      matchesStatus = station.foundationProgress === 0 && station.poleInstallationProgress === 0;
    }

    return matchesSearch && matchesDistrict && matchesType && matchesStatus;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let aVal = a[key] ?? "";
    let bVal = b[key] ?? "";

    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key: keyof StationData) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof StationData) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F4F6] px-4 py-6 sm:p-8 font-sans dark:bg-zinc-900">

      {/* Station Modal */}
      <StationModal
        isOpen={isStationModalOpen}
        onClose={() => { setIsStationModalOpen(false); setEditingStation(null); }}
        onSave={fetchSheetData}
        editingStation={editingStation}
        districts={districts}
      />

      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Progress Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Real-time tracking for station installation progress
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Add Station button */}
            <button
              onClick={() => { setEditingStation(null); setIsStationModalOpen(true); }}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="hidden sm:inline">เพิ่มสถานี</span>
              <span className="sm:hidden">เพิ่ม</span>
            </button>
            {/* Export TXT button */}
            {!isLoading && data.length > 0 && (
              <button
                onClick={() => {
                  const allStationKeys = data.map(d => `${d.district}|${d.stationName}`);
                  setSelectedExportStations(allStationKeys);
                  setExpandedDistricts([]);
                  setExportType('txt');
                  setIsExportModalOpen(true);
                }}
                disabled={isExporting}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <span className="hidden sm:inline">Export สรุปงาน (.txt)</span>
                <span className="sm:hidden">สรุปงาน</span>
              </button>
            )}
            {/* Export PDF/JPEG button */}
            {!isLoading && data.length > 0 && (
              <button
                onClick={() => {
                  const allStationKeys = data.map(d => `${d.district}|${d.stationName}`);
                  setSelectedExportStations(allStationKeys);
                  setExpandedDistricts([]);
                  setExportType('pdf'); // Default to PDF initially
                  setIsExportModalOpen(true);
                }}
                disabled={isExporting}
                className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="hidden sm:inline">กำลัง Export...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span className="hidden sm:inline">Export รายอำเภอ</span>
                    <span className="sm:hidden">Export</span>
                  </>
                )}
              </button>
            )}
            {/* Report Preview button */}
            {!isLoading && data.length > 0 && (
              <button
                onClick={() => router.push("/report")}
                className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                </svg>
                <span className="hidden sm:inline">Report</span>
              </button>
            )}
            {/* Logout Button */}

            <button
              onClick={handleLogout}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Bento Grid Layout */}
      <main className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">

        {/* Stats + Map — full width */}
        <div className="col-span-1 flex flex-col gap-4 sm:gap-6 md:col-span-2 lg:col-span-3">
          {/* Stats Row — 4 cards + overall progress bar */}
          <div className="space-y-4 sm:space-y-5">

            {/* 4 stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Total */}
              <div className="flex flex-col justify-between rounded-2xl bg-white dark:bg-zinc-800 p-4 sm:p-5 shadow-sm">
                <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">ทั้งหมด</p>
                <p className="mt-2 text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
                  {isLoading ? "..." : data.length}
                </p>
                <p className="mt-1 text-xs text-zinc-400">สถานีลูกข่าย</p>
              </div>

              {/* Completed */}
              {(() => {
                const count = data.filter(s => parseFloat(s.foundationProgress as any) === 100 && parseFloat(s.poleInstallationProgress as any) === 100).length;
                return (
                  <div className="flex flex-col justify-between rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400">เสร็จสมบูรณ์</p>
                      <span className="text-lg">✅</span>
                    </div>
                    <p className="mt-2 text-3xl sm:text-4xl font-bold text-emerald-700 dark:text-emerald-300">
                      {isLoading ? "..." : count}
                    </p>
                    <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-500">
                      {isLoading || data.length === 0 ? "" : `${Math.round(count / data.length * 100)}% ของทั้งหมด`}
                    </p>
                  </div>
                );
              })()}

              {/* In Progress */}
              {(() => {
                const count = data.filter(s => {
                  const fp = parseFloat(s.foundationProgress as any) || 0;
                  const pp = parseFloat(s.poleInstallationProgress as any) || 0;
                  return (fp > 0 || pp > 0) && !(fp === 100 && pp === 100);
                }).length;
                return (
                  <div className="flex flex-col justify-between rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400">กำลังดำเนินการ</p>
                      <span className="text-lg">🔄</span>
                    </div>
                    <p className="mt-2 text-3xl sm:text-4xl font-bold text-amber-700 dark:text-amber-300">
                      {isLoading ? "..." : count}
                    </p>
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                      {isLoading || data.length === 0 ? "" : `${Math.round(count / data.length * 100)}% ของทั้งหมด`}
                    </p>
                  </div>
                );
              })()}

              {/* Not Started */}
              {(() => {
                const count = data.filter(s => {
                  const fp = parseFloat(s.foundationProgress as any) || 0;
                  const pp = parseFloat(s.poleInstallationProgress as any) || 0;
                  return fp === 0 && pp === 0;
                }).length;
                return (
                  <div className="flex flex-col justify-between rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-400">ยังไม่เริ่ม</p>
                      <span className="text-lg">⏳</span>
                    </div>
                    <p className="mt-2 text-3xl sm:text-4xl font-bold text-red-700 dark:text-red-300">
                      {isLoading ? "..." : count}
                    </p>
                    <p className="mt-1 text-xs text-red-600 dark:text-red-500">
                      {isLoading || data.length === 0 ? "" : `${Math.round(count / data.length * 100)}% ของทั้งหมด`}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Overall Progress Bar */}
            {!isLoading && data.length > 0 && (() => {
              const avgFoundation = data.reduce((a, c) => a + (parseFloat(c.foundationProgress as any) || 0), 0) / data.length;
              const avgPole = data.reduce((a, c) => a + (parseFloat(c.poleInstallationProgress as any) || 0), 0) / data.length;
              const overall = (avgFoundation + avgPole) / 2;
              return (
                <div className="rounded-2xl bg-white dark:bg-zinc-800 p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">ความคืบหน้าโดยรวม</p>
                    <span className="text-2xl font-bold text-zinc-900 dark:text-white">{Math.round(overall)}%</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-zinc-500 mb-1">
                        <span>ฐานราก (เฉลี่ย)</span>
                        <span className="font-medium text-indigo-600">{Math.round(avgFoundation)}%</span>
                      </div>
                      <div className="h-2.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-700"
                          style={{ width: `${avgFoundation}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-zinc-500 mb-1">
                        <span>ติดตั้งเสา (เฉลี่ย)</span>
                        <span className="font-medium text-cyan-600">{Math.round(avgPole)}%</span>
                      </div>
                      <div className="h-2.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-700"
                          style={{ width: `${avgPole}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Map View */}
          <div className="h-[260px] sm:h-[400px] overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-800 z-0">
            {!isLoading && <MapView data={data} />}
          </div>
        </div>

        {/* Chart Section with Tab Switcher */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 w-full rounded-2xl bg-white dark:bg-zinc-800 p-5 sm:p-6 shadow-sm">
          {/* Tab Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">สรุปความคืบหน้ารายอำเภอ</h2>
            <div className="flex items-center gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-700/50 p-1">
              <button
                onClick={() => setChartTab('average')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${chartTab === 'average'
                  ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
              >
                เฉลี่ยรายอำเภอ
              </button>
              <button
                onClick={() => setChartTab('comparison')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${chartTab === 'comparison'
                  ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
              >
                ฐานราก vs ติดตั้งเสา
              </button>
            </div>
          </div>
          <div className="h-[320px] sm:h-[360px]">
            {!isLoading && chartTab === 'average' && <DistrictProgressChart data={data} />}
            {!isLoading && chartTab === 'comparison' && <ComparisonChart data={data} />}
          </div>
        </div>

        {/* Data Chart (Grouped by District) */}
        {!isLoading && districts.map((district) => {
          const districtData = data.filter(d => d.district === district);
          // Check if district already starts with "อำเภอ" to avoid "อำเภออำเภอ"
          const displayDistrict = district.startsWith('อำเภอ') ? district : `อำเภอ${district}`;

          return (
            <div key={district} className="col-span-1 md:col-span-2 lg:col-span-3 w-full rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-800 h-[550px]">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Progress by Station - {displayDistrict}</h2>
              <ProgressChart data={districtData} />
            </div>
          );
        })}

        {/* Data Table / List */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 rounded-2xl bg-white p-4 sm:p-6 shadow-sm dark:bg-zinc-800">
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">ข้อมูลสถานี</h2>

            {/* Control Panel: Search & Filters */}
            {!isLoading && !error && data.length > 0 && (
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="ค้นหาสถานี หรือ อำเภอ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 min-w-[200px]"
                />
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="All">ทุกอำเภอ</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="All">ทุก Type</option>
                  <option value="A">Type A</option>
                  <option value="B">Type B</option>
                  <option value="C">Type C</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="All">ทุกสถานะ</option>
                  <option value="Completed">เสร็จสมบูรณ์ 100%</option>
                  <option value="In Progress">กำลังดำเนินการ</option>
                  <option value="Not Started">ยังไม่เริ่ม</option>
                </select>
              </div>
            )}
          </div>

          {isLoading && <p className="text-zinc-500">Loading data from Google Sheets...</p>}

          {error && <p className="text-red-500">Error: {error}</p>}

          {!isLoading && !error && data.length === 0 && (
            <p className="text-zinc-500">No data found in the sheet.</p>
          )}

          {!isLoading && !error && data.length > 0 && (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative border border-zinc-100 dark:border-zinc-800 rounded-xl">
              <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                <thead className="sticky top-0 z-10 bg-zinc-50 text-xs uppercase text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300 shadow-sm backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" onClick={() => handleSort('district')}>
                      อำเภอ{getSortIndicator('district')}
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" onClick={() => handleSort('stationName')}>
                      ชื่อสถานี{getSortIndicator('stationName')}
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" onClick={() => handleSort('type')}>
                      Type{getSortIndicator('type')}
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" onClick={() => handleSort('foundationProgress')}>
                      ฐานราก (%){getSortIndicator('foundationProgress')}
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" onClick={() => handleSort('poleInstallationProgress')}>
                      เสา (%){getSortIndicator('poleInstallationProgress')}
                    </th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.length > 0 ? (
                    sortedData.map((station, idx) => (
                      <tr key={idx} className="border-b border-zinc-100 hover:bg-zinc-50/50 dark:border-zinc-800 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3">{station.district}</td>
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{station.stationName}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200">
                            {station.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">{station.foundationProgress}%</td>
                        <td className="px-4 py-3">{station.poleInstallationProgress}%</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(station)}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-2.5 py-1 text-xs font-semibold transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleDeleteClick(station)}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 px-2.5 py-1 text-xs font-semibold transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                        ไม่มีข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Export Selection Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-zinc-100 dark:border-zinc-800">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">เลือกข้อมูลเพื่อ Export {exportType.toUpperCase()}</h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-zinc-50 dark:bg-zinc-900/50">

              {/* Type Details Setup - Only Show for Visual Exports */}
              {exportType !== 'txt' && (
                <div className="mb-6 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-sm">
                  <div className="flex flex-col gap-4">
                    {/* Format Section */}
                    <div>
                      <span className="block font-semibold text-zinc-900 dark:text-zinc-100 mb-2">รูปแบบไฟล์ (Format)</span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="format" className="text-blue-600" checked={exportType === 'pdf'} onChange={() => setExportType('pdf')} />
                          <span className="text-zinc-700 dark:text-zinc-300">PDF (รวมหน้า)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="format" className="text-blue-600" checked={exportType === 'jpeg'} onChange={() => setExportType('jpeg')} />
                          <span className="text-zinc-700 dark:text-zinc-300">JPEG (แยกรูป 600dpi)</span>
                        </label>
                      </div>
                    </div>

                    {/* Color Sequence - Only show for JPEG */}
                    {exportType === 'jpeg' && (
                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-700">
                        <span className="block font-semibold text-zinc-900 dark:text-zinc-100 mb-2">โหมดสี (Color Mode)</span>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="color" className="text-blue-600" checked={colorMode === 'color'} onChange={() => setColorMode('color')} />
                            <span className="text-zinc-700 dark:text-zinc-300">สีปกติ (Color)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="color" className="text-blue-600" checked={colorMode === 'grayscale'} onChange={() => setColorMode('grayscale')} />
                            <span className="text-zinc-700 dark:text-zinc-300">ขาวดำ (Grayscale)</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  เลือก {selectedExportStations.length} จาก {data.length} สถานี
                </span>
                <button
                  onClick={() => {
                    if (selectedExportStations.length === data.length) {
                      setSelectedExportStations([]);
                    } else {
                      setSelectedExportStations(data.map(d => `${d.district}|${d.stationName}`));
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium transition-colors"
                >
                  {selectedExportStations.length === data.length ? "เอาออกทั้งหมด" : "เลือกทั้งหมด"}
                </button>
              </div>
              <div className="space-y-3">
                {districts.map(district => {
                  const districtStations = data.filter(d => d.district === district);
                  const districtStationKeys = districtStations.map(d => `${d.district}|${d.stationName}`);
                  const selectedCount = districtStationKeys.filter(key => selectedExportStations.includes(key)).length;
                  const isAllSelected = selectedCount === districtStationKeys.length;
                  const isPartialSelected = selectedCount > 0 && selectedCount < districtStationKeys.length;
                  const isExpanded = expandedDistricts.includes(district);

                  return (
                    <div key={district} className="flex flex-col gap-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 overflow-hidden shadow-sm transition-all">
                      {/* District Row */}
                      <div className="flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={isAllSelected}
                              onChange={() => {
                                if (isAllSelected) {
                                  // Deselect all in this district
                                  setSelectedExportStations(prev => prev.filter(key => !districtStationKeys.includes(key)));
                                } else {
                                  // Select all in this district
                                  setSelectedExportStations(prev => {
                                    const others = prev.filter(key => !districtStationKeys.includes(key));
                                    return [...others, ...districtStationKeys];
                                  });
                                }
                              }}
                            />
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isAllSelected ? 'bg-blue-600 border-blue-600 text-white' :
                              isPartialSelected ? 'bg-blue-600 border-blue-600 text-white' :
                                'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900'
                              }`}>
                              {isAllSelected && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              )}
                              {isPartialSelected && !isAllSelected && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                              )}
                            </div>
                            <span className="text-zinc-800 dark:text-zinc-200 font-medium select-none">{district}</span>
                          </label>
                          <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 rounded-full">{selectedCount}/{districtStations.length}</span>
                        </div>

                        {/* Expand/Collapse Toggle */}
                        <button
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedDistricts(prev => prev.filter(d => d !== district));
                            } else {
                              setExpandedDistricts(prev => [...prev, district]);
                            }
                          }}
                          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                      </div>

                      {/* Nested Stations List */}
                      {isExpanded && (
                        <div className="flex flex-col border-t border-zinc-100 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-900/30 pl-11 pr-3 py-2 space-y-2">
                          {districtStations.map(station => {
                            const stationKey = `${station.district}|${station.stationName}`;
                            const isStationChecked = selectedExportStations.includes(stationKey);
                            return (
                              <label key={stationKey} className="flex items-center gap-3 py-1 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={isStationChecked}
                                  onChange={() => {
                                    if (isStationChecked) {
                                      setSelectedExportStations(prev => prev.filter(k => k !== stationKey));
                                    } else {
                                      setSelectedExportStations(prev => [...prev, stationKey]);
                                    }
                                  }}
                                />
                                <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${isStationChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 group-hover:border-blue-400'}`}>
                                  {isStationChecked && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                  )}
                                </div>
                                <span className="text-zinc-600 dark:text-zinc-400 text-sm font-medium select-none group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
                                  {station.stationName} <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal ml-1">({station.type})</span>
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

            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-end gap-3">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={exportType === 'txt' ? handleExportTXT : handleExportPDF}
                disabled={selectedExportStations.length === 0 || isExporting}
                className="px-6 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                ยืนยัน Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
