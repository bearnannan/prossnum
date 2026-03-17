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

// Custom Tooltip for enhanced information
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-zinc-100 text-sm">
                <p className="font-semibold text-zinc-800 mb-1">{data.name}</p>
                <p className="text-zinc-600 mb-1"><span className="font-medium text-zinc-500">อ.:</span> {data.district}</p>
                <p className="text-zinc-600 mb-2"><span className="font-medium text-zinc-500">Type:</span> {data.type}</p>
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

export default function ProgressChart({ data, category = 'station' }: { data: any[], category?: string }) {
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
                link: parseFloat(d.linkProgress) || 0,
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
        return <div className="flex items-center justify-center h-full text-gray-500">No data available for chart</div>;
    }

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {(left !== 'dataMin' || right !== 'dataMax') && (
                <button
                    onClick={zoomOut}
                    className="absolute top-0 right-0 z-10 bg-white border border-zinc-200 text-zinc-600 px-3 py-1 rounded text-xs shadow-sm hover:bg-zinc-50"
                >
                    Zoom Out
                </button>
            )}
            <p className="text-xs text-zinc-400 absolute top-0 left-0">Drag horizontally to zoom in</p>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart
                    data={chartData}
                    margin={{ top: 25, right: 30, left: 0, bottom: 80 }}
                    onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel || '')}
                    onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel || '')}
                    onMouseUp={zoom}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="name"
                        domain={[left, right]}
                        type="category"
                        allowDataOverflow
                        tick={{ fill: '#6B7280', fontSize: 10 }}
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
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    
                    {!isClient ? (
                        <>
                            <Bar dataKey="foundation" name="ฐานราก" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="pole" name="ติดตั้งเสา" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                        </>
                    ) : (
                        <>
                            <Bar dataKey="electric" name="ระบบไฟฟ้า" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={12} />
                            <Bar dataKey="ground" name="ระบบกราวด์" fill="#10B981" radius={[4, 4, 0, 0]} barSize={12} />
                            <Bar dataKey="feeder" name="สาย Feeder" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={12} />
                            <Bar dataKey="tower" name="อุปกรณ์บนเสา" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={12} />
                            <Bar dataKey="radio" name="เครื่องวิทยุ" fill="#EC4899" radius={[4, 4, 0, 0]} barSize={12} />
                            <Bar dataKey="link" name="ทดสอบสัญญาณ" fill="#06B6D4" radius={[4, 4, 0, 0]} barSize={12} />
                        </>
                    )}

                    {refAreaLeft && refAreaRight ? (
                        <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#8884d8" fillOpacity={0.3} />
                    ) : null}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
