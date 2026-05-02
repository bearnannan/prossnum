import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSWRConfig } from 'swr';
import { useToast } from '@/components/Toast';

interface RealtimeOptions {
  table: string;
  dataset?: 'station' | 'client';
  onUpdate?: (payload: any) => void;
  enableToast?: boolean;
}

/**
 * useRealtime hook to subscribe to Supabase Postgres changes and trigger SWR revalidation.
 */
export function useRealtime({ table, dataset, onUpdate, enableToast = true }: RealtimeOptions) {
  const { mutate } = useSWRConfig();
  const { showToast } = useToast();

  useEffect(() => {
    if (!table) return;

    const channelName = `realtime-${table}-${dataset || 'default'}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table },
        (payload) => {
          // 1. Trigger the callback if provided
          if (onUpdate) {
            onUpdate(payload);
          }

          // 2. Determine which SWR key to mutate
          if (dataset) {
            mutate(`/api/dashboard-data?dataset=${dataset}`);
          } else {
            // Generic fallback - might want to mutate more specifically in the future
            mutate((key: any) => typeof key === 'string' && key.includes(table));
          }

          // 3. Show a toast notification if enabled
          if (enableToast) {
            const tableLabel = table === 'stations' ? 'สถานี' : table === 'client_systems' ? 'ระบบลูกข่าย' : 'ข้อมูล';
            const eventType = payload.eventType === 'INSERT' ? 'เพิ่ม' : payload.eventType === 'DELETE' ? 'ลบ' : 'แก้ไข';
            showToast(`${eventType}${tableLabel}ใหม่แล้ว`, 'info');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, dataset, mutate, showToast, onUpdate, enableToast]);
}
