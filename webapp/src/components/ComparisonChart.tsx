"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";

import React from 'react';
import { StationData, ClientSystemData } from '@/app/api/dashboard-data/route';

type ChartDataItem = StationData | ClientSystemData;

// ─── Custom Tooltip moved outside to avoid re-creation during render ────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const row = payload[0].payload;
        return (
            <div className="bg-dark-elevated/95 backdrop-blur-md rounded-xl border border-dark-border p-3 text-sm min-w-[190px] shadow-[0_0_20px_rgba(0,240,255,0.08)]">
                <p className="font-bold text-slate-100 mb-1">{label}</p>
                <p className="text-xs text-slate-400 mb-2">{row.count} สถานี</p>
                <div className="space-y-1.5">
                    {payload.map((entry: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-300 text-xs">{entry.name}</span>
                            </div>
                            <span className="font-semibold text-slate-100">{entry.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default React.memo(function ComparisonChart({ 
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

    // Group by district
    const districtStats: Record<string, { val1Sum: number; val2Sum: number; val3Sum?: number; count: number }> = {};

    data.forEach((d) => {
        const dist = d.district || "Unknown";
        if (!districtStats[dist]) {
            districtStats[dist] = { val1Sum: 0, val2Sum: 0, val3Sum: 0, count: 0 };
        }
        
        if (isClient) {
            const s = d as ClientSystemData;
            districtStats[dist].val1Sum += parseFloat(s.electricProgress?.toString() || "0") || 0;
            districtStats[dist].val2Sum += parseFloat(s.groundProgress?.toString() || "0") || 0;
            districtStats[dist].val3Sum = (districtStats[dist].val3Sum || 0) + (parseFloat(s.feederProgress?.toString() || "0") || 0);
        } else {
            const s = d as StationData;
            districtStats[dist].val1Sum += parseFloat(s.foundationProgress?.toString() || "0") || 0;
            districtStats[dist].val2Sum += parseFloat(s.poleInstallationProgress?.toString() || "0") || 0;
        }
        districtStats[dist].count += 1;
    });

    const chartData = Object.keys(districtStats)
        .map((district) => {
            const s = districtStats[district];
            const val1 = Math.round(s.val1Sum / s.count);
            const val2 = Math.round(s.val2Sum / s.count);
            
            if (isClient) {
                const val3 = Math.round((s.val3Sum || 0) / s.count);
                return {
                    name: district,
                    electric: val1,
                    ground: val2,
                    feeder: val3,
                    count: s.count,
                };
            }

            return {
                name: district,
                foundation: val1,
                pole: val2,
                count: s.count,
                gap: Math.abs(val1 - val2),
            };
        })
        .sort((a: any, b: any) => {
            const valA = isClient ? a.electric : a.foundation;
            const valB = isClient ? b.electric : b.foundation;
            return valB - valA;
        });

    if (!mounted || chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-400/50 text-xs italic">
                {!mounted ? "กำลังเตรียมข้อมูล..." : "ไม่มีข้อมูลสำหรับแสดงแผนภูมิ"}
            </div>
        );
    }

    // Determine bar size based on number of districts
    const barSize = chartData.length <= 5 ? 24 : chartData.length <= 10 ? 16 : 12;

    return (
        <div className="w-full h-full relative">
            <ResponsiveContainer width="100%" height={380} minWidth={0} minHeight={0}>
                <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 24, left: 10, bottom: 10 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                    <XAxis
                        dataKey="name"
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={chartData.length > 5 ? -35 : 0}
                        textAnchor={chartData.length > 5 ? "end" : "middle"}
                        height={chartData.length > 5 ? 60 : 30}
                    />
                    <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                        width={40}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255, 255, 255, 0.03)", opacity: 0.6 }} />
                    <Legend
                        iconType="square"
                        iconSize={10}
                        wrapperStyle={{ fontSize: "12px", paddingTop: "12px", color: "#94a3b8" }}
                    />
                    <ReferenceLine y={100} stroke="rgba(255, 255, 255, 0.15)" strokeDasharray="4 4" strokeWidth={1.5} />
                    {!isClient ? (
                        <>
                            <Bar
                                dataKey="foundation"
                                name="ฐานราก"
                                fill="#00f0ff"
                                radius={[6, 6, 0, 0]}
                                barSize={barSize}
                            />
                            <Bar
                                dataKey="pole"
                                name="ติดตั้งเสา"
                                fill="#00ff88"
                                radius={[6, 6, 0, 0]}
                                barSize={barSize}
                            />
                        </>
                    ) : (
                        <>
                            <Bar
                                dataKey="electric"
                                name="ไฟฟ้า"
                                fill="#00f0ff"
                                radius={[4, 4, 0, 0]}
                                barSize={barSize}
                            />
                            <Bar
                                dataKey="ground"
                                name="กราวด์"
                                fill="#00ff88"
                                radius={[4, 4, 0, 0]}
                                barSize={barSize}
                            />
                            <Bar
                                dataKey="feeder"
                                name="Feeder"
                                fill="#f0e800"
                                radius={[4, 4, 0, 0]}
                                barSize={barSize}
                            />
                        </>
                    )}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
});
