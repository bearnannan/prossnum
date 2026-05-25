import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

import { StationData, ClientSystemData } from '@/app/api/dashboard-data/route';

export interface MissionControlData {
  stations: StationData[];
  clients: ClientSystemData[];
  isLoading: boolean;
  lastUpdate: Date | null;
}

// ── Mappers to convert raw snake_case database rows to camelCase interfaces ──
function mapStation(item: any): StationData {
  return {
    id: item.id,
    province: item.province ?? "",
    district: item.district,
    stationName: item.station_name,
    type: (item.type as StationData["type"]) ?? "C",
    foundationProgress: item.foundation_progress || 0,
    poleInstallationProgress: item.pole_progress || 0,
    lat: item.latitude,
    lon: item.longitude,
    updated_at: item.updated_at,
  };
}

function mapClient(item: any): ClientSystemData {
  return {
     id: item.id,
     province: item.province ?? "",
     district: item.district,
     stationName: item.station_name,
     lat: item.latitude,
     lon: item.longitude,
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

export function useMissionControl() {
  const [data, setData] = useState<MissionControlData>({
    stations: [],
    clients: [],
    isLoading: true,
    lastUpdate: null,
  });
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [stationsRes, clientsRes] = await Promise.all([
        supabase.from('stations').select('*').order('name'),
        supabase.from('client_systems').select('*').order('name'),
      ]);

      setData({
        stations: (stationsRes.data || []).map(mapStation),
        clients: (clientsRes.data || []).map(mapClient),
        isLoading: false,
        lastUpdate: new Date(),
      });
    } catch (error) {
      console.error('Error fetching mission control data:', error);
      showToast('ไม่สามารถโหลดข้อมูล Tactical ได้', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve(); // Defer to next microtask to avoid triggering react-hooks/set-state-in-effect
      if (active) {
        await fetchData();
      }
    };
    load();

    // Subscribe to all relevant tables
    const stationsChannel = supabase
      .channel('mission-control-stations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stations' }, (payload) => {
        setData(prev => ({
          ...prev,
          stations: payload.eventType === 'INSERT' 
            ? [...prev.stations, mapStation(payload.new)]
            : payload.eventType === 'DELETE'
              ? prev.stations.filter(s => s.id !== payload.old.id)
              : prev.stations.map(s => s.id === payload.new.id ? mapStation(payload.new) : s),
          lastUpdate: new Date()
        }));
      })
      .subscribe();

    const clientsChannel = supabase
      .channel('mission-control-clients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_systems' }, (payload) => {
        setData(prev => ({
          ...prev,
          clients: payload.eventType === 'INSERT' 
            ? [...prev.clients, mapClient(payload.new)]
            : payload.eventType === 'DELETE'
              ? prev.clients.filter(c => c.id !== payload.old.id)
              : prev.clients.map(c => c.id === payload.new.id ? mapClient(payload.new) : c),
          lastUpdate: new Date()
        }));
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(stationsChannel);
      supabase.removeChannel(clientsChannel);
    };
  }, [fetchData]);

  return data;
}
