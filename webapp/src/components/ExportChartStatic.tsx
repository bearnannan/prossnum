"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
} from 'recharts';

interface ExportChartStaticProps {
    data: any[];
    category?: 'station' | 'client';
    width?: number;
    height?: number;
}

export default function ExportChartStatic({ data, category = 'station', width = 580, height = 380 }: ExportChartStaticProps) {
    const isClient = category === 'client';
    
    const chartData = data.map((d) => {
        const base = {
            name: d.stationName || d.district,
        };
        
        if (isClient) {
            return {
                ...base,
                electric: parseFloat(d.electricProgress) || 0,
                ground: parseFloat(d.groundProgress) || 0,
                feeder: parseFloat(d.feederProgress) || 0,
                tower: parseFloat(d.towerProgress) || 0,
                radio: parseFloat(d.radioProgress) || 0,
            };
        }
        
        return {
            ...base,
            foundation: parseFloat(d.foundationProgress) || 0,
            pole: parseFloat(d.poleInstallationProgress) || 0,
        };
    });

    if (chartData.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width, height, color: '#9CA3AF' }}>
                ไม่มีข้อมูล
            </div>
        );
    }

    // Compute dynamic bar size: shrink bars when many stations
    const barSize = isClient 
        ? Math.max(2, Math.min(10, Math.floor(width / chartData.length / 6)))
        : Math.max(6, Math.min(20, Math.floor(width / chartData.length / 2.5)));

    return (
        // Fixed-dimension wrapper — NO ResponsiveContainer (doesn't work off-screen)
        <div style={{ width, height, overflow: 'hidden' }}>
            <BarChart
                width={width}
                height={height}
                data={chartData}
                margin={{ top: 8, right: 16, left: 0, bottom: 80 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                    dataKey="name"
                    tick={{ fill: '#374151', fontSize: 9, fontFamily: 'Sarabun, sans-serif' }}
                    angle={-50}
                    textAnchor="end"
                    interval={0}
                    height={90}
                    tickMargin={5}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#6B7280', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                />
                <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'Sarabun, sans-serif', paddingTop: '4px' }}
                />
                
                {!isClient ? (
                    <>
                        <Bar dataKey="foundation" name="ฐานราก" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={barSize} isAnimationActive={false} />
                        <Bar dataKey="pole" name="ติดตั้งเสา" fill="#10B981" radius={[4, 4, 0, 0]} barSize={barSize} isAnimationActive={false} />
                    </>
                ) : (
                    <>
                        <Bar dataKey="electric" name="ระบบไฟฟ้า" fill="#3B82F6" radius={[2, 2, 0, 0]} barSize={barSize} isAnimationActive={false} />
                        <Bar dataKey="ground" name="ระบบกราวด์" fill="#10B981" radius={[2, 2, 0, 0]} barSize={barSize} isAnimationActive={false} />
                        <Bar dataKey="feeder" name="สายFeed" fill="#F59E0B" radius={[2, 2, 0, 0]} barSize={barSize} isAnimationActive={false} />
                        <Bar dataKey="tower" name="Yagi" fill="#8B5CF6" radius={[2, 2, 0, 0]} barSize={barSize} isAnimationActive={false} />
                        <Bar dataKey="radio" name="เครื่องวิทยุ" fill="#EC4899" radius={[2, 2, 0, 0]} barSize={barSize} isAnimationActive={false} />
                    </>
                )}
            </BarChart>
        </div>
    );
}
