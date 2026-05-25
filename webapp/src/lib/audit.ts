import { logActivity } from "@/lib/activity-logger";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export async function logAction({
  userId,
  userName,
  action,
  tableName,
  recordId,
  payload,
}: {
  userId: string;
  userName?: string;
  action: AuditAction;
  tableName: string;
  recordId: string;
  payload?: any;
}) {
  await logActivity({
    eventType: "mission_control",
    eventName: `dashboard_${action.toLowerCase()}`,
    userId,
    userName,
    userSource: "dashboard_data_api",
    targetType: tableName,
    targetId: recordId,
    metadata: {
      action,
      tableName,
      recordId,
      payload: payload || null,
    },
  });
}
