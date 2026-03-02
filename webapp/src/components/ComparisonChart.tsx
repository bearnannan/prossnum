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

export default function ComparisonChart({ data }: { data: any[] }) {
    // Group by district
    const districtStats: Record<string, { foundationSum: number; poleSum: number; count: number }> = {};

    data.forEach((d) => {
        const dist = d.district || "Unknown";
        if (!districtStats[dist]) {
            districtStats[dist] = { foundationSum: 0, poleSum: 0, count: 0 };
        }
        districtStats[dist].foundationSum += parseFloat(d.foundationProgress) || 0;
        districtStats[dist].poleSum += parseFloat(d.poleInstallationProgress) || 0;
        districtStats[dist].count += 1;
    });

    const chartData = Object.keys(districtStats)
        .map((district) => {
            const s = districtStats[district];
            const foundation = Math.round(s.foundationSum / s.count);
            const pole = Math.round(s.poleSum / s.count);
            return {
                name: district,
                foundation,
                pole,
                count: s.count,
                gap: Math.abs(foundation - pole),
            };
        })
        .sort((a, b) => b.foundation - a.foundation);

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
            const diff = row.foundation - row.pole;
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
                    {diff !== 0 && (
                        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-700 text-xs text-zinc-500">
                            {diff > 0
                                ? `ฐานรากนำอยู่ ${diff}%`
                                : `ติดตั้งเสานำอยู่ ${Math.abs(diff)}%`}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    // Determine bar size based on number of districts
    const barSize = chartData.length <= 5 ? 28 : chartData.length <= 10 ? 20 : 14;
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
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
