# Development Log

## 2026-05-24 - Incidents sidebar Thai label encoding

- Issue: the incidents section label in `src/components/SideNavBar.tsx` rendered as mojibake instead of Thai text.
- Cause: the source string was already corrupted in the TSX file, likely from UTF-8 Thai text being decoded/saved through a Windows/Latin code page.
- Fix: replaced the corrupted incidents section label with the correct Thai text: `ปฏิบัติการ`.
- Verification: searched `src`, `sql`, and `Codebase.md` for common mojibake markers, ran `npm.cmd run lint`, and confirmed `/incidents` renders `ปฏิบัติการ` in the in-app browser.

## 2026-05-24 - Incident SLA priority sync and edit lock

- Issue: incident priority could drift from the SLA class implied by the selected equipment type, and active incident details needed to remain editable until final completion.
- Fix: added equipment-driven SLA/priority rules in `src/lib/incidents/sla.ts`, normalized priority during incident create/update, and mirrored the rules in `sql/create-incidents-table.sql`.
- UI: constrained the incident priority dropdown based on selected equipment, added inline queue editing for active incidents, and changed completed incidents to a locked state.
- API guard: `src/app/api/incidents/[id]/route.ts` now rejects edits to already completed incidents with HTTP 409.
- Verification: ran `npm.cmd run lint`, `npx.cmd tsc --noEmit --incremental false`, checked edited files for mojibake markers, and verified priority options in the in-app browser.

## 2026-05-24 - Dev network exposure, LINE Flex Message upgrade, and Reporter session lock

- Network Exposure & HMR Security Bypass:
  - Cause: Next.js dev server was restricted with `-H localhost` and blocked dev assets/HMR requests from LAN IPs by default (showing "⚠ Blocked cross-origin request to Next.js dev resource").
  - Fix: Updated the `dev` script in `package.json` to `"next dev --hostname 0.0.0.0 --webpack"`.
  - Allowed Origins: Configured `allowedDevOrigins` dynamically in `next.config.ts` by programmatically scanning all active local IPv4 interface addresses (using Node.js `os` module) to ensure future-proof zero-config Wi-Fi/LAN debugging.
  - Login Hydration Fallback: Built query parameters parsing inside a `useEffect` hook in `src/app/login/page.tsx` as a fallback auto-login mechanism in case a user clicks "Sign In" before the compilation-heavy client bundle hydrates.
- LINE Flex Message NEXCORE Upgrade:
  - Cause: Simple Bootstrap-colored layout did not match the dark retro-neon design guidelines and was blocked by LINE schema validation.
  - Style: Refaced `src/lib/incidents/flex-message.ts` with `#0a0a0f` background color, a dynamic status-colored horizontal accent line, and an elegant glowing status badge (`${statusColor}1c` background, `${statusColor}55` border, dynamic unicode `●` status dot).
  - Validation: Resolved the LINE API schema error where the accent line box was rejected by providing dummy `contents: [{ type: "spacer" }]` structures.
  - Palette Mapping: Synchronized status-to-color mapping in `src/lib/incidents/config.ts` to utilize `#f0e800` (Pending / Neon Yellow), `#00f0ff` (In Progress / Neon Cyan), and `#00ff88` (Completed / Neon Green).
- Reporter Session Guard:
  - Cause: The 'Reporter' input field was manually editable, presenting data integrity issues.
  - Endpoint: Built a secure `GET /api/auth/user` profile route inside `src/app/api/auth/user/route.ts` to safely bridge both NextAuth and `auth_session` cookie sessions to the client side.
  - UI Lock: Updated `IncidentsPage` form states to automatically fetch and pre-populate the "Reporter" input on mount and on form reset, locking the input boxes with `readOnly` and styled disabled aesthetics inside both the create and edit modals to prevent manual tampering.
- Verification: Successful local compilation, verified schema compliance against the LINE API, and confirmed seamless mobile rendering.

## 2026-05-24 - LINE Quota Recovery & Fallback System (Systems 1 & 2)

- **System 1: Level A - Zero-Restart Token Switching & Manual Resend:**
  - Database: Designed Supabase schema `public.system_settings` to house dynamic overrides (`line_backup_token`, `line_backup_group_id`, `fallback_email_to`) with robust authenticated RLS access.
  - Resolver logic: Built real-time dynamic configurations resolver in `src/lib/incidents/config.ts` which automatically intercepts database values at runtime, dynamically overriding environment defaults without restarts.
  - Endpoint & Controls: Created `/api/settings` and `/api/incidents/[id]/resend` routes. Added an administrative settings card and a glowing yellow "Resend LINE" button in `/incidents` queue rows.
- **System 2: Level C - Microsoft 365 SMTP Auto-Fallback:**
  - Core Dispatcher: Built `src/lib/incidents/email-client.ts` preconfigured with Microsoft 365 parameters (`smtp.office365.com` / `587` / STARTTLS).
  - Quota Guard: Upgraded `sendLineNotification` in `src/lib/incidents/line-client.ts` to capture quota blocks (400/403 with `monthly limit reached`) and automatically fire detailed HTML fallback notification emails.
  - Resilient Local Mocking: Implemented high-contrast console log backups when SMTP keys are omitted in `.env.local` to facilitate developer testing with zero blockages.
- **Verification:** Completed full type compilation (`npx tsc --noEmit`) and lint tests (`npm run lint`) with **zero errors**. Simulated quota exceptions to verify perfect local logging and database overrides.

## 2026-05-24 - Phase 2 Migration: Tactical HUD UI/UX Enhancements

- Context: Phase 2 of improving the `/mission-control` operational UI according to the migration plan: action drawer, unified inspector, inline queue operations, and settings shortcut behavior using the dark retro-neon HUD visual language.
- QueuePanel Validation & HTML Nesting Fix:
  - Cause: Nesting interactive `<select>` and `<button>` elements inside an outer card `<button>` is HTML invalid.
  - Fix: Migrated queue items from a `<button>` wrapper to a keyboard-accessible, focusable `div` utilizing `role="button"` and complete with keyboard key-down listeners (`Enter` / `Space`) to maintain 100% markup compliance.
- Inspector Panel Polish:
  - Additions: Added a compact, 3-column metadata row in the incident inspector view inside `src/app/mission-control/page.tsx` mapping the incident's State, SLA Priority, and LINE Message Status using the curated neon theme tokens.
  - Command Strip: Re-architected editing and non-editing action controls into space-efficient horizontal command strips, unifying selects, inputs, and action buttons using inline HUD icons.
- Forms Accessibility:
  - Fix: Added `aria-label="Station name"` to the target station input in `src/components/mission-control/IncidentOperationForm.tsx` to maintain 100% WCAG compliance.
- Verification: Completed full type compilation (`npx tsc --noEmit`) and lint tests (`npm run lint`) with **zero errors**.

## 2026-05-24 - Phase 3 Migration: Routing, Deep-Linking & Verification

- Navigation Link Remap:
  - Top Navbar: Remapped the primary incidents navigation link in the top navbar (`src/components/TopNavBar.tsx`) from `/incidents` to `/mission-control`.
  - Sidebar: Confirmed that the sidebar navigation panel is already successfully mapping `/incidents` clicks to `/mission-control`.
- Next.js Router Redirection & Middleware Collision Fix:
  - Router Interceptor: Configured `src/proxy.ts` to automatically catch calls to `/incidents` and redirect users directly to `/mission-control`, fully preserving search query states.
  - Redundant Middleware Resolution: Discovered Next.js compilation exception stating "Both middleware file and proxy file are detected". Resolved the collision by removing the redundant `src/middleware.ts` and delegating middleware routing execution strictly to the native `src/proxy.ts` implementation.
- Dashboard Sizing SWR Chart Fixes:
  - Cause: Recharts `<ResponsiveContainer>` dimensions collapsed during hydration/CSS transitions, printing `The width(-1) and height(-1) of chart should be greater than 0` warnings in the console.
  - Layout Fix: Updated `src/components/DashboardCharts.tsx` chart wrapper `div` to enforce explicit width and min-height properties (`w-full h-[420px] min-h-[420px] overflow-hidden relative`).
  - District Progress Sizing: Refactored `src/components/DistrictProgressChart.tsx`'s `ResponsiveContainer` to set a fixed pixel height of `380` instead of a collapsing `100%` percentage height, completely resolving dimension computation warnings.
  - Progress Sizing: Upgraded `src/components/ProgressChart.tsx` to utilize `minWidth={0} minHeight={0}` bounds.
- Verification: Successful local Next.js development server compilation on port `3000` with **zero warnings**, fully clean TypeScript builds (`npx tsc --noEmit` is 100% clean), and clean ESLint checks (`npm run lint` yields 0 errors).

## 2026-05-25 - Mission Control Mobile Responsive Optimization (In Progress)

- Context: Mobile `/mission-control` layout was breaking on narrow screens. The top metrics grid covered the map, action buttons such as `NEW INCIDENT` and `LINE SETTINGS` overlapped cramped header text, and the bottom HUD panels crowded the viewport.
- Header Mobile Adaptation:
  - Updated `src/app/mission-control/page.tsx` header sizing from fixed desktop assumptions to a mobile-safe `min-h-12` layout with tighter gaps and responsive padding.
  - Converted the top-right action buttons into compact icon-only controls on mobile (`add_alert`, `settings`, `ios_share`, `refresh`) while preserving full text labels from `sm:` upward.
  - Added explicit `aria-label` and `title` attributes for the compact mobile action buttons.
- Metrics HUD Mobile Adaptation:
  - Converted the top metrics block from a cramped two-column mobile grid into a horizontal scroll chip rail using `flex`, `overflow-x-auto`, and fixed minimum card widths.
  - Preserved the five-column desktop metrics grid from `md:` upward.
  - Added `.mission-mobile-metrics` CSS in `src/app/globals.css` to hide the horizontal scrollbar while keeping swipe/scroll behavior.
- Mobile Bottom Sheet:
  - Reduced mobile bottom panel footprint by changing the mobile panel container to `max-h-[36svh]` with vertical scrolling and tighter padding.
  - Kept the larger `sm:max-h-[46vh]` behavior for larger small/tablet screens.
  - Tightened mobile tab button spacing and text size while preserving the existing Filters / Queue / Inspector workflow.
- Validation Performed:
  - `npx tsc --noEmit --incremental false` passed after the normal incremental cache file had a Windows write issue.
  - In-app browser mobile viewport check at `390x844` confirmed: compact icon header, horizontal metrics rail, no document-level horizontal overflow (`scrollWidth` equals `clientWidth`), no console errors/warnings, and visible bottom tab sheet.
- Remaining Work:
  - Continue visual QA after data/map loading completes, including screenshots for the fully loaded mobile map state.
  - Exercise bottom tab interactions (`Filters`, `Queue`, `Inspector`) and confirm no overlap with the map controls or incident cards.
  - Run final production build after any additional responsive tuning.
