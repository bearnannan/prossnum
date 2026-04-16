"use client";

import React from 'react';
import ExportChartStatic from './ExportChartStatic';
import ExportMapStatic from './ExportMapStatic';

interface StationData {
    province?: string;
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
    stations: any[];
    category?: 'station' | 'client';
}

function avg(stations: any[], key: string): number {
    if (stations.length === 0) return 0;
    const sum = stations.reduce((acc, s) => acc + (parseFloat(s[key] as any) || 0), 0);
    return Math.round(sum / stations.length);
}

export default function ExportBentoReport({ district, stations, category = 'station' }: ExportBentoReportProps) {
    const isClient = category === 'client';
    const provinceName = stations[0]?.province || 'กาญจนบุรี';
    const displayDistrict = district.startsWith('อำเภอ') ? district : `อำเภอ${district}`;
    const provinceLabel = `จ.${provinceName}`;
    const stationCount = stations.length;
    
    let avgOverall = 0;
    let stat1 = { label: '', value: 0, color: '' };
    let stat2 = { label: '', value: 0, color: '' };

    if (isClient) {
        const avgElectric = avg(stations, 'electricProgress');
        const avgGround = avg(stations, 'groundProgress');
        const avgFeeder = avg(stations, 'feederProgress');
        avgOverall = Math.round((avgElectric + avgGround + avgFeeder) / 3);
        stat1 = { label: 'เสร็จสมบูรณ์', value: avgElectric, color: '#60A5FA' };
        stat2 = { label: 'กำลังดำเนินการ', value: avgGround, color: '#34D399' };
    } else {
        const avgFoundation = avg(stations, 'foundationProgress');
        const avgPole = avg(stations, 'poleInstallationProgress');
        avgOverall = Math.round((avgFoundation + avgPole) / 2);
        stat1 = { label: 'ฐานราก', value: avgFoundation, color: '#60A5FA' };
        stat2 = { label: 'ติดตั้งเสา', value: avgPole, color: '#34D399' };
    }

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
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                borderRadius: '20px',
                padding: '24px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{ 
                        color: '#60A5FA', 
                        fontSize: '11px', 
                        fontWeight: 800, 
                        letterSpacing: '2.5px', 
                        textTransform: 'uppercase', 
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <div style={{ width: '16px', height: '3px', backgroundColor: '#3B82F6', borderRadius: '2px' }} />
                        รายงาน{isClient ? 'ติดตั้งระบบลูกข่าย' : 'ก่อสร้างฐานรากและเสา'}
                    </div>
                    <div style={{ color: '#F8FAFC', fontSize: '42px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                        {displayDistrict}
                    </div>
                    <div style={{ 
                        color: '#94A3B8', 
                        fontSize: '22px', 
                        fontWeight: 600, 
                        marginTop: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span style={{ color: '#E2E8F0' }}>{provinceLabel}</span>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#475569' }} />
                        <span style={{ fontSize: '15px', color: '#64748B', fontWeight: 500, letterSpacing: '0.5px' }}>{stationCount} สถานีลูกข่าย</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {/* Stat 1 */}
                    <div style={{ 
                        textAlign: 'center', 
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.05) 100%)', 
                        borderRadius: '20px', 
                        padding: '16px 28px',
                        border: '1px solid rgba(59,130,246,0.3)',
                        minWidth: '120px',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ color: '#93C5FD', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{stat1.label}</div>
                        <div style={{ color: '#FFFFFF', fontSize: '38px', fontWeight: 900, lineHeight: 1 }}>{stat1.value}<span style={{ fontSize: '18px', fontWeight: 600, opacity: 0.7, marginLeft: '2px' }}>%</span></div>
                        <div style={{ color: '#64748B', fontSize: '10px', marginTop: '6px', fontWeight: 600, letterSpacing: '0.5px' }}>เฉลี่ยทั้งหมด</div>
                    </div>
                    {/* Stat 2 */}
                    <div style={{ 
                        textAlign: 'center', 
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.05) 100%)', 
                        borderRadius: '20px', 
                        padding: '16px 28px',
                        border: '1px solid rgba(16,185,129,0.3)',
                        minWidth: '120px',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ color: '#6EE7B7', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{stat2.label}</div>
                        <div style={{ color: '#FFFFFF', fontSize: '38px', fontWeight: 900, lineHeight: 1 }}>{stat2.value}<span style={{ fontSize: '18px', fontWeight: 600, opacity: 0.7, marginLeft: '2px' }}>%</span></div>
                        <div style={{ color: '#64748B', fontSize: '10px', marginTop: '6px', fontWeight: 600, letterSpacing: '0.5px' }}>เฉลี่ยทั้งหมด</div>
                    </div>
                    {/* Overall progress */}
                    <div style={{ 
                        textAlign: 'center', 
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)', 
                        borderRadius: '20px', 
                        padding: '18px 32px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        minWidth: '140px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ color: '#E2E8F0', fontSize: '12px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>ความคืบหน้า</div>
                        <div style={{ color: ringColor, fontSize: '48px', fontWeight: 900, lineHeight: 1, textShadow: `0 4px 15px ${ringColor}40` }}>{avgOverall}<span style={{ fontSize: '20px', fontWeight: 600, color: '#94A3B8', marginLeft: '4px' }}>%</span></div>
                        <div style={{ color: '#94A3B8', fontSize: '10px', marginTop: '6px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>ภาพรวมเขต</div>
                    </div>
                </div>
            </div>

            {/* === BODY: Chart + Table === */}
            <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>

                {/* LEFT COLUMN */}
                <div style={{ flex: '0 0 62%', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
                    {/* CHART BOX */}
                    <div style={{
                        flex: 1,
                        backgroundColor: '#FFFFFF',
                        borderRadius: '20px',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                        border: '1px solid #F1F5F9'
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }}></span>
                            ความคืบหน้าแยกตามสถานี
                        </div>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ExportChartStatic data={stations} category={category} width={616} height={320} />
                        </div>
                    </div>

                    {/* MAP BOX */}
                    <div style={{
                        flex: '0 0 32%',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '20px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                        border: '1px solid #F1F5F9'
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
                            แผนที่พิกัดสถานี
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden', borderRadius: '14px', backgroundColor: '#F8FAFC' }}>
                            <ExportMapStatic stations={stations} />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
                    {/* TABLE BOX */}
                    <div style={{
                        flex: 1,
                        backgroundColor: '#FFFFFF',
                        borderRadius: '20px',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                        border: '1px solid #F1F5F9'
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366F1' }}></span>
                            รายชื่อสถานี
                        </div>
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#F9FAFB' }}>
                                        <th style={{ textAlign: 'left', padding: '6px 4px', color: '#6B7280', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>สถานี</th>
                                        {!isClient ? (
                                            <>
                                                <th style={{ textAlign: 'center', padding: '6px 4px', color: '#6B7280', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>Type</th>
                                                <th style={{ textAlign: 'right', padding: '6px 4px', color: '#3B82F6', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>ฐานราก</th>
                                                <th style={{ textAlign: 'right', padding: '6px 4px', color: '#10B981', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>เสา</th>
                                                <th style={{ textAlign: 'right', padding: '6px 4px', color: '#6366F1', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>วันที่เสร็จ</th>
                                            </>
                                        ) : (
                                            <>
                                                <th style={{ textAlign: 'right', padding: '6px 2px', color: '#3B82F6', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>ไฟฟ้า</th>
                                                <th style={{ textAlign: 'right', padding: '6px 2px', color: '#10B981', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>กราวด์</th>
                                                <th style={{ textAlign: 'right', padding: '6px 2px', color: '#F59E0B', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>Feed</th>
                                                <th style={{ textAlign: 'right', padding: '6px 2px', color: '#4B5563', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>RSSI</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {stations.map((s, i) => (
                                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                                            <td style={{ padding: '4px', color: '#111827', fontWeight: 500, borderBottom: '1px solid #F3F4F6', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {s.stationName}
                                            </td>
                                            {!isClient ? (
                                                <>
                                                    <td style={{ padding: '4px', textAlign: 'center', borderBottom: '1px solid #F3F4F6' }}>
                                                        <span style={{ backgroundColor: '#E0E7FF', color: '#4338CA', padding: '1px 4px', borderRadius: '4px', fontSize: '9px', fontWeight: 600 }}>
                                                            {s.type}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '4px', textAlign: 'right', borderBottom: '1px solid #F3F4F6' }}>{s.foundationProgress}%</td>
                                                    <td style={{ padding: '4px', textAlign: 'right', borderBottom: '1px solid #F3F4F6' }}>{s.poleInstallationProgress}%</td>
                                                    <td style={{ padding: '4px', textAlign: 'right', borderBottom: '1px solid #F3F4F6', color: '#6B7280' }}>{s.endDate || "-"}</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td style={{ padding: '4px 2px', textAlign: 'right', borderBottom: '1px solid #F3F4F6' }}>{s.electricProgress || 0}%</td>
                                                    <td style={{ padding: '4px 2px', textAlign: 'right', borderBottom: '1px solid #F3F4F6' }}>{s.groundProgress || 0}%</td>
                                                    <td style={{ padding: '4px 2px', textAlign: 'right', borderBottom: '1px solid #F3F4F6' }}>{s.feederProgress || 0}%</td>
                                                    <td style={{ padding: '4px 2px', textAlign: 'right', borderBottom: '1px solid #F3F4F6', color: '#4B5563' }}>{s.rssi || "-"}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
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
        </div>
    );
}
