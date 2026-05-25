-- Create Supabase incidents storage for the LINE notification migration.
-- Apply this manually in the Supabase SQL editor or your migration workflow.
--
-- Security model:
-- - RLS is enabled because public schema tables are exposed through Supabase Data API.
-- - Authenticated Supabase users may read/create/update incidents.
-- - This Next.js app uses NextAuth/custom cookies, so server API routes should use
--   SUPABASE_SERVICE_ROLE_KEY and perform app-level auth checks before writing.
-- - No anon policies are granted here.

create extension if not exists "pgcrypto";

create table if not exists public.incident_equipment_sla_rules (
  equipment_type text primary key,
  sla_duration_hours integer not null check (sla_duration_hours > 0),
  penalty_rate_baht numeric(12, 2) not null check (penalty_rate_baht >= 0),
  penalty_unit text not null check (penalty_unit in ('hour', 'day')),
  allowed_priorities text[] not null,
  default_priority text not null check (default_priority in ('critical', 'high', 'medium', 'low')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.incident_equipment_sla_rules
  add column if not exists allowed_priorities text[] not null default array['medium']::text[],
  add column if not exists default_priority text not null default 'medium'
    check (default_priority in ('critical', 'high', 'medium', 'low'));

insert into public.incident_equipment_sla_rules (
  equipment_type,
  sla_duration_hours,
  penalty_rate_baht,
  penalty_unit,
  allowed_priorities,
  default_priority
)
values
  ('Base Station Control Center (BSSC) Capacity Expansion System', 3, 5000, 'hour', array['critical']::text[], 'critical'),
  ('Dispatcher Console', 3, 5000, 'hour', array['critical']::text[], 'critical'),
  ('SD-WAN Management System', 3, 5000, 'hour', array['critical']::text[], 'critical'),
  ('Super High Frequency (SHF) Repeater Kit', 72, 10000, 'day', array['high', 'medium']::text[], 'high'),
  ('Gateway Kit for Analog Connection', 72, 10000, 'day', array['high', 'medium']::text[], 'high'),
  ('1-Carrier Base Station (Outdoor)', 72, 10000, 'day', array['high', 'medium']::text[], 'high'),
  ('L3 Switch Distribution Equipment', 72, 10000, 'day', array['high', 'medium']::text[], 'high'),
  ('3 kVA Uninterruptible Power Supply (UPS)', 72, 10000, 'day', array['high', 'medium']::text[], 'high'),
  ('Handheld Subscriber Radio (Portable Radio)', 96, 10000, 'day', array['low']::text[], 'low'),
  ('Fixed Subscriber Radio (Mobile/Desktop Radio)', 96, 10000, 'day', array['low']::text[], 'low')
on conflict (equipment_type) do update set
  sla_duration_hours = excluded.sla_duration_hours,
  penalty_rate_baht = excluded.penalty_rate_baht,
  penalty_unit = excluded.penalty_unit,
  allowed_priorities = excluded.allowed_priorities,
  default_priority = excluded.default_priority,
  updated_at = now();

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  incident_no text not null unique,
  reported_at timestamptz not null default now(),
  station text not null default 'ไม่ระบุสถานี',
  reporter text not null default 'ไม่ระบุผู้แจ้งเหตุ',
  issue_description text not null default 'ไม่ระบุอาการเสีย',
  assignee text not null default 'รอดำเนินการ',
  repair_status text not null default 'รอดำเนินการ',
  reporter_phone text not null default '-',
  phone text not null default '-',
  priority text not null default 'medium',
  equipment_type text,
  asset_id uuid,
  asset_type text check (asset_type in ('station', 'client')),
  asset_name text,
  province text,
  district text,
  latitude numeric,
  longitude numeric,
  sla_duration_hours integer,
  sla_due_at timestamptz,
  penalty_rate_baht numeric(12, 2),
  penalty_unit text check (penalty_unit in ('hour', 'day')),
  resolved_at timestamptz,
  penalty_amount_baht numeric(12, 2) not null default 0,
  created_by text,
  line_notification_sent_at timestamptz,
  line_notification_error text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.incidents
  add column if not exists equipment_type text,
  add column if not exists asset_id uuid,
  add column if not exists asset_type text check (asset_type in ('station', 'client')),
  add column if not exists asset_name text,
  add column if not exists province text,
  add column if not exists district text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists sla_duration_hours integer,
  add column if not exists sla_due_at timestamptz,
  add column if not exists penalty_rate_baht numeric(12, 2),
  add column if not exists penalty_unit text check (penalty_unit in ('hour', 'day')),
  add column if not exists resolved_at timestamptz,
  add column if not exists penalty_amount_baht numeric(12, 2) not null default 0;

create index if not exists incidents_reported_at_idx on public.incidents (reported_at desc);
create index if not exists incidents_repair_status_idx on public.incidents (repair_status);
create index if not exists incidents_priority_idx on public.incidents (priority);
create index if not exists incidents_station_idx on public.incidents (station);
create index if not exists incidents_equipment_type_idx on public.incidents (equipment_type);
create index if not exists incidents_sla_due_at_idx on public.incidents (sla_due_at);
create index if not exists incidents_asset_ref_idx on public.incidents (asset_type, asset_id);
create index if not exists incidents_status_priority_idx on public.incidents (repair_status, priority);
create index if not exists incidents_coordinates_idx on public.incidents (latitude, longitude)
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
  channel text not null check (channel in ('line_primary', 'line_backup', 'smtp_fallback', 'manual_resend')),
  status text not null check (status in ('success', 'error')),
  message text not null default '',
  status_code integer,
  correlation_id text,
  token_source text,
  created_at timestamptz not null default now()
);

create index if not exists incident_notification_attempts_incident_idx
  on public.incident_notification_attempts (incident_id, created_at desc);
create index if not exists incident_notification_attempts_status_idx
  on public.incident_notification_attempts (status, created_at desc);

create or replace function public.apply_incident_sla()
returns trigger
language plpgsql
as $$
declare
  rule record;
  effective_end_at timestamptz;
  breach_units numeric;
begin
  select *
  into rule
  from public.incident_equipment_sla_rules
  where equipment_type = new.equipment_type;

  if not found then
    new.sla_duration_hours = null;
    new.sla_due_at = null;
    new.penalty_rate_baht = null;
    new.penalty_unit = null;
    new.penalty_amount_baht = 0;
    if new.repair_status <> 'เสร็จสิ้น' then
      new.resolved_at = null;
    end if;
    return new;
  end if;

  new.sla_duration_hours = rule.sla_duration_hours;
  new.sla_due_at = new.reported_at + make_interval(hours => rule.sla_duration_hours);
  new.penalty_rate_baht = rule.penalty_rate_baht;
  new.penalty_unit = rule.penalty_unit;
  if new.priority is null or not (new.priority = any(rule.allowed_priorities)) then
    new.priority = rule.default_priority;
  end if;

  if new.repair_status = 'เสร็จสิ้น' then
    new.resolved_at = coalesce(new.resolved_at, now());
  else
    new.resolved_at = null;
  end if;

  effective_end_at = coalesce(new.resolved_at, now());

  if effective_end_at <= new.sla_due_at then
    new.penalty_amount_baht = 0;
  elsif rule.penalty_unit = 'hour' then
    breach_units = ceil(extract(epoch from (effective_end_at - new.sla_due_at)) / 3600);
    new.penalty_amount_baht = breach_units * rule.penalty_rate_baht;
  else
    breach_units = ceil(extract(epoch from (effective_end_at - new.sla_due_at)) / 86400);
    new.penalty_amount_baht = breach_units * rule.penalty_rate_baht;
  end if;

  return new;
end;
$$;

create or replace function public.set_incidents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists apply_incident_sla on public.incidents;
create trigger apply_incident_sla
before insert or update of equipment_type, reported_at, repair_status, resolved_at, priority
on public.incidents
for each row
execute function public.apply_incident_sla();

drop trigger if exists set_incidents_updated_at on public.incidents;
create trigger set_incidents_updated_at
before update on public.incidents
for each row
execute function public.set_incidents_updated_at();

alter table public.incident_equipment_sla_rules enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_notification_attempts enable row level security;

grant select on table public.incident_equipment_sla_rules to authenticated;
grant select, insert, update on table public.incidents to authenticated;
grant select, insert on table public.incident_notification_attempts to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "Authenticated users can read equipment SLA rules" on public.incident_equipment_sla_rules;
create policy "Authenticated users can read equipment SLA rules"
on public.incident_equipment_sla_rules
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read incidents" on public.incidents;
create policy "Authenticated users can read incidents"
on public.incidents
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create incidents" on public.incidents;
create policy "Authenticated users can create incidents"
on public.incidents
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update incidents" on public.incidents;
create policy "Authenticated users can update incidents"
on public.incidents
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can read notification attempts" on public.incident_notification_attempts;
create policy "Authenticated users can read notification attempts"
on public.incident_notification_attempts
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create notification attempts" on public.incident_notification_attempts;
create policy "Authenticated users can create notification attempts"
on public.incident_notification_attempts
for insert
to authenticated
with check (true);
