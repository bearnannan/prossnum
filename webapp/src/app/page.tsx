"use client";

import { useRef, useState, useMemo, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { StationData, ClientSystemData } from "./api/sheet-data/route";
import { supabase } from "@/lib/supabase";
import { addMutation, getQueueForSheet, OfflineMutation } from "@/lib/offline-sync";
import { useToast } from "@/components/Toast";
import { get, set, del } from "idb-keyval";
import { SWRConfig } from "swr";
import { Skeleton, SkeletonLayout } from "@/components/Skeleton";
import TopNavBar from '@/components/TopNavBar';
import SideNavBar from '@/components/SideNavBar';
import { useExport, formatDateDisplay } from '@/hooks/useExport';
import { useDashboard } from '@/hooks/useDashboard';
import { StatGrid } from '@/components/StatGrid';
import { DashboardCharts } from '@/components/DashboardCharts';
import { DashboardTable } from '@/components/DashboardTable';
import { ExportModal } from '@/components/ExportModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ActivityFeed } from '@/components/ActivityFeed';
import { signOut } from "next-auth/react";

// ─── Lazy-loaded modals (deferred ~63KB until user clicks "เพิ่มสถานี") ───
const StationModal = dynamic(() => import('@/components/StationModal'), { ssr: false });
const ClientSystemModal = dynamic(() => import('@/components/ClientSystemModal'), { ssr: false });

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(res => {
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json();
});

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



function DashboardContent() {
  const [activeCategory, setActiveCategory] = useState<'station' | 'client'>('station');
  const { data: responseData, error: swrError, isLoading: swrIsLoading, mutate } = useSWR(`/api/sheet-data?sheet=${activeCategory}`, fetcher, {
    dedupingInterval: 60000,
    keepPreviousData: true,
  });

  const [pendingMutations, setPendingMutations] = useState<OfflineMutation[]>([]);

  // Fetch pending mutations to merge them into the UI
  useEffect(() => {
    const fetchQueue = async () => {
      const queue = await getQueueForSheet(activeCategory);
      setPendingMutations(queue);
    };
    fetchQueue();
    // Refresh queue status periodically
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, [activeCategory]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Merge SWR data with pending mutations for Optimistic UI
  const data = useMemo(() => {
    let baseData = [...(responseData?.data || [])];
    
    // Apply sync status to base data
    baseData = baseData.map(item => ({ ...item, _syncStatus: 'synced' }));

    // Apply pending mutations
    pendingMutations.forEach(mut => {
      if (mut.method === 'DELETE') {
        baseData = baseData.filter(item => item.id !== mut.payload.id);
        // Note: For deletions, we might want to keep the item but mark it as 'deleting'
        // For now, let's just mark existing items that are being deleted
        const index = (responseData?.data || []).findIndex((item: any) => item.id === mut.payload.id);
        if (index !== -1) {
            // Re-insert with deleting status if we want to show it in the table
            // But usually filtering out is cleaner. Let's keep it filtered.
        }
      } else if (mut.method === 'PUT') {
        const index = baseData.findIndex(item => item.id === mut.payload.id);
        if (index !== -1) {
          baseData[index] = { ...mut.payload, _syncStatus: 'pending' };
        }
      } else if (mut.method === 'POST') {
        baseData.unshift({ ...mut.payload, id: `temp-${mut.id}`, _syncStatus: 'pending' });
      }
    });

    return baseData;
  }, [responseData, pendingMutations]);

  const isLoading = swrIsLoading && !responseData;
  const error = swrError?.message || null;
  const {
    isExporting, setIsExporting,
    isExportModalOpen, setIsExportModalOpen,
    exportType, setExportType,
    selectedExportStations, setSelectedExportStations,
    expandedDistricts, setExpandedDistricts,
    handleExportTXT,
    handleExportPDF,
    handleExportJPEG
  } = useExport();
  const [colorMode, setColorMode] = useState<'color' | 'grayscale'>('color');
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<any | null>(null);
  const [chartTab, setChartTab] = useState<'average' | 'comparison'>('average');
  const { showToast } = useToast();
  const router = useRouter();

  const {
    searchTerm, setSearchTerm,
    filterDistrict, setFilterDistrict,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    sortConfig, setSortConfig,
    selectedProvince, setSelectedProvince,
    provinces, districts,
    filteredData, sortedData,
    handleSort,
    overallProgress
  } = useDashboard(data, activeCategory);

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
    await signOut({ callbackUrl: "/login" });
  };

  const handleEditClick = (item: any) => {
    setEditingStation(item);
    if (activeCategory === 'client') setIsClientModalOpen(true);
    else setIsStationModalOpen(true);
  };

  const handleDeleteClick = async (item: any) => {
    if (!item.id || !window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ ${item.stationName}?`)) return;
    try {
      if (!navigator.onLine) {
        await addMutation({
          method: "DELETE",
          payload: { id: item.id },
          sheet: activeCategory as "station" | "client"
        });
        showToast("ลบข้อมูลแบบออฟไลน์สำเร็จ จะซิงค์เมื่อออนไลน์", "info");
        await mutate(); // Refresh UI to remove the item optimistically
        return;
      }

      const res = await fetch(`/api/sheet-data?sheet=${activeCategory}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (!res.ok) throw new Error("ล้มเหลวในการลบข้อมูล");
      await fetchSheetData("ลบข้อมูลสำเร็จ");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

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

        <StatGrid activeCategory={activeCategory} overallProgress={overallProgress} filteredData={filteredData} />

        {/* ════════════ ACTIVITY FEED ════════════ */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 h-full">
          <ActivityFeed />
        </div>

        {/* ════════════ CHART + MAP ROW ════════════ */}
        <div className="col-span-1 md:col-span-2 lg:col-span-8">
           <DashboardCharts activeCategory={activeCategory} filteredData={filteredData} chartTab={chartTab} setChartTab={setChartTab} />
        </div>

        {/* ════════════ DATA TABLE ════════════ */}
        <DashboardTable
          activeCategory={activeCategory}
          filteredData={filteredData}
          sortedData={sortedData}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setExportType={setExportType}
          setIsExportModalOpen={setIsExportModalOpen}
          handleSort={handleSort}
          sortConfig={sortConfig}
          handleEditClick={handleEditClick}
          handleDeleteClick={handleDeleteClick}
        />

      </main>

      {/* ════════════ EXPORT MODAL ════════════ */}
      <ExportModal
        isExportModalOpen={isExportModalOpen}
        setIsExportModalOpen={setIsExportModalOpen}
        exportType={exportType}
        setExportType={setExportType}
        selectedExportStations={selectedExportStations}
        setSelectedExportStations={setSelectedExportStations}
        expandedDistricts={expandedDistricts}
        setExpandedDistricts={setExpandedDistricts}
        districts={districts}
        data={data}
        activeCategory={activeCategory}
        handleExportTXT={handleExportTXT}
        handleExportJPEG={handleExportJPEG}
        handleExportPDF={handleExportPDF}
      />
    </div>
  );
}

// Simplified persistent cache provider for SWR using idb-keyval
const idbCacheProvider = () => {
    // We only use this on the client
    if (typeof window === "undefined") return new Map();

    const cache = new Map();
    
    // Attempt to load entire cache from IDB on startup
    get("swr-cache").then((stored: any) => {
        if (stored) {
            for (const [key, value] of Object.entries(stored)) {
                cache.set(key, value);
            }
        }
    });

    return {
        get: (key: string) => cache.get(key),
        set: (key: string, value: any) => {
            cache.set(key, value);
            // Persist the entire cache to IDB
            const obj = Object.fromEntries(cache.entries());
            set("swr-cache", obj);
        },
        delete: (key: string) => {
            cache.delete(key);
            const obj = Object.fromEntries(cache.entries());
            set("swr-cache", obj);
        },
        keys: () => cache.keys()
    };
};

export default function Home() {
  return (
    <SWRConfig value={{ provider: idbCacheProvider }}>
      <ErrorBoundary>
        <DashboardContent />
      </ErrorBoundary>
    </SWRConfig>
  );
}
