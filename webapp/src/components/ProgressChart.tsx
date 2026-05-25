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
    ReferenceArea
} from 'recharts';
import React, { useState } from 'react';

const NEON = {
  cyan: "#00F0FF",
  green: "#00FF88",
  yellow: "#F0E800",
  magenta: "#FF00A0",
  purple: "#B829DD",
  orange: "#FF7B00",
};

// Custom Tooltip for enhanced information
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#12121A]/95 backdrop-blur-md p-3.5 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.20)] text-xs">
                <p className="font-black text-white mb-2 uppercase tracking-wider text-sm" style={{ textShadow: "0 0 8px rgba(255,255,255,0.15)" }}>{data.name}</p>
                <div className="space-y-1 text-slate-400 mb-2 border-b border-white/5 pb-2">
                    <p><span className="font-bold text-slate-500 uppercase">อำเภอ:</span> {data.district}</p>
                    <p><span className="font-bold text-slate-500 uppercase">ประเภท:</span> {data.type}</p>
                </div>
                <div className="space-y-1.5">
                    {payload.map((entry: any, index: number) => (
                        <div key={`item-${index}`} className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 6px ${entry.color}` }} />
                                <span className="text-slate-300 font-bold">{entry.name}</span>
                            </div>
                            <span className="font-mono font-black" style={{ color: entry.color }}>{entry.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default React.memo(function ProgressChart({ data, category = 'station' }: { data: any[], category?: string }) {
    const isClient = category === 'client';
    
    const chartData = data.map((d, index) => {
        const base = {
            id: index,
            name: d.stationName || d.district,
            district: d.district,
            type: d.type || (isClient ? 'Client' : 'Station'),
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

    // State for zoom and pan
    const [left, setLeft] = useState<string | number>('dataMin');
    const [right, setRight] = useState<string | number>('dataMax');
    const [refAreaLeft, setRefAreaLeft] = useState<string | number>('');
    const [refAreaRight, setRefAreaRight] = useState<string | number>('');

    const zoom = () => {
        let _refAreaLeft = refAreaLeft;
        let _refAreaRight = refAreaRight;

        if (_refAreaLeft === _refAreaRight || _refAreaRight === '') {
            setRefAreaLeft('');
            setRefAreaRight('');
            return;
        }

        // Ensure left is always smaller than right
        if (_refAreaLeft > _refAreaRight) {
            [_refAreaLeft, _refAreaRight] = [_refAreaRight, _refAreaLeft];
        }

        setRefAreaLeft('');
        setRefAreaRight('');
        setLeft(_refAreaLeft);
        setRight(_refAreaRight);
    };

    const zoomOut = () => {
        setRefAreaLeft('');
        setRefAreaRight('');
        setLeft('dataMin');
        setRight('dataMax');
    };

    if (chartData.length === 0) {
        return <div className="flex items-center justify-center h-full text-slate-500 font-bold uppercase tracking-wider">ไม่มีข้อมูลสถานี</div>;
    }

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {(left !== 'dataMin' || right !== 'dataMax') && (
                <button
                    onClick={zoomOut}
                    className="absolute top-0 right-0 z-10 bg-dark-surface/80 border border-neon-cyan/35 text-neon-cyan px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-[0_0_12px_rgba(0,240,255,0.2)] hover:bg-neon-cyan/15 hover:shadow-[0_0_18px_rgba(0,240,255,0.4)] transition-all duration-200"
                >
                    Zoom Out
                </button>
            )}
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 absolute top-0 left-0">Drag horizontally to zoom in</p>
            <ResponsiveContainer width="100%" height="90%" minWidth={0} minHeight={0}>
                <BarChart
                    data={chartData}
                    margin={{ top: 25, right: 10, left: -20, bottom: 80 }}
                    onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel || '')}
                    onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel || '')}
                    onMouseUp={zoom}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.06)" />
                    <XAxis
                        dataKey="name"
                        domain={[left, right]}
                        type="category"
                        allowDataOverflow
                        tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 700 }}
                        angle={-60}
                        textAnchor="end"
                        interval={0}
                        height={140}
                        tickMargin={25}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        allowDataOverflow
                        domain={[0, 100]}
                        type="number"
                        tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 240, 255, 0.03)' }} />
                    <Legend 
                        iconType="circle" 
                        wrapperStyle={{ fontSize: '11px', fontWeight: 800, color: '#E2E8F0', paddingTop: '10px' }}
                    />
                    
                    {!isClient ? (
                        <>
                            <Bar dataKey="foundation" name="งานฐานราก" fill={NEON.cyan} radius={[4, 4, 0, 0]} barSize={20} isAnimationActive={false} />
                            <Bar dataKey="pole" name="ติดตั้งเสา" fill={NEON.green} radius={[4, 4, 0, 0]} barSize={20} isAnimationActive={false} />
                        </>
                    ) : (
                        <>
                            <Bar dataKey="electric" name="ระบบไฟฟ้า" fill={NEON.cyan} radius={[4, 4, 0, 0]} barSize={12} isAnimationActive={false} />
                            <Bar dataKey="ground" name="ระบบกราวด์" fill={NEON.green} radius={[4, 4, 0, 0]} barSize={12} isAnimationActive={false} />
                            <Bar dataKey="feeder" name="สาย Feeder" fill={NEON.yellow} radius={[4, 4, 0, 0]} barSize={12} isAnimationActive={false} />
                            <Bar dataKey="tower" name="อุปกรณ์บนเสา (Yagi)" fill={NEON.purple} radius={[4, 4, 0, 0]} barSize={12} isAnimationActive={false} />
                            <Bar dataKey="radio" name="เครื่องวิทยุ" fill={NEON.magenta} radius={[4, 4, 0, 0]} barSize={12} isAnimationActive={false} />
                        </>
                    )}

                    {refAreaLeft && refAreaRight ? (
                        <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#00f0ff" fillOpacity={0.15} />
                    ) : null}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
});
