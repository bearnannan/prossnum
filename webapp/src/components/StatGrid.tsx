import React from 'react';
import { StatCard } from './StatCard';

export function StatGrid({ activeCategory, overallProgress, filteredData }: {
  activeCategory: 'station' | 'client';
  overallProgress: number;
  filteredData: any[];
}) {
  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon="analytics" iconFill
        label={`ภาพรวม ${activeCategory === 'client' ? 'ลูกข่าย' : 'งานโครงสร้าง'}`}
        value={`${overallProgress}%`}
        color="from-blue-500 to-indigo-600"
        glowClass="glow-blue"
        className="stagger-1"
      />

      {activeCategory === 'client' ? (
        <>
          <StatCard icon="bolt" iconFill label="ระบบไฟฟ้า"
            value={`${filteredData.length > 0 ? Math.round(filteredData.reduce((acc, d) => acc + parseFloat(d.electricProgress || 0), 0) / filteredData.length) : 0}%`}
            color="from-indigo-500 to-violet-600" glowClass="glow-indigo" className="stagger-2"
          />
          <StatCard icon="nest_eco_leaf" iconFill label="ระบบกราวด์"
            value={`${filteredData.length > 0 ? Math.round(filteredData.reduce((acc, d) => acc + parseFloat(d.groundProgress || 0), 0) / filteredData.length) : 0}%`}
            color="from-emerald-500 to-teal-600" glowClass="glow-emerald" className="stagger-3"
          />
          <StatCard icon="settings_input_antenna" iconFill label="สาย FEEDER"
            value={`${filteredData.length > 0 ? Math.round(filteredData.reduce((acc, d) => acc + parseFloat(d.feederProgress || 0), 0) / filteredData.length) : 0}%`}
            color="from-amber-500 to-orange-600" glowClass="glow-amber" className="stagger-4"
          />
        </>
      ) : (
        <>
          <StatCard icon="foundation" iconFill label="เฉลี่ยฐานราก"
            value={`${filteredData.length > 0 ? Math.round(filteredData.reduce((acc, d) => acc + parseFloat(d.foundationProgress || 0), 0) / filteredData.length) : 0}%`}
            color="from-cyan-500 to-blue-600" glowClass="glow-cyan" className="stagger-2"
          />
          <StatCard icon="vertical_align_top" iconFill label="เฉลี่ยติดตั้งเสา"
            value={`${filteredData.length > 0 ? Math.round(filteredData.reduce((acc, d) => acc + parseFloat(d.poleInstallationProgress || 0), 0) / filteredData.length) : 0}%`}
            color="from-orange-500 to-rose-600" glowClass="glow-orange" className="stagger-3"
          />
          <StatCard icon="verified" iconFill label="สำเร็จทั้งโครงการ"
             value={`${filteredData.filter(d => {
               const p = (parseFloat(d.foundationProgress || 0) + parseFloat(d.poleInstallationProgress || 0)) / 2;
               return p >= 100;
             }).length} / ${filteredData.length}`}
            color="from-emerald-500 to-green-600" glowClass="glow-green" className="stagger-4"
          />
        </>
      )}
    </div>
  );
}
