"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import type { ClientSystemData, StationData } from "@/app/api/dashboard-data/route";
import type { IncidentRecord } from "@/lib/incidents/types";
import { buildLiveMapAssets, sortIncidentsByOperationalRisk } from "@/lib/incidents/map-join";

interface SupabaseStationRow {
  id: string;
  province: string | null;
  district: string;
  station_name: string;
  base_type: string | null;
  type: string | null;
  foundation_progress: number | null;
  pole_progress: number | null;
  latitude: number | null;
  longitude: number | null;
  pole_height: string | null;
  updated_at: string;
}

interface SupabaseClientRow {
  id: string;
  province: string | null;
  district: string;
  station_name: string;
  latitude: number | null;
  longitude: number | null;
  pole_height: string | null;
  electric_progress: number | null;
  electric_main: string | null;
  ground_progress: number | null;
  ground_ac: string | null;
  ground_equip: string | null;
  feeder_progress: number | null;
  yagi_no: string | null;
  sn: string | null;
  feed_distance: string | null;
  tower_progress: number | null;
  radio_progress: number | null;
  radio_sn: string | null;
  battery_sn: string | null;
  rssi: string | null;
  updated_at: string;
}

export type RealtimeState = "connecting" | "live" | "degraded";

function mapStation(item: SupabaseStationRow): StationData {
  return {
    id: item.id,
    province: item.province ?? "",
    district: item.district,
    stationName: item.station_name,
    baseType: (item.base_type as StationData["baseType"]) ?? undefined,
    type: (item.type as StationData["type"]) ?? "C",
    foundationProgress: item.foundation_progress || 0,
    poleInstallationProgress: item.pole_progress || 0,
    lat: item.latitude || 0,
    lon: item.longitude || 0,
    poleHeight: item.pole_height ?? undefined,
    updated_at: item.updated_at,
  };
}

function mapClient(item: SupabaseClientRow): ClientSystemData {
  return {
    id: item.id,
    province: item.province ?? "",
    district: item.district,
    stationName: item.station_name,
    lat: item.latitude || 0,
    lon: item.longitude || 0,
    poleHeight: item.pole_height || "",
    electricProgress: item.electric_progress || 0,
    electricMain: item.electric_main || "",
    groundProgress: item.ground_progress || 0,
    groundAC: item.ground_ac || "",
    groundEquip: item.ground_equip || "",
    feederProgress: item.feeder_progress || 0,
    yagiNo: item.yagi_no || "",
    sn: item.sn || "",
    feedDistance: item.feed_distance || "",
    towerProgress: item.tower_progress || 0,
    radioProgress: item.radio_progress || 0,
    radioSN: item.radio_sn || "",
    batterySN: item.battery_sn || "",
    rssi: item.rssi || "",
    updated_at: item.updated_at,
  };
}

export function useLiveOperationsMap() {
  const [stations, setStations] = useState<StationData[]>([]);
  const [clients, setClients] = useState<ClientSystemData[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [realtimeState, setRealtimeState] = useState<RealtimeState>("connecting");
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [stationsRes, clientsRes, incidentsRes] = await Promise.all([
        supabase.from("stations").select("*").order("station_name"),
        supabase.from("client_systems").select("*").order("station_name"),
        fetch("/api/incidents", { cache: "no-store" }),
      ]);

      if (stationsRes.error) throw stationsRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (!incidentsRes.ok) throw new Error("Failed to load live incidents");

      const incidentsJson = await incidentsRes.json();
      setStations(((stationsRes.data || []) as SupabaseStationRow[]).map(mapStation));
      setClients(((clientsRes.data || []) as SupabaseClientRow[]).map(mapClient));
      setIncidents((incidentsJson.data || []) as IncidentRecord[]);
      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      setRealtimeState("degraded");
      setIsLoading(false);
      showToast(error instanceof Error ? error.message : "Unable to load live operations map", "error");
    }
  }, [showToast]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (active) await fetchData();
    };
    refresh();

    const channel = supabase
      .channel("live-operations-map")
      .on("postgres_changes", { event: "*", schema: "public", table: "stations" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "client_systems" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, refresh)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeState("live");
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setRealtimeState("degraded");
        }
      });

    const fallback = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 60000);

    return () => {
      active = false;
      window.clearInterval(fallback);
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const joined = useMemo(
    () => buildLiveMapAssets({ stations, clients, incidents }),
    [clients, incidents, stations]
  );

  const riskSortedIncidents = useMemo(() => sortIncidentsByOperationalRisk(incidents), [incidents]);

  return {
    stations,
    clients,
    incidents,
    assets: joined.assets,
    incidentFeatures: joined.incidentFeatures,
    riskSortedIncidents,
    isLoading,
    lastUpdate,
    realtimeState,
    refresh: fetchData,
  };
}
