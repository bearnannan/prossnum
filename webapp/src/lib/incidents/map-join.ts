import type { ClientSystemData, StationData } from "@/app/api/dashboard-data/route";
import type { IncidentPriority, IncidentRecord } from "@/lib/incidents/types";
import { COMPLETED_STATUS } from "@/lib/incidents/sla";

export type AssetLayer = "station" | "client";
export type IncidentMapStatus = "resolved" | "active" | "pending" | "breached" | "unmatched";

export interface LiveMapAsset {
  id: string;
  sourceId: string;
  layer: AssetLayer;
  stationName: string;
  province: string;
  district: string;
  lat: number;
  lon: number;
  progress: number;
  updatedAt?: string;
  incidents: IncidentRecord[];
}

export interface IncidentMapFeature {
  id: string;
  assetId: string | null;
  stationName: string;
  lat: number | null;
  lon: number | null;
  status: IncidentMapStatus;
  priority: IncidentPriority;
  incident: IncidentRecord;
}

function normalizeStationName(value?: string | null) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function numericCoordinate(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed !== 0 ? parsed : null;
}

function stationProgress(asset: StationData) {
  const foundation = Number(asset.foundationProgress) || 0;
  const pole = Number(asset.poleInstallationProgress) || 0;
  return Math.round((foundation + pole) / 2);
}

function clientProgress(asset: ClientSystemData) {
  const electric = Number(asset.electricProgress) || 0;
  const ground = Number(asset.groundProgress) || 0;
  const feeder = Number(asset.feederProgress) || 0;
  return Math.round((electric + ground + feeder) / 3);
}

function isBreached(incident: IncidentRecord, now = Date.now()) {
  if (!incident.sla_due_at || incident.repair_status === COMPLETED_STATUS) return false;
  const due = new Date(incident.sla_due_at).getTime();
  return Number.isFinite(due) && due < now;
}

export function getIncidentMapStatus(incident: IncidentRecord): IncidentMapStatus {
  if (incident.repair_status === COMPLETED_STATUS) return "resolved";
  if (isBreached(incident)) return "breached";
  return incident.priority === "critical" || incident.priority === "high" ? "active" : "pending";
}

export function buildLiveMapAssets(input: {
  stations: StationData[];
  clients: ClientSystemData[];
  incidents: IncidentRecord[];
}) {
  const assets: LiveMapAsset[] = [
    ...input.stations.map((asset): LiveMapAsset | null => {
      const lat = numericCoordinate(asset.lat);
      const lon = numericCoordinate(asset.lon);
      if (!asset.id || lat === null || lon === null) return null;
      return {
        id: `station:${asset.id}`,
        sourceId: asset.id,
        layer: "station",
        stationName: asset.stationName,
        province: asset.province || "",
        district: asset.district,
        lat,
        lon,
        progress: stationProgress(asset),
        updatedAt: asset.updated_at,
        incidents: [],
      };
    }),
    ...input.clients.map((asset): LiveMapAsset | null => {
      const lat = numericCoordinate(asset.lat);
      const lon = numericCoordinate(asset.lon);
      if (!asset.id || lat === null || lon === null) return null;
      return {
        id: `client:${asset.id}`,
        sourceId: asset.id,
        layer: "client",
        stationName: asset.stationName,
        province: asset.province || "",
        district: asset.district,
        lat,
        lon,
        progress: clientProgress(asset),
        updatedAt: asset.updated_at,
        incidents: [],
      };
    }),
  ].filter((asset): asset is LiveMapAsset => Boolean(asset));

  const assetByName = new Map<string, LiveMapAsset>();
  const assetByRef = new Map<string, LiveMapAsset>();
  for (const asset of assets) {
    const key = normalizeStationName(asset.stationName);
    if (key && !assetByName.has(key)) assetByName.set(key, asset);
    assetByRef.set(`${asset.layer}:${asset.sourceId}`, asset);
  }

  const incidentFeatures = input.incidents.map((incident): IncidentMapFeature => {
    const persistedLat = numericCoordinate(incident.latitude);
    const persistedLon = numericCoordinate(incident.longitude);
    const referencedAsset =
      incident.asset_type && incident.asset_id
        ? assetByRef.get(`${incident.asset_type}:${incident.asset_id}`)
        : undefined;
    const asset = referencedAsset || assetByName.get(normalizeStationName(incident.station));
    if (asset) asset.incidents.push(incident);
    const lat = persistedLat ?? asset?.lat ?? null;
    const lon = persistedLon ?? asset?.lon ?? null;
    return {
      id: incident.id,
      assetId: asset?.id || null,
      stationName: incident.asset_name || incident.station,
      lat,
      lon,
      status: lat !== null && lon !== null ? getIncidentMapStatus(incident) : "unmatched",
      priority: incident.priority || "medium",
      incident,
    };
  });

  return { assets, incidentFeatures };
}

export function sortIncidentsByOperationalRisk(incidents: IncidentRecord[]) {
  const priorityRank: Record<IncidentPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...incidents].sort((a, b) => {
    const statusDiff = Number(a.repair_status === COMPLETED_STATUS) - Number(b.repair_status === COMPLETED_STATUS);
    if (statusDiff !== 0) return statusDiff;
    const breachDiff = Number(isBreached(b)) - Number(isBreached(a));
    if (breachDiff !== 0) return breachDiff;
    const priorityDiff = priorityRank[a.priority || "medium"] - priorityRank[b.priority || "medium"];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.sla_due_at || a.reported_at).getTime() - new Date(b.sla_due_at || b.reported_at).getTime();
  });
}
