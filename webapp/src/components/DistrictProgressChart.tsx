"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

import React from 'react';
import { StationData, ClientSystemData } from '@/app/api/dashboard-data/route';

type ChartDataItem = StationData | ClientSystemData;

// ─── Custom Tooltip moved outside to avoid re-creation during render ────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const rowData = payload[0].payload;
        return (
            <div className="bg-dark-elevated/95 backdrop-blur-md p-3 rounded-xl border border-dark-border text-sm shadow-[0_0_20px_rgba(0,240,255,0.08)] animate-in fade-in zoom-in duration-200">
                <p className="font-bold text-slate-100 mb-1">อำเภอ: {label}</p>
                <p className="text-slate-400 mb-2 text-[10px] uppercase tracking-wider font-semibold">จาก {rowData.count} สถานี</p>
                <div className="space-y-1.5">
                    {payload.map((entry: any, index: number) => (
                        <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_var(--color)]" style={{ backgroundColor: entry.color, '--color': entry.color } as React.CSSProperties} />
                                <span className="text-slate-300 text-xs">{entry.name}</span>
                            </div>
                            <span className="font-bold text-slate-100 text-xs">{entry.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default React.memo(function DistrictProgressChart({ 
    data, 
    category = 'station' 
}: { 
    data: ChartDataItem[], 
    category?: string 
}) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(() => true);
    }, []);

    const isClient = category === 'client';
    
    const districtStats: Record<string, any> = {};

    data.forEach(d => {
        const dist = d.district || 'Unknown';
        if (!districtStats[dist]) {
            if (isClient) {
                districtStats[dist] = { 
                    electricSum: 0, groundSum: 0, feederSum: 0, 
                    towerSum: 0, radioSum: 0,
                    count: 0 
                };
            } else {
                districtStats[dist] = { foundationSum: 0, poleSum: 0, count: 0 };
            }
        }
        
        if (isClient) {
            const s = d as ClientSystemData;
            districtStats[dist].electricSum += (parseFloat(s.electricProgress?.toString() || "0") || 0);
            districtStats[dist].groundSum += (parseFloat(s.groundProgress?.toString() || "0") || 0);
            districtStats[dist].feederSum += (parseFloat(s.feederProgress?.toString() || "0") || 0);
            districtStats[dist].towerSum += (parseFloat(s.towerProgress?.toString() || "0") || 0);
            districtStats[dist].radioSum += (parseFloat(s.radioProgress?.toString() || "0") || 0);
        } else {
            const s = d as StationData;
            districtStats[dist].foundationSum += (parseFloat(s.foundationProgress?.toString() || "0") || 0);
            districtStats[dist].poleSum += (parseFloat(s.poleInstallationProgress?.toString() || "0") || 0);
        }
        districtStats[dist].count += 1;
    });

    // 2. Map to chart data
    const chartData = Object.keys(districtStats).map(district => {
        const stats = districtStats[district];
        if (isClient) {
            return {
                name: district,
                electric: Math.round(stats.electricSum / stats.count),
                ground: Math.round(stats.groundSum / stats.count),
                feeder: Math.round(stats.feederSum / stats.count),
                tower: Math.round(stats.towerSum / stats.count),
                radio: Math.round(stats.radioSum / stats.count),
                count: stats.count
            };
        }
        return {
            name: district,
            foundation: Math.round(stats.foundationSum / stats.count),
            pole: Math.round(stats.poleSum / stats.count),
            count: stats.count
        };
    }).sort((a, b) => {
        if (isClient) return (b.electric || 0) - (a.electric || 0);
        return (b.foundation || 0) - (a.foundation || 0);
    });

    if (!mounted || chartData.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-400/50 text-xs italic">
            {!mounted ? "กำลังเตรียมข้อมูล..." : "ไม่มีข้อมูลสำหรับแสดงแผนภูมิ"}
        </div>;
    }

    return (
        <ResponsiveContainer width="100%" height={380} minWidth={0} minHeight={0}>
            <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value}%`}
                />
                <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#94a3b8' }} />
                {!isClient ? (
                    <>
                        <Bar dataKey="foundation" name="เฉลี่ยฐานราก" fill="#00f0ff" radius={[0, 4, 4, 0]} barSize={16} />
                        <Bar dataKey="pole" name="เฉลี่ยติดตั้งเสา" fill="#00ff88" radius={[0, 4, 4, 0]} barSize={16} />
                    </>
                ) : (
                    <>
                        <Bar dataKey="electric" name="เฉลี่ยระบบไฟฟ้า" fill="#00f0ff" radius={[0, 4, 4, 0]} barSize={10} />
                        <Bar dataKey="ground" name="เฉลี่ยระบบกราวด์" fill="#00ff88" radius={[0, 4, 4, 0]} barSize={10} />
                        <Bar dataKey="feeder" name="เฉลี่ยสาย Feeder" fill="#f0e800" radius={[0, 4, 4, 0]} barSize={10} />
                        <Bar dataKey="tower" name="อุปกรณ์บนเสา" fill="#b829dd" radius={[0, 4, 4, 0]} barSize={10} />
                        <Bar dataKey="radio" name="เครื่องวิทยุ" fill="#ff00a0" radius={[0, 4, 4, 0]} barSize={10} />
                    </>
                )}
            </BarChart>
        </ResponsiveContainer>
    );
});
