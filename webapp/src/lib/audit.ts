import { supabase } from "./supabase";

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
  try {
    const { error } = await supabase.from("audit_logs").insert([
      {
        user_id: userId,
        user_name: userName,
        action,
        table_name: tableName,
        record_id: recordId,
        payload,
      },
    ]);

    if (error) {
      console.error("Failed to write audit log:", error);
    }
  } catch (err) {
    console.error("Audit logging exception:", err);
  }
}
