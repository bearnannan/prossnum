import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { useRealtime } from "@/hooks/useRealtime";

interface AuditLog {
  id: string;
  user_name: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  table_name: string;
  record_id: string;
  created_at: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ActivityFeed({ hideHeader = false, isTactical = false }: { hideHeader?: boolean, isTactical?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const { data: response, error, isLoading, mutate } = useSWR("/api/audit", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  // Enable real-time updates for audit logs
  useRealtime({ 
    table: 'audit_logs', 
    dataset: 'audit', 
    enableToast: false 
  });

  useEffect(() => {
    setMounted(() => true);
  }, []);

  const logs: AuditLog[] = response?.data || [];

  const getActionInfo = (action: AuditLog["action"], tableName: string) => {
    const tableLabel = tableName === "client_systems" ? "ระบบลูกข่าย" : "ข้อมูลสถานี";
    switch (action) {
      case "CREATE":
        return {
          icon: "add_circle",
          color: isTactical ? "text-emerald-400" : "text-emerald-500",
          bgColor: isTactical ? "bg-emerald-400/10" : "bg-emerald-500/10",
          label: `เพิ่ม${tableLabel}ใหม่`,
        };
      case "UPDATE":
        return {
          icon: "edit_square",
          color: isTactical ? "text-amber-400" : "text-amber-500",
          bgColor: isTactical ? "bg-amber-400/10" : "bg-amber-500/10",
          label: `แก้ไข${tableLabel}`,
        };
      case "DELETE":
        return {
          icon: "delete_sweep",
          color: isTactical ? "text-rose-400" : "text-rose-500",
          bgColor: isTactical ? "bg-rose-400/10" : "bg-rose-500/10",
          label: `ลบ${tableLabel}`,
        };
      default:
        return {
          icon: "info",
          color: "text-zinc-500",
          bgColor: "bg-zinc-500/10",
          label: "ความเคลื่อนไหว",
        };
    }
  };

  if (error) return (
    <div className={`glass-panel p-6 text-zinc-500 text-sm text-center ${isTactical ? 'bg-zinc-900/50 border-zinc-800' : ''}`}>
      <span className="material-symbols-outlined text-rose-500/50 mb-2">error</span>
      <p>ไม่สามารถโหลดข้อมูลความเคลื่อนไหวได้</p>
    </div>
  );

  if (!mounted) return null;

  return (
    <div className={`${isTactical ? 'bg-transparent' : 'glass-panel-elevated'} overflow-hidden flex flex-col h-full border-zinc-200/50 dark:border-white/5`}>
      {!hideHeader && (
        <div className="p-5 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between bg-zinc-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500">history</span>
            <h3 className="font-bold text-sm tracking-tight">ความเคลื่อนไหวล่าสุด</h3>
          </div>
          {!isLoading && (
            <div className="flex items-center gap-2">
              <motion.span 
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
              />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                LIVE
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {isLoading ? (
          <div className="space-y-4 p-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                <div className="flex-1 py-1 space-y-2">
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4" />
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isTactical ? 'bg-zinc-800/50' : 'bg-zinc-100 dark:bg-zinc-800/50'}`}>
              <span className="material-symbols-outlined text-2xl opacity-20">cloud_off</span>
            </div>
            <p className="text-xs font-medium">ยังไม่มีข้อมูลความเคลื่อนไหวในขณะนี้</p>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {logs.map((log) => {
                const info = getActionInfo(log.action, log.table_name);
                return (
                  <motion.div
                    key={log.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`group flex gap-3 p-3 rounded-xl transition-all duration-300 border border-transparent cursor-default relative overflow-hidden ${
                      isTactical 
                        ? 'hover:bg-white/[0.03] hover:border-white/10' 
                        : 'hover:bg-white dark:hover:bg-white/[0.03] hover:border-zinc-200/50 dark:hover:border-white/5'
                    }`}
                  >
                    <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${info.bgColor} ${info.color} shadow-sm border border-white/5 z-10`}>
                      <span className="material-symbols-outlined text-[20px]">{info.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0 z-10">
                      <p className={`text-[13px] font-bold truncate tracking-tight ${isTactical ? 'text-zinc-200' : 'text-zinc-800 dark:text-zinc-200'}`}>
                        {info.label}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                         <span className={`text-[11px] font-medium truncate ${isTactical ? 'text-zinc-500' : 'text-zinc-500'}`}>
                          โดย {log.user_name || "ผู้ไม่ระบุชื่อ"}
                         </span>
                        <span className={`text-[10px] ${isTactical ? 'text-zinc-700' : 'text-zinc-300 dark:text-zinc-600'}`}>•</span>
                        <span className={`text-[10px] font-bold uppercase tracking-tighter shrink-0 ${isTactical ? 'text-zinc-600' : 'text-zinc-400'}`}>
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: th })}
                        </span>
                      </div>
                    </div>
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {!isTactical && (
        <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-200/50 dark:border-zinc-800/50 text-center">
          <button className="px-4 py-1.5 rounded-lg text-[11px] font-bold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-zinc-200/50 dark:hover:border-white/5 transition-all duration-300">
            ดูประวัติทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
}

