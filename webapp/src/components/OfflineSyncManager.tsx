"use client";

import { useEffect, useState } from "react";
import { get, set } from "idb-keyval";
import { useSWRConfig } from "swr";

export interface OfflineMutation {
    id: string;
    method: "POST" | "PUT" | "DELETE";
    payload: any;
    sheet?: string;
    timestamp: number;
}

export default function OfflineSyncManager() {
    const [isOffline, setIsOffline] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const { mutate } = useSWRConfig();

    useEffect(() => {
        const handleOnline = async () => {
            setIsOffline(false);
            setSyncing(true);

            try {
                const queue: OfflineMutation[] = (await get("offline-mutations")) || [];
                if (queue.length > 0) {
                    for (const mutation of queue) {
                        const url = mutation.sheet ? `/api/sheet-data?sheet=${mutation.sheet}` : "/api/sheet-data";
                        await fetch(url, {
                            method: mutation.method,
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(mutation.payload),
                        });
                    }
                    await set("offline-mutations", []);
                    await mutate("/api/sheet-data");
                    alert("Offline drafts have been successfully synced!");
                }
            } catch (err) {
                console.error("Failed to sync offline drafts:", err);
            } finally {
                setSyncing(false);
            }
        };

        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Initial check
        if (!navigator.onLine) {
            setIsOffline(true);
        } else {
            // Try to sync on mount if online
            handleOnline();
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [mutate]);

    if (!isOffline && !syncing) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 py-2.5 px-4 text-sm font-medium shadow-xl backdrop-blur-md">
            {!isOffline && syncing ? (
                <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Syncing offline data...
                </>
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                    Offline Mode
                </>
            )}
        </div>
    );
}
