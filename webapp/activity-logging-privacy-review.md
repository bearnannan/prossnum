# Activity Logging Privacy and Security Review

## Scope

The activity logging layer records operational telemetry for page views, navigation, UI clicks, authentication events, incident mutations, settings changes, exports, and security-relevant failures. Runtime writes now target `public.user_activity_logs`.

## Access Model

- Admin review should use authenticated dashboard access only.
- Server read access is exposed through `/api/activity/logs`, guarded by `getAppUser()`.
- Direct database reads should remain restricted by Supabase RLS and service-role-only backend access.
- Unauthorized access attempts against activity log APIs are logged as `security` events.

## Data Minimization

- Store route, event type, event name, target identifiers, session identifier, user agent, IP address, and compact metadata needed for operations.
- Do not store access tokens, LINE secrets, passwords, one-time codes, full message payloads, or exported document contents.
- Settings-change logs should record changed field names and operation status, not secret values.
- Failed-auth logs should record provider/error codes and coarse context only.

## Retention Policy

Recommended default retention:

- Security/auth events: 180 days.
- Incident mutation and settings-change events: 180 days.
- Page views, navigation, and button-click telemetry: 90 days.
- Debug-only metadata: 30 days, or omit from production.

Implement scheduled pruning before enabling broad production telemetry.

## IP and User-Agent Handling

- IP address and user agent are useful for security diagnostics but are personal data in many jurisdictions.
- Limit visibility to admins.
- Avoid displaying IPs broadly in operational views unless needed for investigation.
- Consider hashing or truncating IPs for non-security analytics after production requirements are confirmed.

## Redaction Checklist

- Redact `authorization`, `cookie`, `access_token`, `refresh_token`, `line_backup_token`, `password`, `secret`, and webhook payload bodies.
- Store only field names for configuration changes.
- Store incident IDs and public incident numbers instead of free-form descriptions when possible.
- Review export/download metadata so file contents are never embedded in activity logs.

## Remaining Governance Work

- Add a database retention job or scheduled maintenance script.
- Confirm admin-only role enforcement beyond basic authenticated-user checks.
- Document whether IP address storage is required for the deployment environment.
- Add production monitoring for activity-log write failures.
