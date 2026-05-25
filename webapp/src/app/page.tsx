"use client";

import { useRef, useState, useMemo, useEffect, Suspense, useTransition, useDeferredValue } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { addMutation, getQueueForDataset, OfflineMutation } from "@/lib/offline-sync";
import { useToast } from "@/components/Toast";
import { useRealtime } from "@/hooks/useRealtime";
import { get, set } from "idb-keyval";
import { SWRConfig } from "swr";
import { PremiumDashboardSkeleton } from "@/components/Skeleton";
import { TextShimmer } from "@/components/loading-ui/TextShimmer";
import TopNavBar from '@/components/TopNavBar';
import SideNavBar from '@/components/SideNavBar';
import { useExport } from '@/hooks/useExport';
import { useDashboard } from '@/hooks/useDashboard';
import { StatGrid } from '@/components/StatGrid';
import { DashboardCharts } from '@/components/DashboardCharts';
import { DashboardTable } from '@/components/DashboardTable';
import { ExportModal } from '@/components/ExportModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CursorGlow } from "@/components/motion/CursorGlow";
import { Magnetic } from "@/components/motion/Magnetic";
import { motion, AnimatePresence } from "framer-motion";

// ─── Lazy-loaded modals (deferred ~63KB until user clicks "เพิ่มสถานี") ───
const StationModal = dynamic(() => import('@/components/StationModal'), { ssr: false });
const ClientSystemModal = dynamic(() => import('@/components/ClientSystemModal'), { ssr: false });

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(res => {
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json();
});

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Faster stagger for snappier feel
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as const, // Consistent premium ease
    },
  },
};


function DashboardContent() {
  const [activeCategory, setActiveCategory] = useState<'station' | 'client'>('station');
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [chartTab, setChartTab] = useState<'average' | 'comparison'>('average');
  const { data: responseData, error: swrError, isLoading: swrIsLoading, mutate } = useSWR(`/api/dashboard-data?dataset=${activeCategory}`, fetcher, {
    dedupingInterval: 60000,
    keepPreviousData: true,
  });

  const [pendingMutations, setPendingMutations] = useState<OfflineMutation[]>([]);

  // Fetch pending mutations to merge them into the UI
  useEffect(() => {
    const fetchQueue = async () => {
      const queue = await getQueueForDataset(activeCategory);
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
    handleExportJPEG,
    handleExportCSV
  } = useExport();
  const [colorMode, setColorMode] = useState<'color' | 'grayscale'>('color');
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCategoryChange = (category: 'station' | 'client') => {
    startTransition(() => {
      setActiveCategory(category);
    });
  };

  const { showToast } = useToast();

  const {
    filterDistrict, setFilterDistrict,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    sortConfig, setSortConfig,
    selectedProvince, setSelectedProvince,
    provinces, districts,
    filteredData, sortedData,
    handleSort: _handleSort,
    overallProgress
  } = useDashboard(data, activeCategory, searchTerm, setSearchTerm, deferredSearchTerm);

  const handleSort = (key: string) => {
    startTransition(() => {
      _handleSort(key);
    });
  };

  const handleProvinceChange = (province: string) => {
    startTransition(() => {
      setSelectedProvince(province);
    });
  };

  const exportRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const fetchSheetData = async (msg = "บันทึกข้อมูลเรียบร้อยแล้ว") => {
    await mutate();
    showToast(msg, 'success');
  };

  // ─── Real-time Updates ───
  useRealtime({ table: 'stations', dataset: 'station', enableToast: activeCategory === 'station' });
  useRealtime({ table: 'client_systems', dataset: 'client', enableToast: activeCategory === 'client' });

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
          dataset: activeCategory as "station" | "client"
        });
        showToast("ลบข้อมูลแบบออฟไลน์สำเร็จ จะซิงค์เมื่อออนไลน์", "info");
        await mutate(); // Refresh UI to remove the item optimistically
        return;
      }

      const res = await fetch(`/api/dashboard-data?dataset=${activeCategory}`, {
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

  const [thaiDate, setThaiDate] = useState("");

  useEffect(() => {
    const today = new Date();
    setThaiDate(today.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);


  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="bg-dark-base bg-grid text-slate-100 min-h-screen font-sans"
    >
      <CursorGlow />
      <TopNavBar onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      
      {/* ─── Global Transition Progress Bar ─── */}
      <div className={`fixed top-0 left-0 right-0 h-1 z-[60] bg-blue-500/20 overflow-hidden transition-opacity duration-300 ${isPending ? 'opacity-100' : 'opacity-0'}`}>
        <div className="h-full bg-blue-500 animate-indeterminate-shimmer w-[40%]" />
      </div>

      <SideNavBar 
        activeCategory={activeCategory} 
        onCategoryChange={handleCategoryChange} 
        provinces={provinces}
        selectedProvince={selectedProvince}
        onProvinceChange={handleProvinceChange}
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      
      <AnimatePresence>
        <motion.main 
          key={activeCategory}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -20, filter: "blur(10px)", transition: { duration: 0.3 } }}
          variants={containerVariants}
          className="lg:ml-[280px] pt-16 lg:pt-20 p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 auto-rows-min max-w-[1600px] mx-auto"
        >

          <StationModal isOpen={isStationModalOpen} onClose={() => setIsStationModalOpen(false)} onSave={fetchSheetData} editingStation={editingStation} districts={districts} />
          <ClientSystemModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} onSave={fetchSheetData} editingStation={editingStation} districts={districts} />

          {/* ════════════ HEADER ════════════ */}
          <motion.header variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-12 bg-dark-elevated border border-dark-border rounded-2xl shadow-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
              <div>
                <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-1.5 tracking-wide">
                  {thaiDate || <TextShimmer className="text-zinc-400">กำลังโหลด...</TextShimmer>}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>
                  {activeCategory === 'client' ? "ระบบลูกข่าย" : "ข้อมูลสถานี"}
                </h1>
                <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1 font-medium">
                  {activeCategory === 'client' ? "ติดตามความคืบหน้าการติดตั้งระบบ" : "ติดตามงานโครงสร้างพื้นฐานและฐานราก"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Live Status Indicator */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/5 border border-neon-green/20">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_10px_rgba(0,255,136,0.6)]"
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-neon-green uppercase tracking-widest leading-none" style={{ textShadow: "0 0 6px rgba(0,255,136,0.4)" }}>Live Connect</span>
                    <span className="text-[8px] text-neon-green/60 font-bold leading-none mt-0.5 uppercase tracking-tighter">เชื่อมต่อเรียลไทม์แล้ว</span>
                  </div>
                </div>
                <Magnetic distance={0.2}>
                  <motion.button 
                    onClick={() => { setEditingStation(null); activeCategory === 'client' ? setIsClientModalOpen(true) : setIsStationModalOpen(true); }} 
                    animate={{ 
                      boxShadow: [
                        "0 0 12px rgba(184,41,221,0.35)", 
                        "0 0 22px rgba(184,41,221,0.65)", 
                        "0 0 12px rgba(184,41,221,0.35)"
                      ] 
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="group px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider border border-neon-purple/30 hover:border-neon-purple/60 transition-all duration-300 flex items-center gap-2 text-white bg-neon-purple/90 hover:scale-[1.05] active:scale-[0.95] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm font-black group-hover:rotate-90 transition-transform duration-300">add</span>
                    เพิ่ม{activeCategory === 'client' ? 'งาน' : 'สถานี'}
                  </motion.button>
                </Magnetic>
              </div>
            </div>
          </motion.header>

          <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-12">
            <StatGrid activeCategory={activeCategory} overallProgress={overallProgress} filteredData={filteredData} />
          </motion.div>

          {/* ════════════ CHART + MAP ROW ════════════ */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
             <DashboardCharts activeCategory={activeCategory} filteredData={filteredData} chartTab={chartTab} setChartTab={setChartTab} />
          </motion.div>

          {/* ════════════ DATA TABLE ════════════ */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-12">
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
          </motion.div>

        </motion.main>
      </AnimatePresence>

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
        handleExportCSV={handleExportCSV}
      />
    </motion.div>
  );
}

// Simplified persistent cache provider for SWR using idb-keyval
const idbCacheProvider = () => {
    if (typeof window === "undefined") return new Map();
    const cache = new Map();
    
    // Load cache from IDB
    get("swr-cache").then((stored: any) => {
        if (stored && typeof stored === 'object') {
            Object.entries(stored).forEach(([key, value]) => cache.set(key, value));
        }
    }).catch(console.error);

    return {
        get: (key: string) => cache.get(key),
        set: (key: string, value: any) => {
            cache.set(key, value);
            const obj = Object.fromEntries(cache.entries());
            set("swr-cache", obj).catch(console.error);
        },
        delete: (key: string) => {
            cache.delete(key);
            const obj = Object.fromEntries(cache.entries());
            set("swr-cache", obj).catch(console.error);
        },
        keys: () => cache.keys()
    };
};

export default function Home() {
  return (
    <SWRConfig value={{ provider: idbCacheProvider }}>
      <ErrorBoundary>
        <Suspense fallback={<PremiumDashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </ErrorBoundary>
    </SWRConfig>
  );
}
