# Codebase Overview

เอกสารนี้สรุปโครงสร้างและ flow หลักของ `webapp` ซึ่งเป็น Next.js dashboard สำหรับติดตามความคืบหน้างานสถานีและระบบลูกข่ายของ Prossnum

## Tech Stack

- Framework: Next.js 16 App Router, React 19, TypeScript
- Styling/UI: Tailwind CSS v4, Radix/shadcn-style components, Framer Motion
- Data: Supabase client SDK, Supabase Realtime
- Auth: NextAuth v5 with LINE provider และ custom PIN cookie route
- Data fetching: SWR with IndexedDB-backed cache
- Offline support: IndexedDB via `idb-keyval`
- Reports: `html-to-image`, `jspdf`
- Maps: React Leaflet, Leaflet static/export fallback via Google Static Maps proxy
- PWA: `@ducanh2912/next-pwa`, generated files emitted into `public`

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npx tsc --noEmit --incremental false
```

On Windows PowerShell, `npm.ps1` may be blocked by execution policy. Use:

```bash
npm.cmd run lint
npx.cmd tsc --noEmit --incremental false
```

## Top-Level Files

- `package.json`: npm scripts and runtime/dev dependencies.
- `next.config.ts`: wraps Next config with PWA output to `public`; sets `outputFileTracingRoot`.
- `eslint.config.mjs`: Next ESLint config, ignores generated/vendor/debug artifacts.
- `tsconfig.json`: strict TypeScript config with `@/*` mapped to `src/*`.
- `src/auth.ts`: NextAuth setup using LINE provider.
- `src/proxy.ts`: request proxy/middleware-style auth guard.

## Source Layout

```text
src/
  app/
    page.tsx                    Main dashboard
    login/page.tsx              Login UI
    incidents/page.tsx          Incidents dashboard & configuration settings panel
    mission-control/page.tsx    Full-screen tactical map/HUD view
    report/page.tsx             Report preview/export page
    api/
      auth/route.ts             Custom district/PIN login
      auth/logout/route.ts      Custom logout cookie clearing
      auth/user/route.ts        Auth session bridge (NextAuth / cookie)
      dashboard-data/route.ts   CRUD API for station/client datasets
      proxy-map/route.ts        Proxy for static map export image
      settings/route.ts         GET/POST settings table configurations in Supabase
      incidents/[id]/resend/route.ts POST to manually retry failed notification
  components/
    Dashboard*.tsx              Dashboard composition, table, charts
    *Chart*.tsx                 Recharts visualizations
    *Modal.tsx                  Station/client edit and export flows
    MapView.tsx                 Leaflet map rendering
    Export*.tsx                 PDF/JPEG/TXT report rendering
    ui/                         Reusable UI primitives and badges
    motion/                     Motion helpers
  hooks/
    useDashboard.ts             Filter/sort/progress derivation
    useExport.tsx               TXT/PDF/JPEG export orchestration
    useRealtime.ts              Supabase realtime subscription + SWR invalidation
    useOfflineSync.ts           Online/offline sync state
    useMissionControl.ts        Mission Control Supabase data loader
  lib/
    supabase.ts                 Supabase browser client
    offline-sync.ts             IndexedDB mutation queue and replay
    audit.ts                    Audit log writes
    utils.ts                    Shared UI utilities
    incidents/
      config.ts                 Dynamic override settings resolver
      email-client.ts           Microsoft 365 SMTP and mock logging email client
      flex-message.ts           Cyberpunk Retro-Neon LINE Flex Message template
      line-client.ts            LINE Messaging API notifier with automated fallback
      sla.ts                    SLA durations and priority constraints
  config/
    incident.config.ts          Priority/status display config
```

## Main Dashboard Flow

`src/app/page.tsx` is the primary application screen.

1. `DashboardContent` keeps UI state such as active dataset, search, selected province, modals, chart tab, and pending transitions.
2. SWR fetches `/api/dashboard-data?dataset=station|client`.
3. Pending offline mutations from `lib/offline-sync.ts` are merged into the fetched data for optimistic UI.
4. `useDashboard` derives provinces, districts, filtered rows, sorted rows, and overall progress.
5. `StatGrid`, `DashboardCharts`, and `DashboardTable` render the main dashboard.
6. `StationModal` and `ClientSystemModal` handle create/edit forms.
7. `useRealtime` subscribes to Supabase table changes and revalidates the matching SWR key.
8. `ExportModal` and `useExport` handle user-selected report output.

## Data Model

The central public TypeScript interfaces live in `src/app/api/dashboard-data/route.ts`:

- `StationData`: infrastructure/station progress, foundation progress, pole progress, coordinates, station metadata.
- `ClientSystemData`: client system installation progress, electrical/ground/feeder/radio/meter fields, coordinates, station metadata.

The API route maps Supabase snake_case rows into frontend camelCase data.

Important Supabase tables used by the code:

- `stations`
- `client_systems`
- `audit_logs`

## API Flow

`src/app/api/dashboard-data/route.ts` exposes CRUD handlers:

- `GET`: loads either `stations` or `client_systems`, maps rows to frontend shape, returns `{ data }`.
- `POST`: inserts station/client rows and writes an audit log.
- `PUT`: updates station/client rows and writes an audit log.
- `DELETE`: deletes from the selected table and writes an audit log.

Dataset routing is controlled by the `dataset` query param:

```text
/api/dashboard-data
/api/dashboard-data?dataset=station
/api/dashboard-data?dataset=client
```

## Auth Flow

There are two auth mechanisms in the codebase:

- `src/auth.ts`: NextAuth with LINE OAuth provider. Sessions copy `token.sub` into `session.user.id`.
- `src/app/api/auth/route.ts`: custom district/PIN login that sets an `auth_session` HTTP-only cookie.
- `src/app/api/auth/user/route.ts`: custom endpoint that exposes the current active user profile (supporting both cookie-based and OAuth-based sessions) to the client.

`src/proxy.ts` guards non-public routes by checking either:

- `auth_session`
- `authjs.session-token`
- `__Secure-authjs.session-token`

Public paths are `/login` and `/api/auth/*`. Authenticated users visiting `/login` are redirected to `/`.

## Offline Sync

Offline mutation support is implemented in `src/lib/offline-sync.ts`.

- `addMutation` stores POST/PUT/DELETE operations in IndexedDB under `offline-mutations`.
- `getQueue` and `getQueueForDataset` read pending work.
- `processSync` replays queued mutations to `/api/dashboard-data` when online.
- `useOfflineSync` monitors browser online/offline events, tracks pending count, and triggers replay.

The main dashboard also merges pending queued mutations into UI data so offline changes appear immediately.

## Realtime Updates

`src/hooks/useRealtime.ts` subscribes to Supabase Postgres changes.

When a row changes:

1. Optional `onUpdate` callback runs.
2. SWR cache is revalidated for the dataset key.
3. A toast is shown when enabled.

The main dashboard subscribes to:

- `stations` for `dataset=station`
- `client_systems` for `dataset=client`

## Reporting And Export

Export logic lives primarily in:

- `src/hooks/useExport.tsx`
- `src/components/ExportModal.tsx`
- `src/components/ExportBentoReport.tsx`
- `src/components/ExportChartStatic.tsx`
- `src/components/ExportMapStatic.tsx`
- `src/app/report/page.tsx`

Supported formats:

- TXT: builds a Thai text summary grouped by district.
- PDF: renders `ExportBentoReport` offscreen, captures it with `html-to-image`, and writes pages using `jspdf`.
- JPEG: same offscreen render approach, then downloads JPEG images per district.

`ExportMapStatic` uses Google Static Maps through `/api/proxy-map` for report-safe map images.

## Mapping

`src/components/MapView.tsx` renders interactive maps with React Leaflet.

Key behavior:

- Computes status from progress fields.
- Uses custom SVG marker icons.
- Auto-fits map bounds to valid coordinates.
- Supports tactical mode for Mission Control.
- Supports asset selection through `onSelect`.

`src/app/mission-control/page.tsx` composes a full-screen map view with:

- dataset layer switcher
- live metrics
- selected asset inspector
- realtime-style HUD panels

## UI Composition

The dashboard is organized into focused components:

- `StatGrid`: summary cards and progress metrics.
- `DashboardCharts`: chart/map area wrapper.
- `DistrictProgressChart`, `ComparisonChart`, `ProgressChart`: chart views.
- `DashboardTable`: searchable/sortable row list with edit/delete/export actions.
- `TopNavBar`, `SideNavBar`: layout navigation.
- `Toast`, `Skeleton`, `ErrorBoundary`: app-level UX utilities.
- `ui/*`: reusable primitives and domain badges.

## Environment Variables

Required or expected variables include:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
AUTH_LINE_ID=
AUTH_LINE_SECRET=
MASTER_PIN=
NEXTAUTH_SECRET= # or Auth.js equivalent secret, depending on deployment setup
SMTP_USER=       # Corporate Office 365 sender address (e.g. name@forth.co.th)
SMTP_PASSWORD=   # Sender account password or app-specific MFA key
NOTIFICATION_EMAIL_TO= # Target team address(es) for incident fallback alerts
```

The Supabase anon key is intentionally public, but the database must enforce Row Level Security.

## Generated And Vendor-Like Files

These are not useful to lint/edit manually:

- `public/sw.js`
- `public/workbox-*.js`
- `stringify-object/**`

They are ignored by ESLint because they are generated or vendored artifacts.

## Testing And Verification

Current verification commands:

```bash
npm.cmd run lint
npx.cmd tsc --noEmit --incremental false
```

For UI changes, also run the app locally:

```bash
npm run dev
```

Then verify:

- dashboard loads both `station` and `client`
- add/edit/delete works online
- export modal can generate TXT/PDF/JPEG
- map markers render and fit bounds
- Mission Control loads without SSR map errors

## Notes For Future Changes

- Keep Supabase row mapping centralized in `src/app/api/dashboard-data/route.ts` or a shared data-mapper module if it grows.
- The app still contains permissive `any` usage around dashboard/export data. Tightening this should be done as a focused typing refactor, not as a mechanical lint rewrite.
- Auth currently mixes NextAuth and custom PIN-cookie login. Changes to route protection should account for both cookies.
- Offline sync stores raw payloads. If API payload shape changes, update `OfflineMutation` handling and replay logic together.
- Report export depends on exact rendered dimensions (`1122x794`) and delayed offscreen rendering. Be careful changing report layout, fonts, or map image loading.

## Development Log

### 2026-05-24 - Incidents sidebar Thai label encoding

- Issue: the incidents section label in src/components/SideNavBar.tsx rendered as mojibake instead of Thai text.
- Cause: the source string was already corrupted in the TSX file, likely from UTF-8 Thai text being decoded/saved through a Windows/Latin code page.
- Fix: replaced the corrupted incidents section label with the correct Thai text: ปฏิบัติการ.
- Verification: searched src, sql, and Codebase.md for common mojibake markers, ran npm.cmd run lint, and confirmed /incidents renders ปฏิบัติการ in the in-app browser.

### 2026-05-24 - Incident SLA priority sync and edit lock

- Issue: incident priority could drift from the SLA class implied by the selected equipment type, and active incident details needed to remain editable until final completion.
- Fix: added equipment-driven SLA/priority rules in src/lib/incidents/sla.ts, normalized priority during incident create/update, and mirrored the rules in sql/create-incidents-table.sql.
- UI: constrained the incident priority dropdown based on selected equipment, added inline queue editing for active incidents, and changed completed incidents to a locked state.
- API guard: src/app/api/incidents/[id]/route.ts now rejects edits to already completed incidents with HTTP 409.
- Verification: ran npm.cmd run lint, npx.cmd tsc --noEmit --incremental false, checked edited files for mojibake markers, and verified priority options in the in-app browser.

### 2026-05-24 - LINE Quota Recovery & Fallback System (Systems 1 & 2)

- **Zero-Restart Token Switching Mechanism:**
  - Designed the `public.system_settings` Supabase table and backend loader (`src/lib/incidents/config.ts`) to fetch `line_backup_token` and `line_backup_group_id` dynamically at runtime, overriding environment defaults in real-time without server reloads or system restarts.
- **Glassmorphic Settings & Manual Resend Trigger:**
  - Added a "LINE Bot Settings" card on `/incidents` to manage backup credentials on the fly.
  - Placed a custom yellow glowing "Resend LINE" button in the queue table that re-dispatches Flex Messages for failed tickets through `/api/incidents/[id]/resend` using the dynamic override token.
- **Microsoft 365 SMTP Auto-Fallback:**
  - Integrated `nodemailer` configured for `@forth.co.th` using Microsoft 365 SMTP specifications (`smtp.office365.com` / `587` / STARTTLS).
  - Automatically intercepts LINE API quota block exceptions (400/403 with `monthly limit reached`) and triggers an elegant fallback HTML alert to `NOTIFICATION_EMAIL_TO`.
  - Added a highly resilient console logging mock when SMTP credentials are left blank in `.env.local` to facilitate seamless local developer testing.
- **Verification:**
  - Ran `npx tsc --noEmit` and `npm run lint` with **zero errors**.
  - Verified local environment console logs beautifully capture structured mock HTML alerts during simulated quota failures.

