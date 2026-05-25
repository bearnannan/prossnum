-- Phase 2 migration: asset-linked incidents + notification delivery attempts.
-- Run this whole file in the Supabase SQL editor.
--
-- This file intentionally avoids PL/pgSQL dollar-quoted function bodies so it is
-- easier to paste/run in the Supabase editor than the full bootstrap script.

alter table public.incidents
  add column if not exists asset_id uuid,
  add column if not exists asset_type text,
  add column if not exists asset_name text,
  add column if not exists province text,
  add column if not exists district text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

alter table public.incidents
  drop constraint if exists incidents_asset_type_check;

alter table public.incidents
  add constraint incidents_asset_type_check
  check (asset_type is null or asset_type in ('station', 'client'));

create index if not exists incidents_asset_ref_idx
  on public.incidents (asset_type, asset_id);

create index if not exists incidents_status_priority_idx
  on public.incidents (repair_status, priority);

create index if not exists incidents_coordinates_idx
  on public.incidents (latitude, longitude)
  where latitude is not null and longitude is not null;

update public.incidents i
set
  asset_id = s.id,
  asset_type = 'station',
  asset_name = s.station_name,
  province = s.province,
  district = s.district,
  latitude = s.latitude,
  longitude = s.longitude
from public.stations s
where i.asset_id is null
  and lower(trim(i.station)) = lower(trim(s.station_name));

update public.incidents i
set
  asset_id = c.id,
  asset_type = 'client',
  asset_name = c.station_name,
  province = c.province,
  district = c.district,
  latitude = c.latitude,
  longitude = c.longitude
from public.client_systems c
where i.asset_id is null
  and lower(trim(i.station)) = lower(trim(c.station_name));

create table if not exists public.incident_notification_attempts (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents(id) on delete cascade,
  channel text not null,
  status text not null,
  message text not null default '',
  status_code integer,
  correlation_id text,
  token_source text,
  created_at timestamptz not null default now()
);

alter table public.incident_notification_attempts
  drop constraint if exists incident_notification_attempts_channel_check;

alter table public.incident_notification_attempts
  add constraint incident_notification_attempts_channel_check
  check (channel in ('line_primary', 'line_backup', 'smtp_fallback', 'manual_resend'));

alter table public.incident_notification_attempts
  drop constraint if exists incident_notification_attempts_status_check;

alter table public.incident_notification_attempts
  add constraint incident_notification_attempts_status_check
  check (status in ('success', 'error'));

create index if not exists incident_notification_attempts_incident_idx
  on public.incident_notification_attempts (incident_id, created_at desc);

create index if not exists incident_notification_attempts_status_idx
  on public.incident_notification_attempts (status, created_at desc);

alter table public.incident_notification_attempts enable row level security;

grant select, insert on table public.incident_notification_attempts to authenticated;

drop policy if exists "Authenticated users can read notification attempts"
  on public.incident_notification_attempts;

create policy "Authenticated users can read notification attempts"
on public.incident_notification_attempts
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create notification attempts"
  on public.incident_notification_attempts;

create policy "Authenticated users can create notification attempts"
on public.incident_notification_attempts
for insert
to authenticated
with check (true);
