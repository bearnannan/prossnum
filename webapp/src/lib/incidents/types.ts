export type RepairStatus = "เสร็จสิ้น" | "รอดำเนินการ" | "กำลังดำเนินการ" | string;

export type IncidentPriority = "critical" | "high" | "medium" | "low";
export type IncidentAssetType = "station" | "client";

export interface NotificationPayload {
  "วันที่และเวลาแจ้งเหตุ": string;
  "สถานี": string;
  "ผู้แจ้งเหตุ": string;
  "อาการเสีย": string;
  "ผู้เข้าดำเนินการ": string;
  "สถานะการแก้ไข": RepairStatus;
  "เบอร์โทรผู้แจ้งเหตุ": string;
  "เบอร์โทร": string;
  "หมายเลขแจ้งเสีย": string;
  priority?: IncidentPriority;
  equipmentType?: string;
  assetId?: string;
  assetType?: IncidentAssetType;
  assetName?: string;
  province?: string;
  district?: string;
  lat?: number;
  lon?: number;
}

export interface IncidentRecord {
  id: string;
  incident_no: string;
  reported_at: string;
  station: string;
  reporter: string;
  issue_description: string;
  assignee: string;
  repair_status: RepairStatus;
  reporter_phone: string;
  phone: string;
  priority: IncidentPriority;
  equipment_type?: string | null;
  asset_id?: string | null;
  asset_type?: IncidentAssetType | null;
  asset_name?: string | null;
  province?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  sla_duration_hours?: number | null;
  sla_due_at?: string | null;
  penalty_rate_baht?: number | null;
  penalty_unit?: "hour" | "day" | null;
  resolved_at?: string | null;
  penalty_amount_baht?: number | null;
  created_by?: string | null;
  line_notification_sent_at?: string | null;
  line_notification_error?: string | null;
  raw_payload?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface IncidentInput {
  incidentNo?: string;
  reportedAt?: string;
  station?: string;
  reporter?: string;
  issueDescription?: string;
  assignee?: string;
  repairStatus?: RepairStatus;
  reporterPhone?: string;
  phone?: string;
  priority?: IncidentPriority;
  equipmentType?: string;
  assetId?: string;
  assetType?: IncidentAssetType;
  assetName?: string;
  province?: string;
  district?: string;
  lat?: number;
  lon?: number;
}

export interface LineFlexMessage {
  type: "flex";
  altText: string;
  contents: Record<string, unknown>;
}

export interface LineApiResponse {
  status: "success" | "error";
  message: string;
  statusCode?: number;
}
