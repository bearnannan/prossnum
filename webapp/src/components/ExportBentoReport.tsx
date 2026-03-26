"use client";

import React from 'react';
import ExportChartStatic from './ExportChartStatic';
import ExportMapStatic from './ExportMapStatic';

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
    const displayDistrict = district.startsWith('อำเภอ') ? district : `อำเภอ${district}`;
    
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
                        รายงานความคืบหน้า{isClient ? 'ติดตั้งระบบลูกข่าย' : 'ก่อสร้างฐานรากและเสา'}
                    </div>
                    <div style={{ color: '#FFFFFF', fontSize: '28px', fontWeight: 700, lineHeight: 1.2 }}>
                        {displayDistrict}
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: '12px', marginTop: '4px' }}>
                        {stations.length} สถานีลูกข่าย
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {/* Stat 1 */}
                    <div style={{ textAlign: 'center', backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: '12px', padding: '12px 20px' }}>
                        <div style={{ color: stat1.color, fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>{stat1.label}</div>
                        <div style={{ color: '#FFFFFF', fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{stat1.value}<span style={{ fontSize: '14px' }}>%</span></div>
                        <div style={{ color: '#94A3B8', fontSize: '10px', marginTop: '2px' }}>เฉลี่ย</div>
                    </div>
                    {/* Stat 2 */}
                    <div style={{ textAlign: 'center', backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: '12px', padding: '12px 20px' }}>
                        <div style={{ color: stat2.color, fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>{stat2.label}</div>
                        <div style={{ color: '#FFFFFF', fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{stat2.value}<span style={{ fontSize: '14px' }}>%</span></div>
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

                {/* LEFT COLUMN */}
                <div style={{ flex: '0 0 62%', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
                    {/* CHART BOX */}
                    <div style={{
                        flex: 1,
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
                            <ExportChartStatic data={stations} category={category} width={616} height={320} />
                        </div>
                    </div>

                    {/* MAP BOX */}
                    <div style={{
                        flex: '0 0 32%',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                    }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            แผนที่พิกัดสถานี
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden', borderRadius: '12px' }}>
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
                                                <th style={{ textAlign: 'right', padding: '6px 2px', color: '#EC4899', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>Link%</th>
                                                <th style={{ textAlign: 'right', padding: '6px 2px', color: '#4B5563', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>RSSI</th>
                                                <th style={{ textAlign: 'right', padding: '6px 2px', color: '#6366F1', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>SN</th>
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
                                                    <td style={{ padding: '4px 2px', textAlign: 'right', borderBottom: '1px solid #F3F4F6', fontWeight: 600, color: '#DB2777' }}>{s.linkProgress || 0}%</td>
                                                    <td style={{ padding: '4px 2px', textAlign: 'right', borderBottom: '1px solid #F3F4F6', color: '#4B5563' }}>{s.rssi || "-"}</td>
                                                    <td style={{ padding: '4px 2px', textAlign: 'right', borderBottom: '1px solid #F3F4F6', fontSize: '8px', color: '#9CA3AF' }}>{s.radioSN || "-"}</td>
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
