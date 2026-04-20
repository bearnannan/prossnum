"use client";

import { useState, useEffect, useCallback } from "react";
import { getQueue, processSync } from "@/lib/offline-sync";

/**
 * Hook to manage offline sync state and connectivity monitoring.
 */
export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    /**
     * Updates the count of pending mutations from IndexedDB.
     */
    const updateQueueStatus = useCallback(async () => {
        const queue = await getQueue();
        setPendingCount(queue.length);
    }, []);

    /**
     * Manually triggers the sync process.
     */
    const triggerSync = useCallback(async () => {
        // Only sync if online and not already syncing
        if (isSyncing || typeof window === "undefined" || !navigator.onLine) {
            return;
        }
        
        setIsSyncing(true);
        try {
            await processSync();
            await updateQueueStatus();
        } catch (error) {
            console.error("Manual sync error:", error);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, updateQueueStatus]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleOnline = () => {
            setIsOnline(true);
            triggerSync(); // Auto-sync when back online
        };
        
        const handleOffline = () => {
            setIsOnline(false);
        };

        // Event listeners for connectivity
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        
        // Polling status
        setIsOnline(navigator.onLine);
        updateQueueStatus();

        // Refresh count every 5 seconds in case of background updates
        const interval = setInterval(updateQueueStatus, 5000);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            clearInterval(interval);
        };
    }, [triggerSync, updateQueueStatus]);

    return {
        isOnline,
        pendingCount,
        isSyncing,
        triggerSync,
        updateQueueStatus,
    };
}
