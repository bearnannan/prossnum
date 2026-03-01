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

export default function DistrictProgressChart({ data }: { data: any[] }) {
    // 1. Group by district and calculate averages
    const districtStats: Record<string, { foundationSum: number, poleSum: number, count: number }> = {};

    data.forEach(d => {
        const dist = d.district || 'Unknown';
        if (!districtStats[dist]) {
            districtStats[dist] = { foundationSum: 0, poleSum: 0, count: 0 };
        }
        districtStats[dist].foundationSum += (parseFloat(d.foundationProgress) || 0);
        districtStats[dist].poleSum += (parseFloat(d.poleInstallationProgress) || 0);
        districtStats[dist].count += 1;
    });

    // 2. Map to chart data
    const chartData = Object.keys(districtStats).map(district => {
        const stats = districtStats[district];
        return {
            name: district,
            foundation: Math.round(stats.foundationSum / stats.count),
            pole: Math.round(stats.poleSum / stats.count),
            count: stats.count
        };
    }).sort((a, b) => b.foundation - a.foundation); // Sort by highest foundation progress

    if (chartData.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No data available for chart</div>;
    }

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const rowData = payload[0].payload;
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-zinc-100 text-sm">
                    <p className="font-semibold text-zinc-800 mb-1">อำเภอ: {label}</p>
                    <p className="text-zinc-500 mb-2 text-xs">จาก {rowData.count} สถานี</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={`item-${index}`} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-zinc-700">{entry.name}: <span className="font-semibold">{entry.value}%</span></span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value}%`}
                />
                <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="foundation" name="เฉลี่ยฐานราก" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={16} />
                <Bar dataKey="pole" name="เฉลี่ยติดตั้งเสา" fill="#10B981" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
        </ResponsiveContainer>
    );
}
