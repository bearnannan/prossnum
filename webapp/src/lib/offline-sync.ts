import { get, set } from "idb-keyval";

export interface OfflineMutation {
    id: string;
    method: "POST" | "PUT" | "DELETE";
    payload: any;
    timestamp: number;
    dataset: "station" | "client";
}

const STORAGE_KEY = "offline-mutations";

/**
 * Adds a mutation to the offline queue in IndexedDB.
 */
export async function addMutation(mutation: Omit<OfflineMutation, "id" | "timestamp">) {
    const queue: OfflineMutation[] = (await get(STORAGE_KEY)) || [];
    const newMutation: OfflineMutation = {
        ...mutation,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
    };
    queue.push(newMutation);
    await set(STORAGE_KEY, queue);
    return newMutation;
}

/**
 * Retrieves all pending mutations from the queue.
 */
export async function getQueue(): Promise<OfflineMutation[]> {
    return (await get(STORAGE_KEY)) || [];
}

/**
 * Retrieves pending mutations for a specific dataset.
 */
export async function getQueueForDataset(dataset: "station" | "client"): Promise<OfflineMutation[]> {
    const queue = await getQueue();
    return queue.filter(m => m.dataset === dataset);
}

/**
 * Processes the offline sync queue by sending each request to the server.
 */
export async function processSync() {
    if (typeof window === "undefined" || !navigator.onLine) {
        return { success: false, synced: 0, failed: 0 };
    }

    const queue: OfflineMutation[] = (await get(STORAGE_KEY)) || [];
    if (queue.length === 0) {
        return { success: true, synced: 0, failed: 0 };
    }

    const failedMutations: OfflineMutation[] = [];
    let syncedCount = 0;

    for (const mutation of queue) {
        try {
            const url = mutation.dataset === "client" ? "/api/dashboard-data?dataset=client" : "/api/dashboard-data";
            
            const response = await fetch(url, {
                method: mutation.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mutation.payload),
            });

            if (!response.ok) {
                throw new Error(`Sync failed for ${mutation.id}: ${response.statusText}`);
            }
            
            syncedCount++;
        } catch (error) {
            console.error("Sync error:", error);
            failedMutations.push(mutation);
        }
    }

    // Update queue with only failed items
    await set(STORAGE_KEY, failedMutations);

    return {
        success: failedMutations.length === 0,
        synced: syncedCount,
        failed: failedMutations.length,
    };
}

/**
 * Clears the offline mutation queue.
 */
export async function clearQueue() {
    await set(STORAGE_KEY, []);
}
