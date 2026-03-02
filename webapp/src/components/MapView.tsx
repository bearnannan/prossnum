"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { useEffect } from 'react';

// ─── Helper: compute overall progress for a station ────────────────────────
function getOverallProgress(station: any): number {
    const fp = parseFloat(station.foundationProgress) || 0;
    const pp = parseFloat(station.poleInstallationProgress) || 0;
    return (fp + pp) / 2;
}

// ─── Status logic ────────────────────────────────────────────────────────────
type StatusKey = 'not_started' | 'in_progress' | 'completed';

function getStatus(station: any): StatusKey {
    const fp = parseFloat(station.foundationProgress) || 0;
    const pp = parseFloat(station.poleInstallationProgress) || 0;
    if (fp === 100 && pp === 100) return 'completed';
    if (fp === 0 && pp === 0) return 'not_started';
    return 'in_progress';
}

const STATUS_CONFIG: Record<StatusKey, { color: string; label: string; bg: string }> = {
    not_started: { color: '#EF4444', label: 'ยังไม่เริ่ม', bg: '#FEE2E2' },
    in_progress: { color: '#F59E0B', label: 'กำลังดำเนินการ', bg: '#FEF3C7' },
    completed: { color: '#22C55E', label: 'เสร็จสมบูรณ์', bg: '#DCFCE7' },
};

// ─── Custom SVG marker icon ──────────────────────────────────────────────────
function createColoredIcon(color: string) {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
            <path d="M14 0C6.27 0 0 6.27 0 14c0 9.63 12.31 21.16 13.3 22.12a.98.98 0 0 0 1.4 0C15.69 35.16 28 23.63 28 14 28 6.27 21.73 0 14 0z"
                fill="${color}" opacity="0.95"/>
            <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
        </svg>
    `;
    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -38],
    });
}

// ─── Progress Bar component (rendered in popup via HTML string) ───────────────
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

// ─── Legend component ─────────────────────────────────────────────────────────
function Legend() {
    const map = useMap();
    useEffect(() => {
        const legend = new (L.Control.extend({
            onAdd() {
                const div = L.DomUtil.create('div');
                div.style.cssText = `
                    background: white;
                    padding: 10px 14px;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    font-family: sans-serif;
                    font-size: 12px;
                    line-height: 1.8;
                    min-width: 140px;
                `;
                div.innerHTML = `
                    <div style="font-weight:700;color:#111;margin-bottom:6px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">สถานะสถานี</div>
                    ${Object.entries(STATUS_CONFIG).map(([, cfg]) => `
                        <div style="display:flex;align-items:center;gap:8px;color:#374151">
                            <svg width="12" height="12" viewBox="0 0 12 12">
                                <circle cx="6" cy="6" r="6" fill="${cfg.color}"/>
                            </svg>
                            ${cfg.label}
                        </div>
                    `).join('')}
                `;
                return div;
            }
        }))({ position: 'bottomleft' });
        legend.addTo(map);
        return () => { legend.remove(); };
    }, [map]);
    return null;
}

// ─── Main MapView ─────────────────────────────────────────────────────────────
export default function MapView({ data }: { data: any[] }) {
    const defaultCenter: [number, number] = [14.5, 100.5]; // Thailand center

    return (
        // @ts-ignore
        <MapContainer
            // @ts-ignore
            center={defaultCenter}
            zoom={7}
            scrollWheelZoom={true}
            className="h-full w-full rounded-xl z-0"
        >
            {/* @ts-ignore */}
            <TileLayer
                // @ts-ignore
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitBounds data={data} />
            <Legend />

            {data.map((station, idx) => {
                const lat = parseFloat(station.lat);
                const lon = parseFloat(station.lon);
                if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return null;

                const status = getStatus(station);
                const cfg = STATUS_CONFIG[status];
                const overall = Math.round(getOverallProgress(station));
                const icon = createColoredIcon(cfg.color);

                const popupContent = `
                    <div style="font-family:sans-serif;min-width:200px;padding:4px 0">
                        <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:2px">
                            ${station.stationName || 'Unknown Station'}
                        </div>
                        <div style="font-size:12px;color:#6B7280;margin-bottom:10px">
                            อำเภอ ${station.district} &nbsp;·&nbsp; Type ${station.type}
                        </div>
                        <div style="display:inline-flex;align-items:center;gap:6px;background:${cfg.bg};color:${cfg.color};
                            font-size:11px;font-weight:600;padding:3px 10px;border-radius:9999px;margin-bottom:12px">
                            <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="${cfg.color}"/></svg>
                            ${cfg.label}
                        </div>
                        ${progressBarHtml('ความคืบหน้าฐานราก', parseFloat(station.foundationProgress) || 0, '#6366F1')}
                        ${progressBarHtml('ติดตั้งเสา', parseFloat(station.poleInstallationProgress) || 0, '#8B5CF6')}
                        <div style="margin-top:10px;padding-top:8px;border-top:1px solid #F3F4F6;
                            display:flex;align-items:center;justify-content:space-between">
                            <span style="font-size:11px;color:#6B7280">ความคืบหน้าโดยรวม</span>
                            <span style="font-size:16px;font-weight:800;color:#111">${overall}%</span>
                        </div>
                    </div>
                `;

                return (
                    // @ts-ignore
                    <Marker key={idx} position={[lat, lon]} icon={icon}>
                        {/* @ts-ignore */}
                        <Popup
                            // @ts-ignore
                            maxWidth={240}
                            className="station-popup"
                        >
                            <div dangerouslySetInnerHTML={{ __html: popupContent }} />
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
