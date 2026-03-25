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

export default React.memo(function ComparisonChart({ data, category = 'station' }: { data: any[], category?: string }) {
    // Group by district
    const districtStats: Record<string, { val1Sum: number; val2Sum: number; val3Sum?: number; count: number }> = {};

    data.forEach((d) => {
        const dist = d.district || "Unknown";
        if (!districtStats[dist]) {
            districtStats[dist] = { val1Sum: 0, val2Sum: 0, val3Sum: 0, count: 0 };
        }
        
        if (category === 'client') {
            districtStats[dist].val1Sum += parseFloat(d.electricProgress as any) || 0;
            districtStats[dist].val2Sum += parseFloat(d.groundProgress as any) || 0;
            districtStats[dist].val3Sum = (districtStats[dist].val3Sum || 0) + (parseFloat(d.feederProgress as any) || 0);
        } else {
            districtStats[dist].val1Sum += parseFloat(d.foundationProgress as any) || 0;
            districtStats[dist].val2Sum += parseFloat(d.poleInstallationProgress as any) || 0;
        }
        districtStats[dist].count += 1;
    });

    const chartData = Object.keys(districtStats)
        .map((district) => {
            const s = districtStats[district];
            const val1 = Math.round(s.val1Sum / s.count);
            const val2 = Math.round(s.val2Sum / s.count);
            
            if (category === 'client') {
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
            const valA = category === 'client' ? a.electric : a.foundation;
            const valB = category === 'client' ? b.electric : b.foundation;
            return valB - valA;
        });

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                ไม่มีข้อมูล
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const row = payload[0].payload;
            return (
                <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-100 dark:border-zinc-700 p-3 text-sm min-w-[190px]">
                    <p className="font-bold text-zinc-800 dark:text-white mb-1">{label}</p>
                    <p className="text-xs text-zinc-400 mb-2">{row.count} สถานี</p>
                    <div className="space-y-1.5">
                        {payload.map((entry: any, i: number) => (
                            <div key={i} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: entry.fill }} />
                                    <span className="text-zinc-600 dark:text-zinc-300 text-xs">{entry.name}</span>
                                </div>
                                <span className="font-semibold text-zinc-800 dark:text-white">{entry.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    // Determine bar size based on number of districts
    const barSize = chartData.length <= 5 ? 24 : chartData.length <= 10 ? 16 : 12;
    const chartHeight = Math.max(300, chartData.length * 70);

    return (
        <div className="w-full overflow-y-auto" style={{ height: "100%" }}>
            <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 24, left: 10, bottom: 10 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.6} />
                    <XAxis
                        dataKey="name"
                        tick={{ fill: "#6B7280", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={chartData.length > 5 ? -35 : 0}
                        textAnchor={chartData.length > 5 ? "end" : "middle"}
                        height={chartData.length > 5 ? 60 : 30}
                    />
                    <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "#6B7280", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                        width={40}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F9FAFB", opacity: 0.6 }} />
                    <Legend
                        iconType="square"
                        iconSize={10}
                        wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                    />
                    <ReferenceLine y={100} stroke="#E5E7EB" strokeDasharray="4 4" strokeWidth={1.5} />
                    {category === 'station' ? (
                        <>
                            <Bar
                                dataKey="foundation"
                                name="ฐานราก"
                                fill="#6366F1"
                                radius={[6, 6, 0, 0]}
                                barSize={barSize}
                            />
                            <Bar
                                dataKey="pole"
                                name="ติดตั้งเสา"
                                fill="#06B6D4"
                                radius={[6, 6, 0, 0]}
                                barSize={barSize}
                            />
                        </>
                    ) : (
                        <>
                            <Bar
                                dataKey="electric"
                                name="ไฟฟ้า"
                                fill="#6366F1"
                                radius={[4, 4, 0, 0]}
                                barSize={barSize}
                            />
                            <Bar
                                dataKey="ground"
                                name="กราวด์"
                                fill="#06B6D4"
                                radius={[4, 4, 0, 0]}
                                barSize={barSize}
                            />
                            <Bar
                                dataKey="feeder"
                                name="Feeder"
                                fill="#10B981"
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
