"use client";

import React from 'react';
import ExportChartStatic from './ExportChartStatic';

interface StationData {
    district: string;
    stationName: string;
    type: string;
    foundationProgress: number;
    poleInstallationProgress: number;
    lat?: number;
    lon?: number;
    rowIndex?: number;
}

interface ExportBentoReportProps {
    district: string;
    stations: StationData[];
}

function avg(stations: StationData[], key: keyof StationData): number {
    if (stations.length === 0) return 0;
    const sum = stations.reduce((acc, s) => acc + (parseFloat(s[key] as any) || 0), 0);
    return Math.round(sum / stations.length);
}

export default function ExportBentoReport({ district, stations }: ExportBentoReportProps) {
    const displayDistrict = district.startsWith('อำเภอ') ? district : `อำเภอ${district}`;
    const avgFoundation = avg(stations, 'foundationProgress');
    const avgPole = avg(stations, 'poleInstallationProgress');
    const avgOverall = Math.round((avgFoundation + avgPole) / 2);

    // Progress ring color
    const ringColor =
        avgOverall >= 75 ? '#10B981' :
            avgOverall >= 40 ? '#F59E0B' : '#EF4444';

    return (
        <div
            style={{
                width: '1122px',
                height: '794px',
                backgroundColor: '#F3F4F6',
                fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
                padding: '32px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
            }}
        >
            {/* === HEADER BOX === */}
            <div style={{
                backgroundColor: '#1E293B',
                borderRadius: '16px',
                padding: '20px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
            }}>
                <div>
                    <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                        รายงานความคืบหน้า
                    </div>
                    <div style={{ color: '#FFFFFF', fontSize: '28px', fontWeight: 700, lineHeight: 1.2 }}>
                        {displayDistrict}
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: '12px', marginTop: '4px' }}>
                        {stations.length} สถานี
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {/* Foundation stat */}
                    <div style={{ textAlign: 'center', backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: '12px', padding: '12px 20px' }}>
                        <div style={{ color: '#60A5FA', fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>ฐานราก</div>
                        <div style={{ color: '#FFFFFF', fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{avgFoundation}<span style={{ fontSize: '14px' }}>%</span></div>
                        <div style={{ color: '#94A3B8', fontSize: '10px', marginTop: '2px' }}>เฉลี่ย</div>
                    </div>
                    {/* Pole stat */}
                    <div style={{ textAlign: 'center', backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: '12px', padding: '12px 20px' }}>
                        <div style={{ color: '#34D399', fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>ติดตั้งเสา</div>
                        <div style={{ color: '#FFFFFF', fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{avgPole}<span style={{ fontSize: '14px' }}>%</span></div>
                        <div style={{ color: '#94A3B8', fontSize: '10px', marginTop: '2px' }}>เฉลี่ย</div>
                    </div>
                    {/* Overall progress */}
                    <div style={{ textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 20px' }}>
                        <div style={{ color: '#CBD5E1', fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>ภาพรวม</div>
                        <div style={{ color: ringColor, fontSize: '36px', fontWeight: 800, lineHeight: 1 }}>{avgOverall}<span style={{ fontSize: '14px', color: '#CBD5E1' }}>%</span></div>
                        <div style={{ color: '#94A3B8', fontSize: '10px', marginTop: '2px' }}>ความคืบหน้าเฉลี่ย</div>
                    </div>
                </div>
            </div>

            {/* === BODY: Chart + Table === */}
            <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>

                {/* CHART BOX */}
                <div style={{
                    flex: '0 0 62%',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                        ความคืบหน้าแยกตามสถานี
                    </div>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ExportChartStatic data={stations} width={616} height={400} />
                    </div>
                </div>

                {/* TABLE BOX */}
                <div style={{
                    flex: 1,
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden',
                }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>
                        รายชื่อสถานี
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#F9FAFB' }}>
                                    <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6B7280', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>สถานี</th>
                                    <th style={{ textAlign: 'center', padding: '6px 8px', color: '#6B7280', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>Type</th>
                                    <th style={{ textAlign: 'right', padding: '6px 8px', color: '#3B82F6', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>ฐานราก</th>
                                    <th style={{ textAlign: 'right', padding: '6px 8px', color: '#10B981', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>เสา</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stations.map((s, i) => {
                                    const fPct = parseFloat(s.foundationProgress as any) || 0;
                                    const pPct = parseFloat(s.poleInstallationProgress as any) || 0;
                                    return (
                                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                                            <td style={{ padding: '5px 8px', color: '#111827', fontWeight: 500, borderBottom: '1px solid #F3F4F6' }}>
                                                {s.stationName}
                                            </td>
                                            <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #F3F4F6' }}>
                                                <span style={{
                                                    backgroundColor: '#E0E7FF',
                                                    color: '#4338CA',
                                                    padding: '1px 6px',
                                                    borderRadius: '999px',
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                }}>
                                                    {s.type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '5px 8px', textAlign: 'right', color: fPct >= 100 ? '#059669' : '#374151', fontWeight: fPct >= 100 ? 700 : 400, borderBottom: '1px solid #F3F4F6' }}>
                                                {fPct}%
                                            </td>
                                            <td style={{ padding: '5px 8px', textAlign: 'right', color: pPct >= 100 ? '#059669' : '#374151', fontWeight: pPct >= 100 ? 700 : 400, borderBottom: '1px solid #F3F4F6' }}>
                                                {pPct}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Footer inside table box */}
                    <div style={{ marginTop: '10px', borderTop: '1px solid #E5E7EB', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', color: '#9CA3AF', fontSize: '9px' }}>
                        <span>Progress Dashboard — สรุปผลรายอำเภอ</span>
                        <span>พิมพ์: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
