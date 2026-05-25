-- Phase 6: RBAC hardening for admin-only operational telemetry.
-- Runtime reads for these surfaces go through Next.js API routes with AppRole checks.

-- Activity logs are admin-only. Do not expose direct client reads through Supabase anon/authenticated keys.
alter table if exists public.user_activity_logs enable row level security;

drop policy if exists "Authenticated users can read activity logs" on public.user_activity_logs;
drop policy if exists "Admins can read activity logs" on public.user_activity_logs;

revoke select on table public.user_activity_logs from anon;
revoke select on table public.user_activity_logs from authenticated;

-- Notification delivery history backs /notification-ops, which is admin-only.
alter table if exists public.incident_notification_attempts enable row level security;

drop policy if exists "Authenticated users can read notification attempts"
  on public.incident_notification_attempts;
drop policy if exists "Admins can read notification attempts"
  on public.incident_notification_attempts;

revoke select on table public.incident_notification_attempts from anon;
revoke select on table public.incident_notification_attempts from authenticated;

-- System settings are admin-only through /api/settings.
alter table if exists public.system_settings enable row level security;

drop policy if exists "Authenticated users can read settings" on public.system_settings;
drop policy if exists "Authenticated users can insert settings" on public.system_settings;
drop policy if exists "Authenticated users can update settings" on public.system_settings;
drop policy if exists "Admins can read settings" on public.system_settings;
drop policy if exists "Admins can write settings" on public.system_settings;

revoke select, insert, update, delete on table public.system_settings from anon;
revoke select, insert, update, delete on table public.system_settings from authenticated;
