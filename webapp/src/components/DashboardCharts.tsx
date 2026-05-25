import React, { Suspense, memo } from 'react';
import dynamic from 'next/dynamic';
import { GlassCard } from '@/components/ui/GlassCard';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-dark-surface/50 rounded-xl text-slate-400 text-sm animate-pulse border border-dark-border">Loading Map...</div>
});

const DistrictProgressChart = dynamic(() => import('@/components/DistrictProgressChart'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-dark-surface/50 rounded-xl text-slate-400 text-sm animate-pulse border border-dark-border">Loading Chart...</div>
});

const ComparisonChart = dynamic(() => import('@/components/ComparisonChart'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-dark-surface/50 rounded-xl text-slate-400 text-sm animate-pulse border border-dark-border">Loading Chart...</div>
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
        <div className="col-span-1 md:col-span-2 lg:col-span-7 bg-dark-surface/80 border border-dark-border p-6 h-[480px] animate-pulse rounded-2xl" />
        <div className="col-span-1 md:col-span-2 lg:col-span-5 bg-dark-surface/80 border border-dark-border p-2 h-[480px] animate-pulse rounded-2xl" />
      </>
    }>
      <GlassCard 
        glow="cyan" 
        geo={true} 
        padding={true}
        className="col-span-1 md:col-span-2 lg:col-span-7 h-[480px] flex flex-col z-10 animate-fade-in-up" 
        style={{ animationDelay: '0.15s' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-1 p-1 bg-slate-950/85 border border-dark-border rounded-xl">
            <button 
              onClick={() => setChartTab('average')} 
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                chartTab === 'average' 
                  ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/35 shadow-[0_0_8px_rgba(0,240,255,0.25)] font-extrabold' 
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              เฉลี่ยรายอำเภอ
            </button>
            <button 
              onClick={() => setChartTab('comparison')} 
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                chartTab === 'comparison' 
                  ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/35 shadow-[0_0_8px_rgba(0,240,255,0.25)] font-extrabold' 
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              เปรียบเทียบ
            </button>
          </div>
        </div>
        <div className="w-full h-[420px] min-h-[420px] overflow-hidden relative">
          {chartTab === 'average' ? <DistrictProgressChart data={filteredData} category={activeCategory} /> : <ComparisonChart data={filteredData} category={activeCategory} />}
        </div>
      </GlassCard>

      <GlassCard 
        glow="cyan" 
        geo={true} 
        padding={false}
        className="col-span-1 md:col-span-2 lg:col-span-5 h-[480px] p-2 flex flex-col relative animate-fade-in-up z-10" 
        style={{ animationDelay: '0.2s' }}
      >
        <div className="w-full h-full rounded-2xl overflow-hidden relative z-10">
          <MapView data={filteredData} category={activeCategory} tactical={true} />
        </div>
      </GlassCard>
    </Suspense>
  );
});
