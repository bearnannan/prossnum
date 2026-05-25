import type { IncidentPriority, RepairStatus } from "./types";

export type SlaPenaltyUnit = "hour" | "day";

export interface EquipmentSlaRule {
  equipmentType: string;
  slaDurationHours: number;
  penaltyRateBaht: number;
  penaltyUnit: SlaPenaltyUnit;
  allowedPriorities: IncidentPriority[];
  defaultPriority: IncidentPriority;
}

export interface IncidentSlaFields {
  equipment_type: string | null;
  sla_duration_hours: number | null;
  sla_due_at: string | null;
  penalty_rate_baht: number | null;
  penalty_unit: SlaPenaltyUnit | null;
  resolved_at: string | null;
  penalty_amount_baht: number;
}

export const COMPLETED_STATUS: RepairStatus = "เสร็จสิ้น";

export const EQUIPMENT_SLA_RULES: EquipmentSlaRule[] = [
  {
    equipmentType: "Base Station Control Center (BSSC) Capacity Expansion System",
    slaDurationHours: 3,
    penaltyRateBaht: 5000,
    penaltyUnit: "hour",
    allowedPriorities: ["critical"],
    defaultPriority: "critical",
  },
  {
    equipmentType: "Dispatcher Console",
    slaDurationHours: 3,
    penaltyRateBaht: 5000,
    penaltyUnit: "hour",
    allowedPriorities: ["critical"],
    defaultPriority: "critical",
  },
  {
    equipmentType: "SD-WAN Management System",
    slaDurationHours: 3,
    penaltyRateBaht: 5000,
    penaltyUnit: "hour",
    allowedPriorities: ["critical"],
    defaultPriority: "critical",
  },
  {
    equipmentType: "Super High Frequency (SHF) Repeater Kit",
    slaDurationHours: 72,
    penaltyRateBaht: 10000,
    penaltyUnit: "day",
    allowedPriorities: ["high", "medium"],
    defaultPriority: "high",
  },
  {
    equipmentType: "Gateway Kit for Analog Connection",
    slaDurationHours: 72,
    penaltyRateBaht: 10000,
    penaltyUnit: "day",
    allowedPriorities: ["high", "medium"],
    defaultPriority: "high",
  },
  {
    equipmentType: "1-Carrier Base Station (Outdoor)",
    slaDurationHours: 72,
    penaltyRateBaht: 10000,
    penaltyUnit: "day",
    allowedPriorities: ["high", "medium"],
    defaultPriority: "high",
  },
  {
    equipmentType: "L3 Switch Distribution Equipment",
    slaDurationHours: 72,
    penaltyRateBaht: 10000,
    penaltyUnit: "day",
    allowedPriorities: ["high", "medium"],
    defaultPriority: "high",
  },
  {
    equipmentType: "3 kVA Uninterruptible Power Supply (UPS)",
    slaDurationHours: 72,
    penaltyRateBaht: 10000,
    penaltyUnit: "day",
    allowedPriorities: ["high", "medium"],
    defaultPriority: "high",
  },
  {
    equipmentType: "Handheld Subscriber Radio (Portable Radio)",
    slaDurationHours: 96,
    penaltyRateBaht: 10000,
    penaltyUnit: "day",
    allowedPriorities: ["low"],
    defaultPriority: "low",
  },
  {
    equipmentType: "Fixed Subscriber Radio (Mobile/Desktop Radio)",
    slaDurationHours: 96,
    penaltyRateBaht: 10000,
    penaltyUnit: "day",
    allowedPriorities: ["low"],
    defaultPriority: "low",
  },
];

export function getEquipmentSlaRule(equipmentType?: string | null) {
  const normalized = equipmentType?.trim().toLowerCase();
  if (!normalized) return null;
  return EQUIPMENT_SLA_RULES.find((rule) => rule.equipmentType.toLowerCase() === normalized) || null;
}

export function getPriorityOptionsForEquipment(equipmentType?: string | null): IncidentPriority[] {
  return getEquipmentSlaRule(equipmentType)?.allowedPriorities || ["critical", "high", "medium", "low"];
}

export function normalizePriorityForEquipment(
  equipmentType?: string | null,
  priority?: string | null
): IncidentPriority {
  const rule = getEquipmentSlaRule(equipmentType);
  if (!rule) {
    if (
      priority === "critical" ||
      priority === "high" ||
      priority === "medium" ||
      priority === "low"
    ) {
      return priority;
    }
    return "medium";
  }

  return rule.allowedPriorities.includes(priority as IncidentPriority)
    ? (priority as IncidentPriority)
    : rule.defaultPriority;
}

export function calculatePenaltyAmount(
  dueAt: string | null,
  penaltyRateBaht: number | null,
  penaltyUnit: SlaPenaltyUnit | null,
  effectiveEndAt: string
) {
  if (!dueAt || !penaltyRateBaht || !penaltyUnit) return 0;

  const due = new Date(dueAt).getTime();
  const end = new Date(effectiveEndAt).getTime();
  if (Number.isNaN(due) || Number.isNaN(end) || end <= due) return 0;

  const msPerUnit = penaltyUnit === "hour" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return Math.ceil((end - due) / msPerUnit) * penaltyRateBaht;
}

export function buildIncidentSlaFields(input: {
  equipmentType?: string | null;
  reportedAt: string;
  repairStatus: RepairStatus;
  resolvedAt?: string | null;
  now?: Date;
}): IncidentSlaFields {
  const rule = getEquipmentSlaRule(input.equipmentType);
  if (!rule) {
    return {
      equipment_type: input.equipmentType?.trim() || null,
      sla_duration_hours: null,
      sla_due_at: null,
      penalty_rate_baht: null,
      penalty_unit: null,
      resolved_at: input.repairStatus === COMPLETED_STATUS ? input.resolvedAt || new Date().toISOString() : null,
      penalty_amount_baht: 0,
    };
  }

  const reportedAt = new Date(input.reportedAt);
  const baseTime = Number.isNaN(reportedAt.getTime()) ? new Date() : reportedAt;
  const dueAt = new Date(baseTime.getTime() + rule.slaDurationHours * 60 * 60 * 1000).toISOString();
  const resolvedAt =
    input.repairStatus === COMPLETED_STATUS
      ? input.resolvedAt || input.now?.toISOString() || new Date().toISOString()
      : null;
  const effectiveEndAt = resolvedAt || input.now?.toISOString() || new Date().toISOString();

  return {
    equipment_type: rule.equipmentType,
    sla_duration_hours: rule.slaDurationHours,
    sla_due_at: dueAt,
    penalty_rate_baht: rule.penaltyRateBaht,
    penalty_unit: rule.penaltyUnit,
    resolved_at: resolvedAt,
    penalty_amount_baht: calculatePenaltyAmount(
      dueAt,
      rule.penaltyRateBaht,
      rule.penaltyUnit,
      effectiveEndAt
    ),
  };
}
