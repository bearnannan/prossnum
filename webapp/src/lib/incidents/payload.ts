import { createIncidentNumber } from "./format";
import { DEFAULT_REPAIR_STATUS, normalizePriority } from "./config";
import { invalidPhoneMessage, isValidIncidentPhone, normalizeIncidentPhone } from "./phone";
import { buildIncidentSlaFields, normalizePriorityForEquipment } from "./sla";
import type { IncidentAssetType, IncidentInput, NotificationPayload } from "./types";

const FIELD = {
  reportedAt: "วันที่และเวลาแจ้งเหตุ",
  station: "สถานี",
  reporter: "ผู้แจ้งเหตุ",
  issueDescription: "อาการเสีย",
  assignee: "ผู้เข้าดำเนินการ",
  repairStatus: "สถานะการแก้ไข",
  reporterPhone: "เบอร์โทรผู้แจ้งเหตุ",
  phone: "เบอร์โทร",
  incidentNo: "หมายเลขแจ้งเสีย",
} as const;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickText(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function pickNumber(record: Record<string, unknown>, ...keys: string[]) {
  const text = pickText(record, ...keys);
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeAssetType(value: string): IncidentAssetType | undefined {
  if (value === "station" || value === "client") return value;
  return undefined;
}

function parseRawString(raw: string): Record<string, unknown> {
  const text = raw.trim();
  if (!text) return {};

  try {
    return asRecord(JSON.parse(text));
  } catch {
    const params = new URLSearchParams(text);
    const dataValue = params.get("data");
    if (dataValue) {
      try {
        return asRecord(JSON.parse(dataValue));
      } catch {
        return { data: dataValue };
      }
    }

    return Object.fromEntries(params.entries());
  }
}

export function parseIncomingPayload(rawBody: string | object): NotificationPayload {
  const record = typeof rawBody === "string" ? parseRawString(rawBody) : asRecord(rawBody);
  const nowIso = new Date().toISOString();
  const equipmentType = pickText(
    record,
    "equipmentType",
    "equipment_type",
    "equipment",
    "ประเภทอุปกรณ์"
  );
  const assetType = normalizeAssetType(pickText(record, "assetType", "asset_type"));
  const assetName = pickText(record, "assetName", "asset_name");

  return {
    [FIELD.reportedAt]: pickText(record, FIELD.reportedAt, "reportedAt", "reported_at") || nowIso,
    [FIELD.station]: pickText(record, FIELD.station, "station") || "ไม่ระบุสถานี",
    [FIELD.reporter]: pickText(record, FIELD.reporter, "reporter") || "ไม่ระบุผู้แจ้งเหตุ",
    [FIELD.issueDescription]:
      pickText(record, FIELD.issueDescription, "issueDescription", "issue_description") ||
      "ไม่ระบุอาการเสีย",
    [FIELD.assignee]: pickText(record, FIELD.assignee, "assignee") || "รอดำเนินการ",
    [FIELD.repairStatus]:
      pickText(record, FIELD.repairStatus, "repairStatus", "repair_status", "status") ||
      DEFAULT_REPAIR_STATUS,
    [FIELD.reporterPhone]: normalizeIncidentPhone(
      pickText(record, FIELD.reporterPhone, "reporterPhone", "reporter_phone")
    ),
    [FIELD.phone]: normalizeIncidentPhone(pickText(record, FIELD.phone, "phone")),
    [FIELD.incidentNo]:
      pickText(record, FIELD.incidentNo, "incidentNo", "incident_no") || createIncidentNumber(),
    priority: normalizePriorityForEquipment(equipmentType, normalizePriority(pickText(record, "priority"))),
    equipmentType,
    assetId: pickText(record, "assetId", "asset_id") || undefined,
    assetType,
    assetName: assetName || undefined,
    province: pickText(record, "province") || undefined,
    district: pickText(record, "district") || undefined,
    lat: pickNumber(record, "lat", "latitude"),
    lon: pickNumber(record, "lon", "longitude"),
  };
}

export function incidentInputToPayload(input: IncidentInput): NotificationPayload {
  return parseIncomingPayload({
    incidentNo: input.incidentNo,
    reportedAt: input.reportedAt,
    station: input.station,
    reporter: input.reporter,
    issueDescription: input.issueDescription,
    assignee: input.assignee,
    repairStatus: input.repairStatus,
    reporterPhone: input.reporterPhone,
    phone: input.phone,
    priority: input.priority,
    equipmentType: input.equipmentType,
    assetId: input.assetId,
    assetType: input.assetType,
    assetName: input.assetName,
    province: input.province,
    district: input.district,
    lat: input.lat,
    lon: input.lon,
  });
}

export function payloadToIncidentInsert(
  payload: NotificationPayload,
  createdBy?: string | null
) {
  if (!isValidIncidentPhone(payload[FIELD.reporterPhone])) {
    throw new Error(invalidPhoneMessage("Reporter phone"));
  }
  if (!isValidIncidentPhone(payload[FIELD.phone])) {
    throw new Error(invalidPhoneMessage("Contact phone"));
  }

  return {
    reported_at: payload[FIELD.reportedAt],
    station: payload[FIELD.station],
    reporter: payload[FIELD.reporter],
    issue_description: payload[FIELD.issueDescription],
    assignee: payload[FIELD.assignee],
    repair_status: payload[FIELD.repairStatus],
    reporter_phone: payload[FIELD.reporterPhone],
    phone: payload[FIELD.phone],
    priority: normalizePriorityForEquipment(payload.equipmentType, payload.priority),
    asset_id: payload.assetId || null,
    asset_type: payload.assetType || null,
    asset_name: payload.assetName || payload[FIELD.station],
    province: payload.province || null,
    district: payload.district || null,
    latitude: payload.lat ?? null,
    longitude: payload.lon ?? null,
    ...buildIncidentSlaFields({
      equipmentType: payload.equipmentType,
      reportedAt: payload[FIELD.reportedAt],
      repairStatus: payload[FIELD.repairStatus],
    }),
    created_by: createdBy,
    raw_payload: payload as unknown as Record<string, unknown>,
  };
}

export function incidentRecordToPayload(record: {
  incident_no: string;
  reported_at: string;
  station: string;
  reporter: string;
  issue_description: string;
  assignee: string;
  repair_status: string;
  reporter_phone: string;
  phone: string;
  priority?: string;
  equipment_type?: string | null;
  asset_id?: string | null;
  asset_type?: string | null;
  asset_name?: string | null;
  province?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): NotificationPayload {
  return parseIncomingPayload({
    incidentNo: record.incident_no,
    reportedAt: record.reported_at,
    station: record.station,
    reporter: record.reporter,
    issueDescription: record.issue_description,
    assignee: record.assignee,
    repairStatus: record.repair_status,
    reporterPhone: record.reporter_phone,
    phone: record.phone,
    priority: record.priority,
    equipmentType: record.equipment_type || undefined,
    assetId: record.asset_id || undefined,
    assetType: record.asset_type || undefined,
    assetName: record.asset_name || undefined,
    province: record.province || undefined,
    district: record.district || undefined,
    lat: record.latitude ?? undefined,
    lon: record.longitude ?? undefined,
  });
}
