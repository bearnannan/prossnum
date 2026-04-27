import React, { Suspense, memo } from 'react';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-zinc-400 text-sm animate-pulse">Loading Map...</div>
});

const DistrictProgressChart = dynamic(() => import('@/components/DistrictProgressChart'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-zinc-400 text-sm animate-pulse">Loading Chart...</div>
});

const ComparisonChart = dynamic(() => import('@/components/ComparisonChart'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-zinc-400 text-sm animate-pulse">Loading Chart...</div>
});

export const DashboardCharts = memo(function DashboardCharts({
  activeCategory,
  filteredData,
  chartTab,
  setChartTab
}: {
  activeCategory: 'station' | 'client';
  filteredData: any[];
  chartTab: 'average' | 'comparison';
  setChartTab: React.Dispatch<React.SetStateAction<'average' | 'comparison'>>;
}) {
  return (
    <Suspense fallback={
      <>
        <div className="col-span-1 md:col-span-2 lg:col-span-7 glass-panel p-6 h-[480px] animate-pulse bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
        <div className="col-span-1 md:col-span-2 lg:col-span-5 glass-panel p-2 h-[480px] animate-pulse bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
      </>
    }>
      <div className="col-span-1 md:col-span-2 lg:col-span-7 h-[480px] glass-panel p-6 flex flex-col z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
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
        <div className="h-[420px] overflow-hidden">
          {chartTab === 'average' ? <DistrictProgressChart data={filteredData} category={activeCategory} /> : <ComparisonChart data={filteredData} category={activeCategory} />}
        </div>
      </div>

      <div className="col-span-1 md:col-span-2 lg:col-span-5 h-[480px] glass-panel p-2 flex flex-col relative animate-fade-in-up z-10" style={{ animationDelay: '0.2s' }}>
        <div className="w-full h-full rounded-2xl overflow-hidden relative z-10">
          <MapView data={filteredData} category={activeCategory} />
        </div>
      </div>
    </Suspense>
  );
});
