"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createRoot } from "react-dom/client";
import dynamic from "next/dynamic";
import { StationData } from "./api/sheet-data/route";
import ExportBentoReportRaw from '@/components/ExportBentoReport';

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

export default function Home() {
  const [data, setData] = useState<StationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedExportStations, setSelectedExportStations] = useState<string[]>([]);
  const [expandedDistricts, setExpandedDistricts] = useState<string[]>([]);
  const router = useRouter();

  // Search, Filter, Sort States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortConfig, setSortConfig] = useState<{ key: keyof StationData; direction: "asc" | "desc" } | null>(null);

  // Refs map: district name -> div element for html2canvas capture
  const exportRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // New states for the form
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    district: "",
    stationName: "",
    type: "C",
    foundationProgress: 0,
    poleInstallationProgress: 0,
    lat: 14.0,
    lon: 99.0
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isEditing = editingRowIndex !== null;
      const method = isEditing ? "PUT" : "POST";
      const payload = isEditing ? { ...formData, rowIndex: editingRowIndex } : formData;

      const res = await fetch("/api/sheet-data", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? "update" : "submit"} data`);
      }

      // Re-fetch data to show the new/updated row
      await fetchSheetData();

      // Reset form
      setFormData(prev => ({
        ...prev,
        stationName: "",
        foundationProgress: 0,
        poleInstallationProgress: 0,
      }));
      setEditingRowIndex(null);
      alert(`Data ${isEditing ? "updated" : "submitted"} successfully!`);
    } catch (err: any) {
      alert(`Error ${editingRowIndex !== null ? "updating" : "submitting"} data: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (station: StationData) => {
    if (!station.rowIndex) return;
    setEditingRowIndex(station.rowIndex);
    setFormData({
      district: station.district,
      stationName: station.stationName,
      type: station.type || "C",
      foundationProgress: station.foundationProgress,
      poleInstallationProgress: station.poleInstallationProgress,
      lat: station.lat || 14.0,
      lon: station.lon || 99.0
    });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingRowIndex(null);
    setFormData({
      district: "",
      stationName: "",
      type: "C",
      foundationProgress: 0,
      poleInstallationProgress: 0,
      lat: 14.0,
      lon: 99.0
    });
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

        // Warm up pass for remote images/svgs
        await toJpeg(el, { width: 1122, height: 794 }).catch(() => { });

        // Actual capture
        const imgData = await toJpeg(el, {
          quality: 0.95,
          backgroundColor: '#F3F4F6',
          width: 1122,
          height: 794,
          pixelRatio: 2, // 2x for high quality print
        });

        // Clean up immediately
        root.unmount();
        document.body.removeChild(container);

        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();

        if (!isFirstPage) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
        isFirstPage = false;
      }

      pdf.save('district-report.pdf');
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
    <div className="flex min-h-screen flex-col bg-[#F3F4F6] p-8 font-sans dark:bg-zinc-900">
      {/* Removed the permanent hidden export containers */}

      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Progress Dashboard
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Real-time tracking for station installation progress
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Export PDF button */}
          {!isLoading && data.length > 0 && (
            <button
              onClick={() => {
                const allStationKeys = data.map(d => `${d.district}|${d.stationName}`);
                setSelectedExportStations(allStationKeys);
                setExpandedDistricts([]); // Optional: start with everything collapsed
                setIsExportModalOpen(true);
              }}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  กำลัง Export...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export PDF รายอำเภอ
                </>
              )}
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
      </header>

      {/* Main Bento Grid Layout */}
      <main className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

        {/* Left Column: Stats and Map */}
        <div className={`col-span-1 flex flex-col gap-6 md:col-span-2 ${editingRowIndex !== null ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col justify-center rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-800">
              <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Stations</h2>
              <p className="mt-2 text-4xl font-semibold text-zinc-900 dark:text-white">
                {isLoading ? "..." : data.length}
              </p>
            </div>
            <div className="flex flex-col justify-center rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-800">
              <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Average Foundation Progress</h2>
              <p className="mt-2 text-4xl font-semibold text-zinc-900 dark:text-white">
                {isLoading
                  ? "..."
                  : data.length > 0
                    ? `${Math.round(data.reduce((acc, curr) => acc + (parseFloat(curr.foundationProgress as any) || 0), 0) / data.length)}%`
                    : "0%"}
              </p>
            </div>
          </div>

          {/* Map View */}
          <div className="h-[400px] overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-800 z-0">
            {!isLoading && <MapView data={data} />}
          </div>
        </div>

        {/* Summary Card 3 (Form Entry) */}
        {editingRowIndex !== null && (
          <div className="col-span-1 flex flex-col justify-center rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-800 md:col-span-2 lg:col-span-1 border border-transparent transition-all" style={{ borderColor: '#3B82F6', boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Edit Data
              </h2>
              <button
                type="button"
                onClick={cancelEdit}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Cancel Edit
              </button>
            </div>
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <input
                name="district"
                placeholder="อำเภอ..."
                value={formData.district}
                onChange={handleInputChange}
                className="w-full rounded-md border border-zinc-200 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                required
              />
              <input
                name="stationName"
                placeholder="ชื่อสถานี..."
                value={formData.stationName}
                onChange={handleInputChange}
                className="w-full rounded-md border border-zinc-200 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                required
              />
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full rounded-md border border-zinc-200 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="A">Type A</option>
                <option value="B">Type B</option>
                <option value="C">Type C</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-500">ฐานราก (%)</label>
                  <input
                    name="foundationProgress"
                    type="number"
                    min="0" max="100"
                    value={formData.foundationProgress}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-zinc-200 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">ติดตั้งเสา (%)</label>
                  <input
                    name="poleInstallationProgress"
                    type="number"
                    min="0" max="100"
                    value={formData.poleInstallationProgress}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-zinc-200 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full rounded-md py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? "Updating..." : "Update Sheets"}
              </button>
            </form>
          </div>
        )}

        {/* District Average Chart */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 w-full rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-800 h-[350px]">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Average Progress by District (อำเภอ)</h2>
          {!isLoading && <DistrictProgressChart data={data} />}
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
        <div className="col-span-1 md:col-span-2 lg:col-span-3 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-800">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Recent Data</h2>

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
                        <td className="px-4 py-3 text-right space-x-3">
                          <button
                            onClick={() => handleEditClick(station)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-semibold transition-colors dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(station)}
                            className="text-red-600 hover:text-red-800 text-xs font-semibold transition-colors dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
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
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">เลือกข้อมูลเพื่อ Export PDF</h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-zinc-50 dark:bg-zinc-900/50">
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
                onClick={handleExportPDF}
                disabled={selectedExportStations.length === 0}
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
