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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width, height, color: '#64748B', background: 'rgba(10,10,15,0.65)', borderRadius: '14px' }}>
                ไม่มีข้อมูล
            </div>
        );
    }

    // Compute dynamic bar size: shrink bars when many stations
    const barSize = isClient 
        ? Math.max(2, Math.min(10, Math.floor(width / chartData.length / 6.5)))
        : Math.max(6, Math.min(20, Math.floor(width / chartData.length / 2.5)));

    return (
        // Fixed-dimension wrapper — NO ResponsiveContainer (doesn't work off-screen)
        <div style={{ width, height, overflow: 'hidden', background: 'rgba(10,10,15,0.45)', borderRadius: '14px' }}>
            <BarChart
                width={width}
                height={height}
                data={chartData}
                margin={{ top: 8, right: 16, left: 0, bottom: 80 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,240,255,0.16)" />
                <XAxis
                    dataKey="name"
                    tick={{ fill: '#94A3B8', fontSize: 9, fontFamily: 'Sarabun, sans-serif' }}
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
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                />
                <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'Sarabun, sans-serif', paddingTop: '4px', color: '#CBD5E1' }}
                />
                
                {!isClient ? (
                    <>
                        <Bar dataKey="foundation" name="ฐานราก" fill="#00F0FF" radius={[4, 4, 0, 0]} barSize={barSize} isAnimationActive={false} />
                        <Bar dataKey="pole" name="ติดตั้งเสา" fill="#00FF88" radius={[4, 4, 0, 0]} barSize={barSize} isAnimationActive={false} />
                    </>
                ) : (
                    <>
                        <Bar dataKey="electric" name="ระบบไฟฟ้า" fill="#00F0FF" radius={[2, 2, 0, 0]} barSize={barSize} isAnimationActive={false} />
                        <Bar dataKey="ground" name="ระบบกราวด์" fill="#00FF88" radius={[2, 2, 0, 0]} barSize={barSize} isAnimationActive={false} />
                        <Bar dataKey="feeder" name="สาย Feeder" fill="#F0E800" radius={[2, 2, 0, 0]} barSize={barSize} isAnimationActive={false} />
                        <Bar dataKey="tower" name="อุปกรณ์บนเสา (Yagi)" fill="#B829DD" radius={[2, 2, 0, 0]} barSize={barSize} isAnimationActive={false} />
                        <Bar dataKey="radio" name="เครื่องวิทยุ" fill="#FF00A0" radius={[2, 2, 0, 0]} barSize={barSize} isAnimationActive={false} />
                    </>
                )}
            </BarChart>
        </div>
    );
}
