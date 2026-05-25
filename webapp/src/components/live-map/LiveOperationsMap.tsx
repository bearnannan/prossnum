"use client";

import React, { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import type { IncidentMapFeature, IncidentMapStatus, LiveMapAsset } from "@/lib/incidents/map-join";

const STATUS_COLORS: Record<IncidentMapStatus | "station" | "client", string> = {
  station: "#00f0ff",
  client: "#b829dd",
  resolved: "#00ff88",
  active: "#f0e800",
  pending: "#6b7280",
  breached: "#ff00a0",
  unmatched: "#ff7b00",
};

function LiveMapStyles() {
  useEffect(() => {
    const id = "live-operations-map-styles";
    document.getElementById(id)?.remove();
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .live-map-vector-marker {
        filter: drop-shadow(0 0 8px rgba(0,240,255,.35));
        transition: opacity 180ms ease;
      }
      .leaflet-container { background: #0a0a0f; font-family: var(--font-body), system-ui, sans-serif; }
      .live-operations-map .leaflet-control-zoom a {
        background: rgba(18,18,26,.88) !important;
        color: #00f0ff !important;
        border-color: rgba(0,240,255,.16) !important;
      }
      .live-operations-map .leaflet-control-attribution {
        background: rgba(10,10,15,.72) !important;
        color: rgba(226,232,240,.72) !important;
      }
      .live-operations-map .leaflet-popup-content-wrapper {
        background: rgba(18,18,26,.96) !important;
        color: #e2e8f0 !important;
        border: 1px solid rgba(0,240,255,.18);
        border-radius: 8px;
        box-shadow: 0 14px 40px rgba(0,0,0,.55), 0 0 22px rgba(0,240,255,.10);
      }
      .live-operations-map .leaflet-popup-tip { background: rgba(18,18,26,.96) !important; }
      @media (prefers-reduced-motion: reduce) {
        .live-map-vector-marker { transition: none !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.getElementById(id)?.remove();
  }, []);
  return null;
}

function FitLiveBounds({ assets }: { assets: LiveMapAsset[] }) {
  const map = useMap();
  useEffect(() => {
    const points = assets.map((asset) => [asset.lat, asset.lon] as [number, number]);
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 12 });
  }, [assets, map]);
  return null;
}

interface LiveOperationsMapProps {
  assets: LiveMapAsset[];
  incidentFeatures: IncidentMapFeature[];
  selectedAssetId: string | null;
  onSelectAsset: (asset: LiveMapAsset) => void;
  onSelectIncident: (feature: IncidentMapFeature) => void;
}

export default function LiveOperationsMap({
  assets,
  incidentFeatures,
  selectedAssetId,
  onSelectAsset,
  onSelectIncident,
}: LiveOperationsMapProps) {
  const incidentByAsset = new Map<string, IncidentMapFeature[]>();
  for (const feature of incidentFeatures) {
    if (!feature.assetId) continue;
    const current = incidentByAsset.get(feature.assetId) || [];
    current.push(feature);
    incidentByAsset.set(feature.assetId, current);
  }

  return (
    <MapContainer
      center={[14.5, 100.5]}
      zoom={7}
      scrollWheelZoom
      className="live-operations-map h-full w-full z-0"
      style={{ background: "#0a0a0f" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
        maxZoom={19}
        subdomains="abcd"
      />
      <LiveMapStyles />
      <FitLiveBounds assets={assets} />



      {assets.map((asset) => {
        const incidents = incidentByAsset.get(asset.id) || [];
        const worstIncident = incidents.find((item) => item.status === "breached") || incidents[0];
        const color = worstIncident ? STATUS_COLORS[worstIncident.status] : STATUS_COLORS[asset.layer];
        const selected = selectedAssetId === asset.id;
        return (
          <CircleMarker
            key={asset.id}
            center={[asset.lat, asset.lon]}
            radius={selected ? 12 : incidents.length > 0 ? 10 : 7}
            pathOptions={{
              color,
              weight: selected ? 4 : 2,
              fillColor: color,
              fillOpacity: incidents.length > 0 ? 0.42 : 0.24,
              opacity: selected ? 1 : 0.86,
              className: "live-map-vector-marker",
            }}
            bubblingMouseEvents={false}
            eventHandlers={{ click: () => onSelectAsset(asset) }}
          >
            <Popup maxWidth={280}>
              <div className="min-w-[220px] py-1">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neon-cyan">
                  {asset.layer === "station" ? "Station Asset" : "Client System"}
                </div>
                <div className="mt-1 text-sm font-black text-white">{asset.stationName}</div>
                <div className="mt-1 text-xs text-slate-400">
                  {asset.province || "-"} / {asset.district || "-"}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-slate-300">
                    Progress {asset.progress}%
                  </span>
                  <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-slate-300">
                    Incidents {incidents.length}
                  </span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {incidentFeatures
        .filter((feature) => feature.lat !== null && feature.lon !== null)
        .map((feature) => (
          <CircleMarker
            key={`incident-${feature.id}`}
            center={[feature.lat as number, feature.lon as number]}
            radius={feature.status === "breached" || feature.status === "active" ? 14 : 11}
            pathOptions={{
              color: STATUS_COLORS[feature.status],
              weight: 3,
              fillColor: STATUS_COLORS[feature.status],
              fillOpacity: 0.3,
              opacity: 0.95,
              dashArray: feature.status === "breached" ? "3 4" : undefined,
              className: "live-map-vector-marker",
            }}
            bubblingMouseEvents={false}
            eventHandlers={{ click: () => onSelectIncident(feature) }}
          >
            <Popup maxWidth={280}>
              <div className="min-w-[230px] py-1">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neon-magenta">
                  Incident {feature.incident.incident_no}
                </div>
                <div className="mt-1 text-sm font-black text-white">{feature.stationName}</div>
                <div className="mt-1 text-xs leading-relaxed text-slate-400">
                  {feature.incident.issue_description || "-"}
                </div>
                <div className="mt-3 flex gap-2 text-[10px] font-black uppercase tracking-wider">
                  <span className="rounded-md border border-neon-cyan/25 bg-neon-cyan/10 px-2 py-1 text-neon-cyan">
                    {feature.incident.priority}
                  </span>
                  <span className="rounded-md border border-neon-yellow/25 bg-neon-yellow/10 px-2 py-1 text-neon-yellow">
                    {feature.status}
                  </span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
    </MapContainer>
  );
}
