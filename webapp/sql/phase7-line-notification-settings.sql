-- Phase 7: Move LINE incident notification configuration into system_settings.
-- Stores the exact runtime keys requested by the application:
--   LINE_TOKEN: LINE Incident Notifications Token
--   GROUP_ID: Target Group ID for alerts

create table if not exists public.system_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

alter table public.system_settings enable row level security;

insert into public.system_settings (key, value, updated_at)
values
  (
    'LINE_TOKEN',
    coalesce((select value from public.system_settings where key = 'LINE_TOKEN'), (select value from public.system_settings where key = 'line_backup_token'), ''),
    now()
  ),
  (
    'GROUP_ID',
    coalesce((select value from public.system_settings where key = 'GROUP_ID'), (select value from public.system_settings where key = 'line_backup_group_id'), ''),
    now()
  )
on conflict (key) do update
set
  value = excluded.value,
  updated_at = now()
where public.system_settings.value is distinct from excluded.value;

create or replace function public.set_system_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists system_settings_set_updated_at on public.system_settings;
create trigger system_settings_set_updated_at
before update on public.system_settings
for each row
execute function public.set_system_settings_updated_at();
