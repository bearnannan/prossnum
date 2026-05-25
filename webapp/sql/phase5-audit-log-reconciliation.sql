-- Phase 5 migration: reconcile legacy audit_logs into user_activity_logs.
-- Run after sql/phase3-user-activity-logs.sql.

do $$
begin
  if to_regclass('public.audit_logs') is not null then
    insert into public.user_activity_logs (
      event_type,
      event_name,
      user_id,
      user_name,
      user_source,
      target_type,
      target_id,
      metadata,
      created_at
    )
    select
      'mission_control',
      'legacy_dashboard_' || lower(coalesce(action::text, 'mutation')),
      user_id::text,
      user_name::text,
      'legacy_audit_logs',
      table_name::text,
      record_id::text,
      jsonb_build_object(
        'legacyTable', 'audit_logs',
        'action', action,
        'tableName', table_name,
        'recordId', record_id,
        'payload', coalesce(payload, '{}'::jsonb)
      ),
      coalesce(created_at, now())
    from public.audit_logs
    where not exists (
      select 1
      from public.user_activity_logs existing
      where existing.user_source = 'legacy_audit_logs'
        and existing.event_name = 'legacy_dashboard_' || lower(coalesce(public.audit_logs.action::text, 'mutation'))
        and existing.target_type = public.audit_logs.table_name::text
        and existing.target_id = public.audit_logs.record_id::text
        and existing.created_at = coalesce(public.audit_logs.created_at, now())
    );
  end if;
end $$;
