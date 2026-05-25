-- Phase 3 migration: general user activity and security audit logging.
-- Run this in the Supabase SQL editor after the Phase 2 incident migration.

create extension if not exists pgcrypto;

create table if not exists public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  event_name text not null,
  user_id text,
  user_name text,
  user_source text,
  session_id text,
  route text,
  referrer text,
  target_type text,
  target_label text,
  target_id text,
  http_method text,
  status_code integer,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint user_activity_logs_event_type_check
    check (event_type in (
      'page_view',
      'navigation',
      'button_click',
      'login',
      'logout',
      'failed_auth',
      'mission_control',
      'settings_change',
      'export_download',
      'security'
    ))
);

create index if not exists user_activity_logs_created_at_idx
  on public.user_activity_logs (created_at desc);

create index if not exists user_activity_logs_user_idx
  on public.user_activity_logs (user_id, created_at desc);

create index if not exists user_activity_logs_event_idx
  on public.user_activity_logs (event_type, event_name, created_at desc);

create index if not exists user_activity_logs_route_idx
  on public.user_activity_logs (route, created_at desc);

create index if not exists user_activity_logs_metadata_gin_idx
  on public.user_activity_logs using gin (metadata);

alter table public.user_activity_logs enable row level security;

grant select, insert on table public.user_activity_logs to authenticated;

drop policy if exists "Authenticated users can insert activity logs" on public.user_activity_logs;
create policy "Authenticated users can insert activity logs"
on public.user_activity_logs
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can read activity logs" on public.user_activity_logs;
create policy "Authenticated users can read activity logs"
on public.user_activity_logs
for select
to authenticated
using (true);
