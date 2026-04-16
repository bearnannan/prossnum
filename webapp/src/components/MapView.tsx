"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import React, { useEffect, useMemo } from 'react';

// ─── Helper: compute overall progress for a station ────────────────────────
function getOverallProgress(station: any, category: 'station' | 'client' = 'station'): number {
    if (category === 'client') {
        const ep = parseFloat(station.electricProgress) || 0;
        const gp = parseFloat(station.groundProgress) || 0;
        const fp = parseFloat(station.feederProgress) || 0;
        return (ep + gp + fp) / 3;
    } else {
        const fp = parseFloat(station.foundationProgress) || 0;
        const pp = parseFloat(station.poleInstallationProgress) || 0;
        return (fp + pp) / 2;
    }
}

// ─── Status logic ────────────────────────────────────────────────────────────
type StatusKey = 'not_started' | 'in_progress' | 'completed';

function getStatus(station: any, category: 'station' | 'client' = 'station'): StatusKey {
    if (category === 'client') {
        const ep = parseFloat(station.electricProgress) || 0;
        const gp = parseFloat(station.groundProgress) || 0;
        const fp = parseFloat(station.feederProgress) || 0;
        if (ep === 100 && gp === 100 && fp === 100) return 'completed';
        if (ep === 0 && gp === 0 && fp === 0) return 'not_started';
        return 'in_progress';
    } else {
        const fp = parseFloat(station.foundationProgress) || 0;
        const pp = parseFloat(station.poleInstallationProgress) || 0;
        if (fp === 100 && pp === 100) return 'completed';
        if (fp === 0 && pp === 0) return 'not_started';
        return 'in_progress';
    }
}

const STATUS_CONFIG: Record<StatusKey, { color: string; label: string; bg: string; glow: string }> = {
    not_started: { color: '#EF4444', label: 'ยังไม่เริ่ม', bg: '#FEE2E2', glow: 'rgba(239,68,68,0.3)' },
    in_progress: { color: '#F59E0B', label: 'กำลังดำเนินการ', bg: '#FEF3C7', glow: 'rgba(245,158,11,0.4)' },
    completed:   { color: '#22C55E', label: 'เสร็จสมบูรณ์', bg: '#DCFCE7', glow: 'rgba(34,197,94,0.3)' },
};

// ─── Pulsating Marker Icon with Ripple Effect ───────────────────────────────
function createTacticalIcon(color: string, status: StatusKey, progress: number) {
    const isPulsing = status === 'in_progress';
    const ringOpacity = status === 'completed' ? 0.6 : 0.8;
    
    const pulseAnimation = isPulsing ? `
        <style>
            @keyframes tactical-pulse {
                0% { r: 14; opacity: 0.6; }
                50% { r: 22; opacity: 0.15; }
                100% { r: 30; opacity: 0; }
            }
            @keyframes tactical-pulse-2 {
                0% { r: 14; opacity: 0.4; }
                50% { r: 18; opacity: 0.1; }
                100% { r: 24; opacity: 0; }
            }
            .pulse-ring { animation: tactical-pulse 2.5s ease-out infinite; }
            .pulse-ring-2 { animation: tactical-pulse-2 2.5s ease-out infinite 0.8s; }
        </style>
        <circle class="pulse-ring" cx="20" cy="20" r="14" fill="none" stroke="${color}" stroke-width="2" opacity="0.6"/>
        <circle class="pulse-ring-2" cx="20" cy="20" r="14" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.4"/>
    ` : '';

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
            ${pulseAnimation}
            <!-- Outer glow -->
            <circle cx="20" cy="20" r="12" fill="${color}" opacity="0.15"/>
            <!-- Main circle -->
            <circle cx="20" cy="20" r="8" fill="${color}" opacity="${ringOpacity}" stroke="rgba(255,255,255,0.9)" stroke-width="2.5"/>
            <!-- Inner dot -->
            <circle cx="20" cy="20" r="3" fill="white" opacity="0.95"/>
            ${status === 'completed' ? `
                <!-- Checkmark for completed -->
                <path d="M17 20 L19 22 L23 18" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            ` : ''}
        </svg>
    `;
    return L.divIcon({
        html: svg,
        className: 'tactical-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -22],
    });
}

// ─── Progress Bar component (popup HTML) ─────────────────────────────────────
function progressBarHtml(label: string, value: number, color: string): string {
    return `
        <div style="margin-bottom:6px">
            <div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;margin-bottom:2px">
                <span>${label}</span><span style="font-weight:600;color:#111">${value}%</span>
            </div>
            <div style="background:#F3F4F6;border-radius:9999px;height:6px;overflow:hidden">
                <div style="background:${color};height:100%;width:${value}%;border-radius:9999px;transition:width 0.3s"></div>
            </div>
        </div>
    `;
}


// ─── Auto-fit bounds to show all stations ────────────────────────────────────
function FitBounds({ data }: { data: any[] }) {
    const map = useMap();
    useEffect(() => {
        const validPoints = data
            .map(s => [parseFloat(s.lat), parseFloat(s.lon)] as [number, number])
            .filter(([lat, lon]) => !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0);
        if (validPoints.length > 0) {
            const bounds = L.latLngBounds(validPoints);
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
        }
    }, [data, map]);
    return null;
}

// ─── Tactical Legend ──────────────────────────────────────────────────────────
function TacticalLegend() {
    const map = useMap();
    useEffect(() => {
        const legend = new (L.Control.extend({
            onAdd() {
                const div = L.DomUtil.create('div');
                div.style.cssText = `
                    background: rgba(255,255,255,0.92);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    padding: 12px 16px;
                    border-radius: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04);
                    border: 1px solid rgba(0,0,0,0.04);
                    font-family: 'Inter', sans-serif;
                    font-size: 11px;
                    line-height: 2;
                    min-width: 150px;
                `;
                div.innerHTML = `
                    <div style="font-weight:800;color:#18181b;margin-bottom:6px;font-size:10px;text-transform:uppercase;letter-spacing:0.1em">
                        สถานะสถานี
                    </div>
                    ${Object.entries(STATUS_CONFIG).map(([key, cfg]) => `
                        <div style="display:flex;align-items:center;gap:8px;color:#3f3f46;font-weight:500">
                            <div style="position:relative;width:16px;height:16px;display:flex;align-items:center;justify-content:center">
                                ${key === 'in_progress' ? `
                                    <div style="position:absolute;width:14px;height:14px;border-radius:50%;border:1.5px solid ${cfg.color};opacity:0.4;animation:tactical-legend-pulse 2s ease-out infinite"></div>
                                ` : ''}
                                <div style="width:8px;height:8px;border-radius:50%;background:${cfg.color};box-shadow:0 0 6px ${cfg.glow}"></div>
                            </div>
                            ${cfg.label}
                        </div>
                    `).join('')}
                `;
                
                // Inject legend pulse animation
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes tactical-legend-pulse {
                        0% { transform: scale(1); opacity: 0.5; }
                        100% { transform: scale(1.8); opacity: 0; }
                    }
                `;
                div.appendChild(style);
                
                return div;
            }
        }))({ position: 'bottomleft' });
        legend.addTo(map);
        return () => { legend.remove(); };
    }, [map]);
    return null;
}

// ─── Inject global tactical marker styles ─────────────────────────────────────
function TacticalStyles() {
    useEffect(() => {
        const styleId = 'tactical-map-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .tactical-marker {
                background: transparent !important;
                border: none !important;
            }
            .leaflet-popup-content-wrapper {
                border-radius: 16px !important;
                box-shadow: 0 4px 16px rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.06) !important;
                border: 1px solid rgba(0,0,0,0.04) !important;
            }
            .leaflet-popup-tip {
                box-shadow: none !important;
            }
            .leaflet-container {
                font-family: 'Inter', sans-serif !important;
            }
        `;
        document.head.appendChild(style);
        return () => {
            const el = document.getElementById(styleId);
            if (el) el.remove();
        };
    }, []);
    return null;
}

// ─── Main Tactical MapView ────────────────────────────────────────────────────
const MapView = React.memo(function MapView({ data, category = 'station' }: { data: any[], category?: 'station' | 'client' }) {
    const defaultCenter: [number, number] = [14.5, 100.5]; // Thailand center

    return (
        // @ts-ignore
        <MapContainer
            // @ts-ignore
            center={defaultCenter}
            zoom={7}
            scrollWheelZoom={true}
            className="h-full w-full rounded-xl z-0"
            style={{ background: '#f8fafc' }}
        >
            {/* Minimal Light Theme — CARTO Positron (clean grey basemap) */}
            {/* @ts-ignore */}
            <TileLayer
                // @ts-ignore
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                url="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
                maxZoom={19}
                subdomains="abcd"
            />

            <TacticalStyles />
            <FitBounds data={data} />
            <TacticalLegend />


            {/* Markers */}
            {data.map((station, idx) => {
                const lat = parseFloat(station.lat);
                const lon = parseFloat(station.lon);
                if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return null;

                const status = getStatus(station, category);
                const cfg = STATUS_CONFIG[status];
                const overall = Math.round(getOverallProgress(station, category));
                const icon = createTacticalIcon(cfg.color, status, overall);

                const popupContent = `
                    <div style="font-family:'Inter',sans-serif;min-width:220px;padding:4px 0">
                        <div style="font-size:14px;font-weight:800;color:#18181b;margin-bottom:2px;letter-spacing:-0.01em">
                            ${station.stationName || 'Unknown Station'}
                        </div>
                        <div style="font-size:11px;color:#71717a;margin-bottom:10px;font-weight:500">
                            จ.${station.province || 'กาญจนบุรี'} อ.${station.district} &nbsp;·&nbsp; ${category === 'client' ? 'Client System' : `Type ${station.type}`}
                        </div>
                        <div style="display:inline-flex;align-items:center;gap:6px;background:${cfg.bg};color:${cfg.color};
                            font-size:10px;font-weight:700;padding:4px 12px;border-radius:9999px;margin-bottom:12px;letter-spacing:0.02em">
                            <svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill="${cfg.color}"/></svg>
                            ${cfg.label}
                        </div>
                        ${category === 'client' ? `
                            ${progressBarHtml('ระบบไฟฟ้า', parseFloat(station.electricProgress) || 0, '#6366F1')}
                            ${progressBarHtml('ระบบกราวด์', parseFloat(station.groundProgress) || 0, '#10B981')}
                            ${progressBarHtml('สาย Feeder', parseFloat(station.feederProgress) || 0, '#06B6D4')}
                        ` : `
                            ${progressBarHtml('ความคืบหน้าฐานราก', parseFloat(station.foundationProgress) || 0, '#6366F1')}
                            ${progressBarHtml('ติดตั้งเสา', parseFloat(station.poleInstallationProgress) || 0, '#8B5CF6')}
                        `}
                        <div style="margin-top:10px;padding-top:8px;border-top:1px solid #f4f4f5;
                            display:flex;align-items:center;justify-content:space-between">
                            <span style="font-size:10px;color:#a1a1aa;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Overall</span>
                            <span style="font-size:18px;font-weight:900;color:#18181b;letter-spacing:-0.02em">${overall}%</span>
                        </div>
                    </div>
                `;

                return (
                    // @ts-ignore
                    <Marker key={idx} position={[lat, lon]} icon={icon}>
                        {/* @ts-ignore */}
                        <Popup
                            // @ts-ignore
                            maxWidth={260}
                            className="station-popup"
                        >
                            <div dangerouslySetInnerHTML={{ __html: popupContent }} />
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
});

export default MapView;
