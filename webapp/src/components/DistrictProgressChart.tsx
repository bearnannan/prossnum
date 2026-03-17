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

export default function DistrictProgressChart({ data, category = 'station' }: { data: any[], category?: string }) {
    // 1. Group by district and calculate averages
    const isClient = category === 'client';
    
    const districtStats: Record<string, any> = {};

    data.forEach(d => {
        const dist = d.district || 'Unknown';
        if (!districtStats[dist]) {
            if (isClient) {
                districtStats[dist] = { 
                    electricSum: 0, groundSum: 0, feederSum: 0, 
                    towerSum: 0, radioSum: 0, linkSum: 0,
                    count: 0 
                };
            } else {
                districtStats[dist] = { foundationSum: 0, poleSum: 0, count: 0 };
            }
        }
        
        if (isClient) {
            districtStats[dist].electricSum += (parseFloat(d.electricProgress) || 0);
            districtStats[dist].groundSum += (parseFloat(d.groundProgress) || 0);
            districtStats[dist].feederSum += (parseFloat(d.feederProgress) || 0);
            districtStats[dist].towerSum += (parseFloat(d.towerProgress) || 0);
            districtStats[dist].radioSum += (parseFloat(d.radioProgress) || 0);
            districtStats[dist].linkSum += (parseFloat(d.linkProgress) || 0);
        } else {
            districtStats[dist].foundationSum += (parseFloat(d.foundationProgress) || 0);
            districtStats[dist].poleSum += (parseFloat(d.poleInstallationProgress) || 0);
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
                link: Math.round(stats.linkSum / stats.count),
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
                {!isClient ? (
                    <>
                        <Bar dataKey="foundation" name="เฉลี่ยฐานราก" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={16} />
                        <Bar dataKey="pole" name="เฉลี่ยติดตั้งเสา" fill="#10B981" radius={[0, 4, 4, 0]} barSize={16} />
                    </>
                ) : (
                    <>
                        <Bar dataKey="electric" name="เฉลี่ยระบบไฟฟ้า" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={10} />
                        <Bar dataKey="ground" name="เฉลี่ยระบบกราวด์" fill="#10B981" radius={[0, 4, 4, 0]} barSize={10} />
                        <Bar dataKey="feeder" name="เฉลี่ยสาย Feeder" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={10} />
                        <Bar dataKey="tower" name="อุปกรณ์บนเสา" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={10} />
                        <Bar dataKey="radio" name="เครื่องวิทยุ" fill="#EC4899" radius={[0, 4, 4, 0]} barSize={10} />
                        <Bar dataKey="link" name="ทดสอบสัญญาณ" fill="#06B6D4" radius={[0, 4, 4, 0]} barSize={10} />
                    </>
                )}
            </BarChart>
        </ResponsiveContainer>
    );
}
