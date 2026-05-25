"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import { normalizePriorityForEquipment } from "@/lib/incidents/sla";
import {
  invalidPhoneMessage,
  isValidIncidentPhone,
  normalizeIncidentPhone,
} from "@/lib/incidents/phone";
import type { IncidentAssetType, IncidentPriority, IncidentRecord, RepairStatus } from "@/lib/incidents/types";
import type { LiveMapAsset } from "@/lib/incidents/map-join";

export interface IncidentAssetOption {
  key: string;
  id: string;
  type: IncidentAssetType;
  stationName: string;
  province: string;
  district: string;
  lat: number;
  lon: number;
}

export interface IncidentOperationForm {
  station: string;
  reporter: string;
  issueDescription: string;
  assignee: string;
  repairStatus: RepairStatus;
  reporterPhone: string;
  phone: string;
  priority: IncidentPriority;
  equipmentType: string;
  assetId: string;
  assetType: IncidentAssetType | "";
  assetName: string;
  province: string;
  district: string;
  lat: string;
  lon: string;
}

export const REPAIR_STATUSES: RepairStatus[] = ["รอดำเนินการ", "กำลังดำเนินการ", "เสร็จสิ้น"];

export const initialIncidentForm: IncidentOperationForm = {
  station: "",
  reporter: "",
  issueDescription: "",
  assignee: "",
  repairStatus: "รอดำเนินการ",
  reporterPhone: "",
  phone: "",
  priority: "medium",
  equipmentType: "",
  assetId: "",
  assetType: "",
  assetName: "",
  province: "",
  district: "",
  lat: "",
  lon: "",
};

export function assetOptionToFormPatch(asset: IncidentAssetOption) {
  return {
    station: asset.stationName,
    assetId: asset.id,
    assetType: asset.type,
    assetName: asset.stationName,
    province: asset.province,
    district: asset.district,
    lat: String(asset.lat),
    lon: String(asset.lon),
  };
}

export function liveAssetToFormPatch(asset: LiveMapAsset) {
  return {
    station: asset.stationName,
    assetId: asset.id,
    assetType: asset.layer,
    assetName: asset.stationName,
    province: asset.province,
    district: asset.district,
    lat: String(asset.lat),
    lon: String(asset.lon),
  };
}

export function incidentToOperationForm(incident: IncidentRecord): IncidentOperationForm {
  const equipmentType = incident.equipment_type || "";
  return {
    station: incident.station || "",
    reporter: incident.reporter || "",
    issueDescription: incident.issue_description || "",
    assignee: incident.assignee || "",
    repairStatus: incident.repair_status,
    reporterPhone: incident.reporter_phone || "",
    phone: incident.phone || "",
    priority: normalizePriorityForEquipment(equipmentType, incident.priority),
    equipmentType,
    assetId: incident.asset_id || "",
    assetType: incident.asset_type || "",
    assetName: incident.asset_name || incident.station || "",
    province: incident.province || "",
    district: incident.district || "",
    lat: incident.latitude === null || incident.latitude === undefined ? "" : String(incident.latitude),
    lon: incident.longitude === null || incident.longitude === undefined ? "" : String(incident.longitude),
  };
}

function formToPayload(form: IncidentOperationForm) {
  return {
    station: form.station,
    reporter: form.reporter,
    issueDescription: form.issueDescription,
    assignee: form.assignee,
    repairStatus: form.repairStatus,
    reporterPhone: normalizeIncidentPhone(form.reporterPhone),
    phone: normalizeIncidentPhone(form.phone),
    equipmentType: form.equipmentType,
    priority: normalizePriorityForEquipment(form.equipmentType, form.priority),
    assetId: form.assetId || undefined,
    assetType: form.assetType || undefined,
    assetName: form.assetName || form.station,
    province: form.province || undefined,
    district: form.district || undefined,
    lat: form.lat ? Number(form.lat) : undefined,
    lon: form.lon ? Number(form.lon) : undefined,
  };
}

function validateIncidentPhones(form: IncidentOperationForm) {
  if (!isValidIncidentPhone(form.reporterPhone)) {
    return invalidPhoneMessage("Reporter phone");
  }
  if (!isValidIncidentPhone(form.phone)) {
    return invalidPhoneMessage("Contact phone");
  }
  return null;
}

export function useIncidentOperations(onRefresh?: () => Promise<void> | void) {
  const [currentUser, setCurrentUser] = useState("");
  const [assetOptions, setAssetOptions] = useState<IncidentAssetOption[]>([]);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    const loadAssets = async () => {
      try {
        const clientsRes = await supabase
          .from("client_systems")
          .select("id, station_name, province, district, latitude, longitude")
          .order("station_name");
        if (clientsRes.error) throw clientsRes.error;

        const clientAssets = (clientsRes.data || []).map((item) => ({
          key: `client:${item.id}`,
          id: item.id,
          type: "client" as const,
          stationName: item.station_name || "",
          province: item.province || "",
          district: item.district || "",
          lat: Number(item.latitude) || 0,
          lon: Number(item.longitude) || 0,
        }));
        if (active) setAssetOptions(clientAssets);
      } catch (error) {
        console.error("Failed to load client system incident asset selector:", error);
      }
    };

    loadAssets();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/user", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (active && json.user?.name) setCurrentUser(json.user.name);
      } catch (error) {
        console.error("Failed to load authenticated user:", error);
      }
    };

    fetchUser();
    return () => {
      active = false;
    };
  }, []);

  const createIncident = useCallback(
    (form: IncidentOperationForm, onComplete?: () => void) => {
      startTransition(async () => {
        try {
          const phoneError = validateIncidentPhones(form);
          if (phoneError) throw new Error(phoneError);

          const res = await fetch("/api/incidents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formToPayload(form)),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Create incident failed");
          await onRefresh?.();
          onComplete?.();
          const lineStatus = json.line?.status === "success" ? "LINE sent" : "saved, LINE pending";
          showToast(`Incident created (${lineStatus})`, json.line?.status === "success" ? "success" : "info");
        } catch (error) {
          showToast(error instanceof Error ? error.message : "Create incident failed", "error");
        }
      });
    },
    [onRefresh, showToast]
  );

  const updateIncident = useCallback(
    (id: string, form: IncidentOperationForm, onComplete?: () => void) => {
      startTransition(async () => {
        try {
          const phoneError = validateIncidentPhones(form);
          if (phoneError) throw new Error(phoneError);

          const res = await fetch(`/api/incidents/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formToPayload(form)),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Update incident failed");
          await onRefresh?.();
          onComplete?.();
          showToast("Incident details updated", "success");
        } catch (error) {
          showToast(error instanceof Error ? error.message : "Update incident failed", "error");
        }
      });
    },
    [onRefresh, showToast]
  );

  const updateIncidentStatus = useCallback(
    (id: string, repairStatus: RepairStatus) => {
      startTransition(async () => {
        try {
          const res = await fetch(`/api/incidents/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repairStatus }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Update incident failed");
          await onRefresh?.();
          showToast("Incident status updated and LINE notification processed", "success");
        } catch (error) {
          showToast(error instanceof Error ? error.message : "Update incident failed", "error");
        }
      });
    },
    [onRefresh, showToast]
  );

  const retryIncidentNotification = useCallback(
    (id: string) => {
      startTransition(async () => {
        try {
          const res = await fetch(`/api/incidents/${id}/resend`, { method: "POST" });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Resend failed");
          await onRefresh?.();
          showToast("LINE notification resent successfully", "success");
        } catch (error) {
          showToast(error instanceof Error ? error.message : "Failed to resend notification", "error");
        }
      });
    },
    [onRefresh, showToast]
  );

  return {
    currentUser,
    assetOptions,
    isPending,
    createIncident,
    updateIncident,
    updateIncidentStatus,
    retryIncidentNotification,
  };
}
