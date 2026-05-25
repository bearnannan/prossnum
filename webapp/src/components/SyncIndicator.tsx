"use client";

import { useOfflineSync } from "@/hooks/useOfflineSync";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, CloudOff, RefreshCw, AlertCircle } from "lucide-react";

/**
 * A modern, glassmorphism-style indicator for status and offline data synchronization.
 */
export default function SyncIndicator() {
    const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync();

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100/10 dark:bg-zinc-800/40 backdrop-blur-md border border-zinc-200/20 dark:border-zinc-700/30 transition-all duration-300">
            {/* Connectivity Status Pillar */}
            <div className="flex items-center gap-2">
                {isOnline ? (
                    <div className="flex items-center gap-1.5" title="Online">
                        <div className="status-dot-pulse bg-neon-green shadow-[0_0_8px_rgba(0,255,136,0.6)]" />
                        <span className="hidden sm:inline text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            Online
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5" title="You are currently offline">
                        <CloudOff className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="hidden sm:inline text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            Offline
                        </span>
                    </div>
                )}
            </div>

            {/* Offline Queue Sync Section */}
            <AnimatePresence>
                {pendingCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: "auto" }}
                        exit={{ opacity: 0, x: 20, width: 0 }}
                        className="flex items-center gap-1.5 pl-2 border-l border-zinc-200 dark:border-zinc-700"
                    >
                        <button
                            onClick={() => triggerSync()}
                            disabled={isSyncing || !isOnline}
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-all ${
                                isSyncing 
                                    ? "bg-blue-500/10 text-blue-500" 
                                    : !isOnline 
                                        ? "text-amber-500/60" 
                                        : "hover:bg-zinc-200 dark:hover:bg-zinc-700 text-amber-500"
                            }`}
                        >
                            {isSyncing ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : !isOnline ? (
                                <AlertCircle className="w-3 h-3" />
                            ) : (
                                <Cloud className="w-3 h-3" />
                            )}
                            
                            <span className="text-[10px] font-bold whitespace-nowrap">
                                {isSyncing 
                                    ? "Syncing..." 
                                    : !isOnline 
                                        ? `${pendingCount} Local` 
                                        : `${pendingCount} Pending`}
                            </span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
