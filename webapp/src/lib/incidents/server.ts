import { normalizePriority } from "./config";
import { incidentRecordToPayload as toPayload } from "./payload";
import { invalidPhoneMessage, isValidIncidentPhone, normalizeIncidentPhone } from "./phone";
import { buildIncidentSlaFields, normalizePriorityForEquipment } from "./sla";

export { toPayload as incidentRecordToPayload };

const UPDATE_FIELD_MAP: Record<string, string> = {
  incidentNo: "incident_no",
  reportedAt: "reported_at",
  station: "station",
  reporter: "reporter",
  issueDescription: "issue_description",
  assignee: "assignee",
  repairStatus: "repair_status",
  reporterPhone: "reporter_phone",
  phone: "phone",
  priority: "priority",
  equipmentType: "equipment_type",
  assetId: "asset_id",
  assetType: "asset_type",
  assetName: "asset_name",
  province: "province",
  district: "district",
  lat: "latitude",
  lon: "longitude",
};

export function normalizePriorityForUpdate(
  body: Record<string, unknown>,
  existing?: {
    reported_at: string;
    repair_status: string;
    equipment_type?: string | null;
    priority?: string | null;
    resolved_at?: string | null;
  }
) {
  const update: Record<string, unknown> = {};

  for (const [clientKey, dbKey] of Object.entries(UPDATE_FIELD_MAP)) {
    const value = body[clientKey] ?? body[dbKey];
    if (value === undefined || value === null) continue;
    if (dbKey === "reporter_phone" || dbKey === "phone") {
      const label = dbKey === "reporter_phone" ? "Reporter phone" : "Contact phone";
      const normalizedPhone = normalizeIncidentPhone(String(value));
      if (!isValidIncidentPhone(normalizedPhone)) throw new Error(invalidPhoneMessage(label));
      update[dbKey] = normalizedPhone;
      continue;
    }
    update[dbKey] = dbKey === "priority" ? normalizePriority(String(value)) : value;
  }

  const effectiveEquipmentType = String(update.equipment_type ?? existing?.equipment_type ?? "");
  if (
    existing &&
    ("equipment_type" in update ||
      "priority" in update ||
      "reported_at" in update ||
      "repair_status" in update)
  ) {
    update.priority = normalizePriorityForEquipment(
      effectiveEquipmentType,
      String(update.priority ?? existing.priority ?? "")
    );
  }

  if (existing && ("equipment_type" in update || "reported_at" in update || "repair_status" in update)) {
    Object.assign(
      update,
      buildIncidentSlaFields({
        equipmentType: effectiveEquipmentType,
        reportedAt: String(update.reported_at ?? existing.reported_at),
        repairStatus: String(update.repair_status ?? existing.repair_status),
        resolvedAt: existing.resolved_at,
      })
    );
  }

  return update;
}
