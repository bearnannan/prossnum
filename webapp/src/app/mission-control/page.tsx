"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import LineBotSettingsModal from "@/components/LineBotSettingsModal";
import { useExport } from "@/hooks/useExport";
import { ExportModal } from "@/components/ExportModal";
import TacticalHudLoader from "@/components/loading-ui/TacticalHudLoader";
import { useLiveOperationsMap } from "@/hooks/useLiveOperationsMap";
import {
  incidentToOperationForm,
  initialIncidentForm,
  liveAssetToFormPatch,
  REPAIR_STATUSES,
  useIncidentOperations,
  type IncidentOperationForm,
} from "@/hooks/useIncidentOperations";
import { IncidentCreateDrawer } from "@/components/mission-control/IncidentCreateDrawer";
import { IncidentOperationFormFields } from "@/components/mission-control/IncidentOperationForm";
import type { AssetLayer, IncidentMapFeature, IncidentMapStatus, LiveMapAsset } from "@/lib/incidents/map-join";
import { COMPLETED_STATUS } from "@/lib/incidents/sla";
import type { IncidentRecord, RepairStatus } from "@/lib/incidents/types";

const LiveOperationsMap = dynamic(() => import("@/components/live-map/LiveOperationsMap"), {
  ssr: false,
  loading: () => (
    <TacticalHudLoader
      label="LOADING LIVE COORDINATES"
      sublabel="Initializing OpenStreetMap link"
    />
  ),
});

type StatusFilter = "all" | IncidentMapStatus;
type IncidentHealthStatus = "loading" | "success" | "degraded";

const STATUS_FILTERS: StatusFilter[] = ["all", "breached", "active", "pending", "resolved", "unmatched"];

function formatClock(value: Date | null) {
  if (!value) return "--:--:--";
  return value.toLocaleTimeString("th-TH", { hour12: false, timeZone: "Asia/Bangkok" });
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });
}

function statusForIncident(incident: IncidentRecord): IncidentMapStatus {
  if (incident.repair_status === COMPLETED_STATUS) return "resolved";
  if (incident.sla_due_at && new Date(incident.sla_due_at).getTime() < Date.now()) return "breached";
  return incident.priority === "critical" || incident.priority === "high" ? "active" : "pending";
}

function statusColor(status: StatusFilter) {
  return {
    all: "#00f0ff",
    breached: "#ff00a0",
    active: "#f0e800",
    pending: "#6b7280",
    resolved: "#00ff88",
    unmatched: "#ff7b00",
  }[status];
}

function priorityColor(priority?: string) {
  return {
    critical: "text-neon-magenta border-neon-magenta/30 bg-neon-magenta/10",
    high: "text-neon-orange border-neon-orange/30 bg-neon-orange/10",
    medium: "text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10",
    low: "text-slate-400 border-slate-500/20 bg-slate-500/10",
  }[priority || "medium"];
}

function MissionControlContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    assets,
    incidentFeatures,
    riskSortedIncidents,
    isLoading,
    lastUpdate,
    realtimeState,
    refresh,
  } = useLiveOperationsMap();

  const [layerFilter, setLayerFilter] = useState<AssetLayer | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<LiveMapAsset | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentMapFeature | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"filters" | "queue" | "inspector">("queue");
  const [healthStatus, setHealthStatus] = useState<IncidentHealthStatus>("loading");
  const [isLineSettingsOpen, setIsLineSettingsOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [createForm, setCreateForm] = useState<IncidentOperationForm>(initialIncidentForm);
  const [editingIncidentId, setEditingIncidentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<IncidentOperationForm>(initialIncidentForm);

  const {
    isExportModalOpen,
    setIsExportModalOpen,
    exportType,
    setExportType,
    selectedExportStations,
    setSelectedExportStations,
    expandedDistricts,
    setExpandedDistricts,
    handleExportTXT,
    handleExportPDF,
    handleExportJPEG,
    handleExportCSV,
  } = useExport();

  const incidentDistricts = useMemo(() => {
    const set = new Set<string>();
    riskSortedIncidents.forEach(i => {
      set.add(i.district || "ไม่ระบุ");
    });
    return Array.from(set).sort();
  }, [riskSortedIncidents]);

  const normalizedIncidents = useMemo(() => {
    return riskSortedIncidents.map(i => ({
      ...i,
      district: i.district || "ไม่ระบุ",
      province: i.province || "กาญจนบุรี",
    }));
  }, [riskSortedIncidents]);

  const openExport = () => {
    const allKeys = normalizedIncidents.map(i => `${i.district}|${i.station || ""}`);
    setSelectedExportStations(allKeys);
    const allDistricts = Array.from(new Set(normalizedIncidents.map(i => i.district)));
    setExpandedDistricts(allDistricts);
    setIsExportModalOpen(true);
  };
  const actionParam = searchParams.get("action");
  const incidentParam = searchParams.get("incident");
  const {
    currentUser,
    assetOptions,
    isPending,
    createIncident,
    updateIncident,
    updateIncidentStatus,
    retryIncidentNotification,
  } = useIncidentOperations(refresh);

  useEffect(() => {
    let active = true;
    const loadHealth = async () => {
      try {
        const res = await fetch("/api/incidents/health", { cache: "no-store" });
        const json = await res.json();
        if (active) setHealthStatus(json.status === "success" ? "success" : "degraded");
      } catch {
        if (active) setHealthStatus("degraded");
      }
    };
    loadHealth();
    const interval = window.setInterval(loadHealth, 60000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return assets.filter((asset) => {
      if (layerFilter !== "all" && asset.layer !== layerFilter) return false;
      if (normalizedQuery) {
        const haystack = `${asset.stationName} ${asset.province} ${asset.district}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      if (statusFilter === "all") return true;
      return asset.incidents.some((incident) => statusForIncident(incident) === statusFilter);
    });
  }, [assets, layerFilter, query, statusFilter]);

  const filteredIncidentFeatures = useMemo(() => {
    const assetIds = new Set(filteredAssets.map((asset) => asset.id));
    return incidentFeatures.filter((feature) => {
      if (statusFilter !== "all" && feature.status !== statusFilter) return false;
      if (!feature.assetId) return statusFilter === "all" || statusFilter === "unmatched";
      return assetIds.has(feature.assetId);
    });
  }, [filteredAssets, incidentFeatures, statusFilter]);

  const queue = useMemo(() => {
    const visibleFeatureIds = new Set(filteredIncidentFeatures.map((feature) => feature.id));
    return riskSortedIncidents.filter((incident) => visibleFeatureIds.has(incident.id));
  }, [filteredIncidentFeatures, riskSortedIncidents]);

  const metrics = useMemo(() => {
    const open = incidentFeatures.filter((feature) => feature.status !== "resolved").length;
    const breached = incidentFeatures.filter((feature) => feature.status === "breached").length;
    const unmatched = incidentFeatures.filter((feature) => feature.status === "unmatched").length;
    const activeAssets = assets.filter((asset) => asset.incidents.some((incident) => incident.repair_status !== COMPLETED_STATUS)).length;
    return { assets: assets.length, open, breached, unmatched, activeAssets };
  }, [assets, incidentFeatures]);

  const handleSelectIncident = (feature: IncidentMapFeature) => {
    setSelectedIncident(feature);
    const asset = feature.assetId ? assets.find((item) => item.id === feature.assetId) || null : null;
    setSelectedAsset(asset);
    setMobilePanel("inspector");
    router.replace(`/mission-control?incident=${feature.id}`, { scroll: false });
  };

  const handleSelectAsset = (asset: LiveMapAsset) => {
    setSelectedAsset(asset);
    setSelectedIncident(null);
    setMobilePanel("inspector");
    setEditingIncidentId(null);
    router.replace("/mission-control", { scroll: false });
  };

  const openCreateDrawer = (asset?: LiveMapAsset | null) => {
    setCreateForm({
      ...initialIncidentForm,
      reporter: currentUser,
      ...(asset ? liveAssetToFormPatch(asset) : {}),
    });
    setIsCreateDrawerOpen(true);
    router.replace("/mission-control?action=new", { scroll: false });
  };

  const closeCreateDrawer = () => {
    setIsCreateDrawerOpen(false);
    if (actionParam === "new") router.replace("/mission-control", { scroll: false });
  };

  const closeInspector = () => {
    setSelectedAsset(null);
    setSelectedIncident(null);
    setEditingIncidentId(null);
    router.replace("/mission-control", { scroll: false });
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (actionParam === "new") {
        setCreateForm((current) => ({
          ...current,
          reporter: current.reporter || currentUser,
          ...(selectedAsset ? liveAssetToFormPatch(selectedAsset) : {}),
        }));
        setIsCreateDrawerOpen(true);
      }

      if (!incidentParam) return;
      const feature = incidentFeatures.find((item) => item.id === incidentParam);
      if (feature) {
        setSelectedIncident(feature);
        setSelectedAsset(feature.assetId ? assets.find((item) => item.id === feature.assetId) || null : null);
        setMobilePanel("inspector");
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [actionParam, assets, currentUser, incidentFeatures, incidentParam, selectedAsset]);

  return (
    <div className="dark h-screen overflow-hidden bg-dark-base text-slate-200 bg-grid relative">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-[18%] top-[-18%] h-96 w-96 rounded-full bg-neon-cyan/5 blur-[120px]" />
        <div className="absolute bottom-[-18%] right-[16%] h-96 w-96 rounded-full bg-neon-magenta/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,15,0.72)_100%)]" />
      </div>

      <header className="relative z-40 flex min-h-12 items-center justify-between gap-2 border-b border-neon-cyan/10 bg-dark-base/84 px-2 py-1.5 backdrop-blur-2xl sm:h-11 sm:px-3 sm:py-0 md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neon-cyan/30 bg-neon-cyan/10 shadow-[0_0_12px_rgba(0,240,255,0.16)] transition-colors group-hover:border-neon-cyan/60 sm:h-7 sm:w-7">
              <span className="material-symbols-outlined text-[17px] text-neon-cyan">satellite_alt</span>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[10px] font-extrabold uppercase tracking-[0.12em] text-white sm:text-[11px] sm:tracking-[0.16em]">ProssNum</h1>
              <div className="truncate text-[7px] font-black uppercase tracking-[0.14em] text-neon-cyan sm:text-[8px] sm:tracking-[0.18em]">Live OSM Command</div>
            </div>
          </Link>
          <div className="hidden h-6 w-px bg-neon-cyan/10 md:block" />
          <div className="hidden items-center gap-1.5 rounded-md border border-white/10 bg-dark-surface/55 px-2 py-1 md:flex">
            <span className={`h-1.5 w-1.5 rounded-full ${realtimeState === "live" ? "bg-neon-green" : realtimeState === "connecting" ? "bg-neon-yellow" : "bg-neon-magenta"} shadow-[0_0_8px_currentColor]`} />
            <span className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
              {realtimeState === "live" ? "Realtime Online" : realtimeState === "connecting" ? "Connecting" : "Realtime Degraded"}
            </span>
          </div>
          <div className="hidden items-center gap-1.5 rounded-md border border-white/10 bg-dark-surface/55 px-2 py-1 lg:flex">
            <span className={`h-1.5 w-1.5 rounded-full ${healthStatus === "success" ? "bg-neon-green" : healthStatus === "loading" ? "bg-neon-yellow" : "bg-neon-magenta"} shadow-[0_0_8px_currentColor]`} />
            <span className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
              Notify {healthStatus === "success" ? "Healthy" : healthStatus === "loading" ? "Checking" : "Degraded"}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <div className="hidden text-right font-mono text-[8px] uppercase tracking-[0.12em] text-slate-500 sm:block">
            SYNC {formatClock(lastUpdate)}
          </div>
          <button
            type="button"
            onClick={() => openCreateDrawer(selectedAsset)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-neon-magenta/25 bg-neon-magenta/10 text-[8px] font-black uppercase tracking-[0.12em] text-neon-magenta transition-all duration-200 hover:border-neon-magenta/50 hover:bg-neon-magenta/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-magenta/50 sm:h-auto sm:w-auto sm:px-2 sm:py-1.5"
            aria-label="New incident"
            title="New Incident"
          >
            <span className="material-symbols-outlined text-[16px] sm:hidden">add_alert</span>
            <span className="hidden sm:inline">New Incident</span>
          </button>
          <button
            type="button"
            onClick={() => setIsLineSettingsOpen(true)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-neon-yellow/25 bg-neon-yellow/10 text-[8px] font-black uppercase tracking-[0.12em] text-neon-yellow transition-all duration-200 hover:border-neon-yellow/50 hover:bg-neon-yellow/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-yellow/50 sm:h-auto sm:w-auto sm:px-2 sm:py-1.5"
            aria-label="LINE settings"
            title="LINE Settings"
          >
            <span className="material-symbols-outlined text-[16px] sm:hidden">settings</span>
            <span className="hidden sm:inline">LINE Settings</span>
          </button>
          <button
            type="button"
            onClick={openExport}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-neon-cyan/25 bg-neon-cyan/10 text-[8px] font-black uppercase tracking-[0.12em] text-neon-cyan transition-all duration-200 hover:border-neon-cyan/50 hover:bg-neon-cyan/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/50 sm:h-auto sm:w-auto sm:px-2 sm:py-1.5"
            aria-label="Export"
            title="Export"
          >
            <span className="material-symbols-outlined text-[16px] sm:hidden">ios_share</span>
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            type="button"
            onClick={refresh}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-neon-cyan/25 bg-neon-cyan/10 text-[8px] font-black uppercase tracking-[0.12em] text-neon-cyan transition-all duration-200 hover:border-neon-cyan/50 hover:bg-neon-cyan/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/50 sm:h-auto sm:w-auto sm:px-2 sm:py-1.5"
            aria-label="Refresh"
            title="Refresh"
          >
            <span className="material-symbols-outlined text-[16px] sm:hidden">refresh</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 h-[calc(100vh-3rem)] sm:h-[calc(100vh-2.75rem)]">
        <section className="absolute inset-0">
          <LiveOperationsMap
            assets={filteredAssets}
            incidentFeatures={filteredIncidentFeatures}
            selectedAssetId={selectedAsset?.id || null}
            onSelectAsset={handleSelectAsset}
            onSelectIncident={handleSelectIncident}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,15,.18),transparent_22%,transparent_72%,rgba(10,10,15,.68))]" />
          <motion.div
            className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-neon-cyan/20 shadow-[0_0_20px_rgba(0,240,255,0.22)]"
            animate={{ y: ["0vh", "100vh"] }}
            transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          />
        </section>

        <section className="mission-mobile-metrics pointer-events-none absolute left-2 right-2 top-2 z-30 flex gap-1.5 overflow-x-auto pb-1 md:left-3 md:right-3 md:grid md:grid-cols-5 md:overflow-visible md:pb-0">
          <HudMetric label="Assets" value={metrics.assets} tone="cyan" />
          <HudMetric label="Open Incidents" value={metrics.open} tone="yellow" />
          <HudMetric label="SLA Breach" value={metrics.breached} tone="magenta" />
          <HudMetric label="Active Sites" value={metrics.activeAssets} tone="purple" />
          <HudMetric label="No Coordinates" value={metrics.unmatched} tone="orange" />
        </section>

        <aside className="pointer-events-none absolute bottom-2 left-2 top-[42px] z-30 hidden w-[260px] flex-col gap-2 xl:flex">
          <FiltersPanel
            layerFilter={layerFilter}
            statusFilter={statusFilter}
            query={query}
            onLayerChange={setLayerFilter}
            onStatusChange={setStatusFilter}
            onQueryChange={setQuery}
          />
          <QueuePanel
            incidents={queue}
            isPending={isPending}
            onRetryNotification={retryIncidentNotification}
            onUpdateStatus={updateIncidentStatus}
            onSelectIncident={(incident) => {
              const feature = incidentFeatures.find((item) => item.id === incident.id);
              if (feature) handleSelectIncident(feature);
            }}
          />
        </aside>

        <aside className="pointer-events-none absolute bottom-2 right-2 top-[42px] z-30 hidden w-[300px] xl:block">
          <InspectorPanel
            asset={selectedAsset}
            incident={selectedIncident?.incident || null}
            assetOptions={assetOptions}
            editForm={editForm}
            editingIncidentId={editingIncidentId}
            isPending={isPending}
            onClose={closeInspector}
            onCreateForAsset={() => openCreateDrawer(selectedAsset)}
            onEditFormChange={setEditForm}
            onRetryNotification={retryIncidentNotification}
            onSaveIncident={(incident) => updateIncident(incident.id, editForm, () => setEditingIncidentId(null))}
            onStartEdit={(incident) => {
              setEditingIncidentId(incident.id);
              setEditForm(incidentToOperationForm(incident));
            }}
            onCancelEdit={() => setEditingIncidentId(null)}
            onUpdateStatus={updateIncidentStatus}
          />
        </aside>

        <section className="absolute inset-x-2 bottom-2 z-40 xl:hidden sm:inset-x-3 sm:bottom-3">
          <div className="mb-1.5 grid grid-cols-3 gap-1.5 sm:mb-2 sm:gap-2">
            {(["filters", "queue", "inspector"] as const).map((panel) => (
              <button
                key={panel}
                type="button"
                onClick={() => setMobilePanel(panel)}
                className={`cursor-pointer rounded-lg border px-2 py-2 text-[9px] font-black uppercase tracking-[0.14em] transition-all duration-200 sm:px-3 sm:text-[10px] ${
                  mobilePanel === panel
                    ? "border-neon-cyan/50 bg-neon-cyan/15 text-neon-cyan shadow-[0_0_14px_rgba(0,240,255,0.14)]"
                    : "border-white/10 bg-dark-surface/80 text-slate-400"
                }`}
              >
                {panel}
              </button>
            ))}
          </div>
          <div className="pointer-events-auto max-h-[36svh] overflow-y-auto overflow-x-hidden rounded-lg border border-neon-cyan/15 bg-dark-surface/90 p-2.5 shadow-card backdrop-blur-2xl sm:max-h-[46vh] sm:p-3">
            {mobilePanel === "filters" && (
              <FiltersPanel
                layerFilter={layerFilter}
                statusFilter={statusFilter}
                query={query}
                onLayerChange={setLayerFilter}
                onStatusChange={setStatusFilter}
                onQueryChange={setQuery}
              />
            )}
            {mobilePanel === "queue" && (
              <QueuePanel
                incidents={queue}
                isPending={isPending}
                onRetryNotification={retryIncidentNotification}
                onUpdateStatus={updateIncidentStatus}
                onSelectIncident={(incident) => {
                  const feature = incidentFeatures.find((item) => item.id === incident.id);
                  if (feature) handleSelectIncident(feature);
                }}
              />
            )}
            {mobilePanel === "inspector" && (
              <InspectorPanel
                asset={selectedAsset}
                incident={selectedIncident?.incident || null}
                assetOptions={assetOptions}
                editForm={editForm}
                editingIncidentId={editingIncidentId}
                isPending={isPending}
                onClose={closeInspector}
                onCreateForAsset={() => openCreateDrawer(selectedAsset)}
                onEditFormChange={setEditForm}
                onRetryNotification={retryIncidentNotification}
                onSaveIncident={(incident) => updateIncident(incident.id, editForm, () => setEditingIncidentId(null))}
                onStartEdit={(incident) => {
                  setEditingIncidentId(incident.id);
                  setEditForm(incidentToOperationForm(incident));
                }}
                onCancelEdit={() => setEditingIncidentId(null)}
                onUpdateStatus={updateIncidentStatus}
              />
            )}
          </div>
        </section>

        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-dark-base/72 backdrop-blur-sm">
            <div className="rounded-lg border border-neon-cyan/25 bg-dark-surface/90 px-5 py-4 text-center shadow-[0_0_24px_rgba(0,240,255,0.12)]">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-neon-cyan">Loading Live Coordinates</div>
              <div className="mt-2 h-1 w-56 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/3 animate-indeterminate-shimmer bg-neon-cyan shadow-[0_0_12px_rgba(0,240,255,0.45)]" />
              </div>
            </div>
          </div>
        )}
      </main>
      <LineBotSettingsModal isOpen={isLineSettingsOpen} onClose={() => setIsLineSettingsOpen(false)} />
      <ExportModal
        isExportModalOpen={isExportModalOpen}
        setIsExportModalOpen={setIsExportModalOpen}
        exportType={exportType}
        setExportType={setExportType}
        selectedExportStations={selectedExportStations}
        setSelectedExportStations={setSelectedExportStations}
        expandedDistricts={expandedDistricts}
        setExpandedDistricts={setExpandedDistricts}
        districts={incidentDistricts}
        data={normalizedIncidents}
        activeCategory="incident"
        handleExportTXT={handleExportTXT}
        handleExportJPEG={handleExportJPEG}
        handleExportPDF={handleExportPDF}
        handleExportCSV={handleExportCSV}
      />
      <IncidentCreateDrawer
        open={isCreateDrawerOpen}
        form={createForm}
        assetOptions={assetOptions}
        isPending={isPending}
        onChange={setCreateForm}
        onClose={closeCreateDrawer}
        onSubmit={() =>
          createIncident(createForm, () => {
            setCreateForm({ ...initialIncidentForm, reporter: currentUser });
            closeCreateDrawer();
          })
        }
      />
    </div>
  );
}

function HudMetric({ label, value, tone }: { label: string; value: number; tone: "cyan" | "yellow" | "magenta" | "purple" | "orange" }) {
  const colors = {
    cyan: "border-neon-cyan/20 text-neon-cyan shadow-[0_0_18px_rgba(0,240,255,0.08)]",
    yellow: "border-neon-yellow/20 text-neon-yellow shadow-[0_0_18px_rgba(240,232,0,0.08)]",
    magenta: "border-neon-magenta/20 text-neon-magenta shadow-[0_0_18px_rgba(255,0,160,0.08)]",
    purple: "border-neon-purple/20 text-neon-purple shadow-[0_0_18px_rgba(184,41,221,0.08)]",
    orange: "border-neon-orange/20 text-neon-orange shadow-[0_0_18px_rgba(255,123,0,0.08)]",
  }[tone];

  return (
    <div className={`pointer-events-auto min-w-[112px] shrink-0 rounded-md border bg-dark-surface/84 px-2 py-1.5 backdrop-blur-2xl md:min-w-0 md:px-2.5 ${colors}`}>
      <div className="truncate text-[6.5px] font-black uppercase tracking-[0.12em] text-slate-500 md:text-[7px] md:tracking-[0.14em]">{label}</div>
      <div className="mt-0.5 text-xs font-black leading-none text-white md:text-sm">{value}</div>
    </div>
  );
}

function FiltersPanel({
  layerFilter,
  statusFilter,
  query,
  onLayerChange,
  onStatusChange,
  onQueryChange,
}: {
  layerFilter: AssetLayer | "all";
  statusFilter: StatusFilter;
  query: string;
  onLayerChange: (value: AssetLayer | "all") => void;
  onStatusChange: (value: StatusFilter) => void;
  onQueryChange: (value: string) => void;
}) {
  return (
    <div className="pointer-events-auto rounded-md border border-neon-cyan/15 bg-dark-surface/82 p-2.5 shadow-card backdrop-blur-2xl geo-corner">
      <PanelTitle icon="tune" title="Live Filters" subtitle="Coordinate and incident layers" />
      <div className="mt-2 space-y-2.5">
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="neon-input py-1.5 text-[10px]"
          placeholder="Search station, province, district"
        />
        <div>
          <div className="mb-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">Asset Layer</div>
          <div className="grid grid-cols-3 gap-1.5">
            {(["all", "station", "client"] as const).map((layer) => (
              <FilterButton key={layer} active={layerFilter === layer} onClick={() => onLayerChange(layer)}>
                {layer}
              </FilterButton>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">Incident State</div>
          <div className="grid grid-cols-2 gap-1.5">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onStatusChange(status)}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/40 ${
                  statusFilter === status ? "bg-white/[0.04]" : "bg-dark-base/50 hover:bg-white/[0.03]"
                }`}
                style={{
                  color: statusColor(status),
                  borderColor: statusFilter === status ? `${statusColor(status)}66` : "rgba(255,255,255,.08)",
                  boxShadow: statusFilter === status ? `0 0 12px ${statusColor(status)}22` : "none",
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QueuePanel({
  incidents,
  isPending,
  onRetryNotification,
  onSelectIncident,
  onUpdateStatus,
}: {
  incidents: IncidentRecord[];
  isPending: boolean;
  onRetryNotification: (id: string) => void;
  onSelectIncident: (incident: IncidentRecord) => void;
  onUpdateStatus: (id: string, status: RepairStatus) => void;
}) {
  return (
    <div className="pointer-events-auto min-h-0 flex-1 rounded-md border border-neon-magenta/15 bg-dark-surface/82 p-2.5 shadow-card backdrop-blur-2xl">
      <PanelTitle icon="receipt_long" title="Incident Queue" subtitle={`${incidents.length} visible records`} />
      <div className="mission-queue-scroll mt-2 max-h-[min(42vh,520px)] space-y-1.5 overflow-y-auto overflow-x-hidden pr-1.5">
        {incidents.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-dark-base/50 p-3 text-center text-[10px] text-slate-500">
            No incidents match the current map filters.
          </div>
        ) : (
          incidents.map((incident) => {
            const status = statusForIncident(incident);
            return (
              <div
                key={incident.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectIncident(incident)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectIncident(incident);
                  }
                }}
                className="w-full cursor-pointer rounded-md border border-white/10 bg-dark-base/55 p-2 text-left transition-all duration-200 hover:border-neon-cyan/35 hover:bg-neon-cyan/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[10px] font-black text-white">{incident.incident_no}</div>
                    <div className="mt-0.5 truncate text-[9px] font-semibold text-slate-400">{incident.station || "-"}</div>
                  </div>
                  <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider ${priorityColor(incident.priority)}`}>
                    {incident.priority}
                  </span>
                </div>
                <div className="mt-1.5 line-clamp-2 text-[9px] leading-relaxed text-slate-500">{incident.issue_description || "-"}</div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[8px] font-black uppercase tracking-[0.1em]">
                  <span style={{ color: statusColor(status) }}>{status}</span>
                  <span className="text-slate-600">Due {formatDateTime(incident.sla_due_at)}</span>
                </div>
                <div
                  className="mt-2 grid grid-cols-[1fr_auto] gap-1.5 border-t border-white/5 pt-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  <select
                    value={incident.repair_status}
                    onChange={(event) => onUpdateStatus(incident.id, event.target.value as RepairStatus)}
                    disabled={isPending || incident.repair_status === COMPLETED_STATUS}
                    className="neon-input min-h-7 rounded-md px-2 py-1 text-[9px]"
                    aria-label={`Update status for ${incident.incident_no}`}
                  >
                    {REPAIR_STATUSES.map((repairStatus) => (
                      <option key={repairStatus} value={repairStatus}>
                        {repairStatus}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => onRetryNotification(incident.id)}
                    disabled={isPending}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-neon-yellow/25 bg-neon-yellow/10 text-neon-yellow transition-all duration-200 hover:border-neon-yellow/50 hover:bg-neon-yellow/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-yellow/40 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Retry LINE notification for ${incident.incident_no}`}
                    title="Retry LINE"
                  >
                    <span className="material-symbols-outlined text-[17px]">sync</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function InspectorPanel({
  asset,
  incident,
  assetOptions,
  editForm,
  editingIncidentId,
  isPending,
  onClose,
  onCreateForAsset,
  onEditFormChange,
  onRetryNotification,
  onSaveIncident,
  onStartEdit,
  onCancelEdit,
  onUpdateStatus,
}: {
  asset: LiveMapAsset | null;
  incident: IncidentRecord | null;
  assetOptions: ReturnType<typeof useIncidentOperations>["assetOptions"];
  editForm: IncidentOperationForm;
  editingIncidentId: string | null;
  isPending: boolean;
  onClose: () => void;
  onCreateForAsset: () => void;
  onEditFormChange: (form: IncidentOperationForm) => void;
  onRetryNotification: (id: string) => void;
  onSaveIncident: (incident: IncidentRecord) => void;
  onStartEdit: (incident: IncidentRecord) => void;
  onCancelEdit: () => void;
  onUpdateStatus: (id: string, status: RepairStatus) => void;
}) {
  const isEditing = Boolean(incident && editingIncidentId === incident.id);
  const isLocked = incident?.repair_status === COMPLETED_STATUS;

  return (
    <div className="pointer-events-auto h-full overflow-auto rounded-md border border-neon-cyan/15 bg-dark-surface/86 p-2.5 shadow-card backdrop-blur-2xl geo-corner">
      <div className="flex items-start justify-between gap-3">
        <PanelTitle icon="my_location" title="Asset Inspector" subtitle={asset ? asset.layer : "No selection"} />
        {(asset || incident) && (
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border border-white/10 bg-dark-base/60 p-1.5 text-slate-400 transition-colors hover:border-neon-magenta/35 hover:text-neon-magenta"
            aria-label="Close inspector"
          >
            <span className="material-symbols-outlined text-[15px]">close</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!asset && !incident ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-8 rounded-lg border border-white/10 bg-dark-base/55 p-5 text-sm leading-relaxed text-slate-500"
          >
            Select a station marker or incident alert on the OpenStreetMap layer to inspect live details.
          </motion.div>
        ) : (
          <motion.div key={asset?.id || incident?.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-3 space-y-2.5">
            {asset && (
              <section className="rounded-md border border-white/10 bg-dark-base/55 p-2.5">
                <div className="text-[8px] font-black uppercase tracking-[0.14em] text-neon-cyan">
                  {asset.layer === "station" ? "Station Asset" : "Client System"}
                </div>
                <h2 className="mt-1 text-sm font-black leading-tight text-white">{asset.stationName}</h2>
                <div className="mt-1 text-[10px] text-slate-500">{asset.province || "-"} / {asset.district || "-"}</div>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <InspectorMetric label="Progress" value={`${asset.progress}%`} color="cyan" />
                  <InspectorMetric label="Open Incidents" value={asset.incidents.filter((item) => item.repair_status !== COMPLETED_STATUS).length} color="magenta" />
                </div>
                <div className="mt-2 text-[8px] font-mono uppercase tracking-[0.1em] text-slate-600">
                  {asset.lat.toFixed(5)}, {asset.lon.toFixed(5)}
                </div>
                <button
                  type="button"
                  onClick={onCreateForAsset}
                  className="mt-2 w-full rounded-md border border-neon-magenta/25 bg-neon-magenta/10 px-2 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-neon-magenta transition-all hover:border-neon-magenta/50 hover:bg-neon-magenta/15"
                >
                  Create Incident Here
                </button>
              </section>
            )}

            {incident && (
              <section className="rounded-md border border-neon-magenta/20 bg-neon-magenta/[0.04] p-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neon-magenta">
                      Incident {incident.incident_no}
                    </div>
                    <h3 className="mt-2 text-base font-black leading-tight text-white">{incident.station || "-"}</h3>
                  </div>
                  <span className={`rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${priorityColor(incident.priority)}`}>
                    {incident.priority}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-neon-cyan/15 bg-dark-surface/60 p-2 text-center text-neon-cyan shadow-[0_0_12px_rgba(0,240,255,0.06)]">
                    <div className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-500">State</div>
                    <div className="mt-1 truncate text-[10px] font-black uppercase tracking-wider text-white">
                      {incident.repair_status || "-"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-neon-magenta/15 bg-dark-surface/60 p-2 text-center text-neon-magenta shadow-[0_0_12px_rgba(255,0,160,0.06)]">
                    <div className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-500">SLA Priority</div>
                    <div className="mt-1 truncate text-[10px] font-black uppercase tracking-wider text-white">
                      {incident.priority || "-"}
                    </div>
                  </div>
                  <div className={`rounded-lg border bg-dark-surface/60 p-2 text-center shadow-[0_0_12px_rgba(0,240,255,0.06)] ${
                    incident.line_notification_error 
                      ? "border-neon-magenta/15 text-neon-magenta" 
                      : "border-neon-cyan/15 text-neon-cyan"
                  }`}>
                    <div className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-500">LINE Msg</div>
                    <div className="mt-1 truncate text-[10px] font-black uppercase tracking-wider text-white">
                      {incident.line_notification_error ? "Error" : "Sent"}
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4">
                    <IncidentOperationFormFields
                      form={editForm}
                      assetOptions={assetOptions}
                      onChange={onEditFormChange}
                      mode="edit"
                    />
                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                      <button
                        type="button"
                        onClick={() => onSaveIncident(incident)}
                        disabled={isPending}
                        className="flex h-9 cursor-pointer items-center justify-center rounded-lg border border-neon-green/30 bg-neon-green/10 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-neon-green shadow-[0_0_12px_rgba(0,255,136,0.12)] transition-colors hover:border-neon-green/60 hover:bg-neon-green/15 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined mr-1 text-[16px]">save</span>
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={onCancelEdit}
                        disabled={isPending}
                        className="flex h-9 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-dark-base/60 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-300 transition-colors hover:border-neon-cyan/35 hover:text-neon-cyan disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined mr-1 text-[16px]">close</span>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">{incident.issue_description || "-"}</p>
                    <div className="mt-4 grid gap-2 text-xs">
                      <InfoRow label="Status" value={incident.repair_status || "-"} />
                      <InfoRow label="Assignee" value={incident.assignee || "-"} />
                      <InfoRow label="Reporter" value={incident.reporter || "-"} />
                      <InfoRow label="Reported" value={formatDateTime(incident.reported_at)} />
                      <InfoRow label="SLA Due" value={formatDateTime(incident.sla_due_at)} />
                      <InfoRow label="LINE Error" value={incident.line_notification_error || "-"} />
                    </div>
                    <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2 border-t border-white/10 pt-3">
                      <select
                        value={incident.repair_status}
                        onChange={(event) => onUpdateStatus(incident.id, event.target.value as RepairStatus)}
                        disabled={isPending || isLocked}
                        className="neon-input text-xs min-h-9 py-1 bg-dark-base border-white/10 cursor-pointer"
                        aria-label={`Update status for ${incident.incident_no}`}
                      >
                        {REPAIR_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => onStartEdit(incident)}
                        disabled={isPending || isLocked}
                        className="flex h-9 cursor-pointer items-center justify-center rounded-lg border border-neon-cyan/25 bg-neon-cyan/10 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-neon-cyan transition-colors hover:border-neon-cyan/50 hover:bg-neon-cyan/15 disabled:opacity-40"
                        title={isLocked ? "Locked" : "Edit Details"}
                      >
                        <span className="material-symbols-outlined mr-1 text-[16px]">edit</span>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onRetryNotification(incident.id)}
                        disabled={isPending}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-neon-yellow/25 bg-neon-yellow/10 text-neon-yellow transition-colors hover:border-neon-yellow/50 hover:bg-neon-yellow/15 disabled:opacity-40"
                        title="Retry LINE notification"
                        aria-label={`Retry LINE notification for ${incident.incident_no}`}
                      >
                        <span className="material-symbols-outlined text-[17px]">sync</span>
                      </button>
                    </div>
                  </>
                )}
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MissionControlPage() {
  return (
    <React.Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-dark-base text-sm font-black uppercase tracking-[0.22em] text-neon-cyan">
        Loading Operations Room...
      </div>
    }>
      <MissionControlContent />
    </React.Suspense>
  );
}

function PanelTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-md border border-neon-cyan/25 bg-neon-cyan/10 text-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.1)]">
        <span className="material-symbols-outlined text-[15px]">{icon}</span>
      </div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.12em] text-white">{title}</div>
        <div className="text-[7px] font-black uppercase tracking-[0.14em] text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/40 ${
        active
          ? "border-neon-cyan/50 bg-neon-cyan/15 text-neon-cyan shadow-[0_0_12px_rgba(0,240,255,0.12)]"
          : "border-white/10 bg-dark-base/50 text-slate-400 hover:border-neon-cyan/25 hover:text-neon-cyan"
      }`}
    >
      {children}
    </button>
  );
}

function InspectorMetric({ label, value, color }: { label: string; value: React.ReactNode; color: "cyan" | "magenta" }) {
  const classes = color === "cyan" ? "text-neon-cyan border-neon-cyan/20" : "text-neon-magenta border-neon-magenta/20";
  return (
    <div className={`rounded-md border bg-dark-surface/60 p-2 ${classes}`}>
      <div className="text-[7px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm font-black text-white">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[68px_1fr] gap-2 border-b border-white/5 py-1.5 last:border-0">
      <span className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-600">{label}</span>
      <span className="min-w-0 break-words text-[10px] text-slate-300">{value}</span>
    </div>
  );
}
