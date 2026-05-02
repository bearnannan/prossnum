import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export interface MissionControlData {
  stations: any[];
  clients: any[];
  isLoading: boolean;
  lastUpdate: Date | null;
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
        stations: stationsRes.data || [],
        clients: clientsRes.data || [],
        isLoading: false,
        lastUpdate: new Date(),
      });
    } catch (error) {
      console.error('Error fetching mission control data:', error);
      showToast('ไม่สามารถโหลดข้อมูล Tactical ได้', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();

    // Subscribe to all relevant tables
    const stationsChannel = supabase
      .channel('mission-control-stations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stations' }, (payload) => {
        setData(prev => ({
          ...prev,
          stations: payload.eventType === 'INSERT' 
            ? [...prev.stations, payload.new]
            : payload.eventType === 'DELETE'
              ? prev.stations.filter(s => s.id !== payload.old.id)
              : prev.stations.map(s => s.id === payload.new.id ? payload.new : s),
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
            ? [...prev.clients, payload.new]
            : payload.eventType === 'DELETE'
              ? prev.clients.filter(c => c.id !== payload.old.id)
              : prev.clients.map(c => c.id === payload.new.id ? payload.new : c),
          lastUpdate: new Date()
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(stationsChannel);
      supabase.removeChannel(clientsChannel);
    };
  }, [fetchData]);

  return data;
}
