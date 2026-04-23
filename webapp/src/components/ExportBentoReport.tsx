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
    stations: any[]; // Stations in this district (for the table)
    allStations?: any[]; // All stations in province (for the summary header)
    category?: 'station' | 'client';
}

function avg(stations: any[], key: string): number {
    if (stations.length === 0) return 0;
    const sum = stations.reduce((acc, s) => acc + (parseFloat(s[key] as any) || 0), 0);
    return Math.round(sum / stations.length);
}

export default function ExportBentoReport({ district, stations, allStations = [], category = 'station' }: ExportBentoReportProps) {
    const isClient = category === 'client';
    const provinceName = stations[0]?.province || 'กาญจนบุรี';
    const displayDistrict = district.startsWith('อำเภอ') ? district : `อำเภอ${district}`;
    const provinceLabel = `จ.${provinceName}`;
    const stationCount = stations.length;

    // We use allStations for the summary header if provided, otherwise fallback to current page stations
    const summarySource = allStations.length > 0 ? allStations : stations;
    const totalInProvince = summarySource.length;

    let avgOverall = 0;
    let stat1 = { label: '', value: 0, sub: '', color: '' };
    let stat2 = { label: '', value: 0, sub: '', color: '' };
    let stat3 = { label: '', value: 0, sub: '', color: '' };

    if (isClient) {
        // Summary counts for Client
        let completedCount = 0;
        let radioInstalledCount = 0;
        let meterInstalledCount = 0;

        summarySource.forEach(item => {
            const prog = (parseFloat(item.electricProgress || 0) + parseFloat(item.groundProgress || 0) + parseFloat(item.feederProgress || 0)) / 3;
            if (prog >= 100) completedCount++;
            if (Number(item.radioProgress) === 100) radioInstalledCount++;
            if (item.meterInstalled) meterInstalledCount++;
        });

        const avgElectric = avg(summarySource, 'electricProgress');
        const avgGround = avg(summarySource, 'groundProgress');
        const avgFeeder = avg(summarySource, 'feederProgress');
        const avgTower = avg(summarySource, 'towerProgress');
        const avgRadio = avg(summarySource, 'radioProgress');

        avgOverall = Math.round((avgElectric + avgGround + avgFeeder + avgTower + avgRadio) / 5);

        stat1 = { label: 'ติดตั้งระบบ ลข.', value: completedCount, sub: `จาก ${totalInProvince}`, color: '#60A5FA' };
        stat2 = { label: 'วางเครื่องวิทยุ', value: radioInstalledCount, sub: `จาก ${totalInProvince}`, color: '#34D399' };
        stat3 = { label: 'งานมิเตอร์ไฟฟ้า', value: meterInstalledCount, sub: `จาก ${totalInProvince}`, color: '#F59E0B' };
    } else {
        const avgFoundation = avg(summarySource, 'foundationProgress');
        const avgPole = avg(summarySource, 'poleInstallationProgress');
        avgOverall = Math.round((avgFoundation + avgPole) / 2);

        let completedCount = 0;
        summarySource.forEach(item => {
            const prog = (parseFloat(item.foundationProgress || 0) + parseFloat(item.poleInstallationProgress || 0)) / 2;
            if (prog >= 100) completedCount++;
        });

        stat1 = { label: 'ติดตั้งแล้วเสร็จ', value: completedCount, sub: `จาก ${totalInProvince}`, color: '#60A5FA' };
        stat2 = { label: 'ฐานรากเฉลี่ย', value: avgFoundation, sub: '%', color: '#34D399' };
        stat3 = { label: 'ติดตั้งเสาเฉลี่ย', value: avgPole, sub: '%', color: '#F59E0B' };
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
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* Stat 1 */}
                    <div style={{ 
                        textAlign: 'center', 
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(37,99,235,0.05) 100%)', 
                        borderRadius: '16px', 
                        padding: '12px 16px',
                        border: '1px solid rgba(59,130,246,0.2)',
                        minWidth: '100px',
                    }}>
                        <div style={{ color: '#93C5FD', fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>{stat1.label}</div>
                        <div style={{ color: '#FFFFFF', fontSize: '28px', fontWeight: 900, lineHeight: 1 }}>{stat1.value}</div>
                        <div style={{ color: '#64748B', fontSize: '10px', marginTop: '4px', fontWeight: 600 }}>{stat1.sub}</div>
                    </div>
                    {/* Stat 2 */}
                    <div style={{ 
                        textAlign: 'center', 
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.05) 100%)', 
                        borderRadius: '16px', 
                        padding: '12px 16px',
                        border: '1px solid rgba(16,185,129,0.2)',
                        minWidth: '100px',
                    }}>
                        <div style={{ color: '#6EE7B7', fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>{stat2.label}</div>
                        <div style={{ color: '#FFFFFF', fontSize: '28px', fontWeight: 900, lineHeight: 1 }}>{stat2.value}</div>
                        <div style={{ color: '#64748B', fontSize: '10px', marginTop: '4px', fontWeight: 600 }}>{stat2.sub}</div>
                    </div>
                    {/* Stat 3 */}
                    <div style={{ 
                        textAlign: 'center', 
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.05) 100%)', 
                        borderRadius: '16px', 
                        padding: '12px 16px',
                        border: '1px solid rgba(245,158,11,0.2)',
                        minWidth: '100px',
                    }}>
                        <div style={{ color: '#FCD34D', fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>{stat3.label}</div>
                        <div style={{ color: '#FFFFFF', fontSize: '28px', fontWeight: 900, lineHeight: 1 }}>{stat3.value}</div>
                        <div style={{ color: '#64748B', fontSize: '10px', marginTop: '4px', fontWeight: 600 }}>{stat3.sub}</div>
                    </div>
                    {/* Overall progress */}
                    <div style={{ 
                        textAlign: 'center', 
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)', 
                        borderRadius: '16px', 
                        padding: '14px 20px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        minWidth: '110px',
                        marginLeft: '8px'
                    }}>
                        <div style={{ color: '#E2E8F0', fontSize: '10px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>ความคืบหน้า</div>
                        <div style={{ color: ringColor, fontSize: '36px', fontWeight: 900, lineHeight: 1 }}>{avgOverall}<span style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8', marginLeft: '2px' }}>%</span></div>
                        <div style={{ color: '#94A3B8', fontSize: '9px', marginTop: '4px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{isClient ? 'เฉลี่ยรวม' : 'ภาพรวม'}</div>
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
                            <ExportMapStatic stations={stations} category={category} />
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
                                                <th style={{ textAlign: 'right', padding: '6px 2px', color: '#F59E0B', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>Feeder</th>
                                                <th style={{ textAlign: 'right', padding: '6px 2px', color: '#8B5CF6', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>Yagi</th>
                                                <th style={{ textAlign: 'center', padding: '6px 2px', color: '#6366F1', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>วิทยุ</th>
                                                <th style={{ textAlign: 'center', padding: '6px 2px', color: '#4B5563', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>มิเตอร์</th>
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
                                                    <td style={{ padding: '4px 2px', textAlign: 'right', borderBottom: '1px solid #F3F4F6' }}>{s.towerProgress || 0}%</td>
                                                    <td style={{ padding: '4px 2px', textAlign: 'center', borderBottom: '1px solid #F3F4F6' }}>
                                                        {s.radioProgress === 100 ? "✅" : "❌"}
                                                    </td>
                                                    <td style={{ padding: '4px 2px', textAlign: 'center', borderBottom: '1px solid #F3F4F6' }}>
                                                        {s.meterInstalled ? "✅" : "❌"}
                                                    </td>
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
