-- Phase 4 migration: authoritative yearly incident number generator.
-- Format: INC-SHF-YYYY-XXXX, where XXXX resets to 0000 for each calendar year.

create schema if not exists app_private;

revoke all on schema app_private from public;
revoke all on schema app_private from anon;
revoke all on schema app_private from authenticated;

create table if not exists app_private.incident_no_counters (
  counter_year integer primary key,
  next_counter integer not null default 0 check (next_counter between 0 and 10000),
  updated_at timestamptz not null default now()
);

revoke all on table app_private.incident_no_counters from public;
revoke all on table app_private.incident_no_counters from anon;
revoke all on table app_private.incident_no_counters from authenticated;

create or replace function app_private.next_incident_no()
returns text
language plpgsql
security definer
set search_path = app_private, public
as $$
declare
  target_year integer := extract(year from current_date)::integer;
  counter_value integer;
begin
  loop
    begin
      insert into app_private.incident_no_counters (counter_year, next_counter)
      values (target_year, 1)
      returning 0 into counter_value;

      return format('INC-SHF-%s-%s', target_year, lpad(counter_value::text, 4, '0'));
    exception
      when unique_violation then
        select next_counter
        into counter_value
        from app_private.incident_no_counters
        where counter_year = target_year
        for update;

        if counter_value > 9999 then
          raise exception 'Incident number counter exhausted for year %', target_year
            using errcode = '22000';
        end if;

        update app_private.incident_no_counters
        set
          next_counter = counter_value + 1,
          updated_at = now()
        where counter_year = target_year;

        return format('INC-SHF-%s-%s', target_year, lpad(counter_value::text, 4, '0'));
    end;
  end loop;
end;
$$;

create or replace function app_private.assign_incident_no()
returns trigger
language plpgsql
security definer
set search_path = app_private, public
as $$
begin
  if tg_op = 'INSERT' then
    new.incident_no := app_private.next_incident_no();
  end if;

  return new;
end;
$$;

drop trigger if exists assign_incident_no on public.incidents;
create trigger assign_incident_no
before insert on public.incidents
for each row
execute function app_private.assign_incident_no();
