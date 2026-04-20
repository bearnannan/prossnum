"use client";

import { motion } from "framer-motion";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface AuditLog {
  id: string;
  user_name: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  table_name: string;
  record_id: string;
  created_at: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ActivityFeed() {
  const { data: response, error, isLoading } = useSWR("/api/audit", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  const logs: AuditLog[] = response?.data || [];

  const getActionInfo = (action: AuditLog["action"], tableName: string) => {
    const tableLabel = tableName === "client_systems" ? "ระบบลูกข่าย" : "ข้อมูลสถานี";
    switch (action) {
      case "CREATE":
        return {
          icon: "add_circle",
          color: "text-emerald-500",
          bgColor: "bg-emerald-500/10",
          label: `เพิ่ม${tableLabel}ใหม่`,
        };
      case "UPDATE":
        return {
          icon: "edit_square",
          color: "text-amber-500",
          bgColor: "bg-amber-500/10",
          label: `แก้ไข${tableLabel}`,
        };
      case "DELETE":
        return {
          icon: "delete_sweep",
          color: "text-rose-500",
          bgColor: "bg-rose-500/10",
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
    <div className="glass-panel p-6 text-zinc-500 text-sm">
      ไม่สามารถโหลดข้อมูลความเคลื่อนไหวได้
    </div>
  );

  return (
    <div className="glass-panel-elevated overflow-hidden flex flex-col h-full animate-fade-in-up">
      <div className="p-5 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-zinc-400">history</span>
          <h3 className="font-bold text-sm tracking-tight">ความเคลื่อนไหวล่าสุด</h3>
        </div>
        {!isLoading && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 uppercase tracking-widest">
            LIVE
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 max-h-[400px]">
        {isLoading ? (
          <div className="space-y-4 p-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                <div className="flex-1 py-1 space-y-2">
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4" />
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-20">cloud_off</span>
            <p className="text-xs font-medium">ไม่มีข้อมูลความเคลื่อนไหว</p>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => {
              const info = getActionInfo(log.action, log.table_name);
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group flex gap-3 p-3 rounded-xl hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-all duration-200 cursor-default"
                >
                  <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${info.bgColor} ${info.color} shadow-sm border border-white/5`}>
                    <span className="material-symbols-outlined text-[20px]">{info.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate tracking-tight text-zinc-800 dark:text-zinc-200">
                      {info.label}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <span className="text-[11px] font-medium text-zinc-500 truncate">
                        โดย {log.user_name || "ผู้ไม่ระบุชื่อ"}
                      </span>
                      <span className="text-[10px] text-zinc-300 dark:text-zinc-600">•</span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter shrink-0">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: th })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-200/50 dark:border-zinc-800/50 text-center">
        <button className="text-[11px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
          ดูความเคลื่อนไหวทั้งหมด
        </button>
      </div>
    </div>
  );
}
