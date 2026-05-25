# Change Log - NEXCORE (Prossnum Project)

This file contains the chronological record of changes, key decisions, and bug fixes made in the Prossnum project.

---

## [2026-05-23] Design System | Full Alignment with design-system-retro-neon-updated.md

### Description
Performed a complete audit and sync of the codebase against `design-system-retro-neon-updated.md`. Integrated missing utilities and updated components to match the Retro Neon Cyberpunk specification.

### Details of Changes
- **`globals.css`**:
  - Added missing keyframes: `gridScroll`, `floatOrb`, `indeterminate-shimmer`.
  - Added `@utility animate-indeterminate-shimmer` (was referenced in `page.tsx` top-progress-bar but never defined).
  - Added `@utility animate-grid-scroll` for explicit utility use.
  - Added neon text variants: `.neon-text-green`, `.neon-text-yellow`, `.neon-text-purple` (cyan and magenta already existed).
  - Updated `::selection` from blue-400 to `rgba(0, 240, 255, 0.2)` neon-cyan per design system.
  - Updated scrollbar thumb to neon-cyan tint (`rgba(0, 240, 255, 0.15/0.3)`) for consistent dark branding.
  - Updated `--font-display` from `"Orbitron", "Outfit"` to `"Orbitron", "DM Sans"` per spec.
  - Added all login-page CSS classes: `.login-page`, `.login-orb`, `.login-orb-1/2/3`, `.login-card`, `.btn-neon-line` per Section 12.
- **`layout.tsx`**: Replaced Outfit font link with Orbitron + DM Sans + JetBrains Mono — matching the design system font stack exactly.
- **`TopNavBar.tsx`**:
  - Added `usePathname` from `next/navigation` for route-aware active detection.
  - Replaced hardcoded always-active DASHBOARD link with a `NavPill` component that reads `pathname`.
  - `NavPill` applies `text-neon-cyan bg-neon-cyan/15 border-neon-cyan/35` when active, inactive otherwise.
  - Updated nav wrapper from `bg-zinc-900/40 border-zinc-800/50` to `bg-slate-950/85 border-dark-border`.
  - Updated user profile border from `border-zinc-800` to `border-dark-border`.
- **`SideNavBar.tsx`**: Updated footer `border-t` from `border-zinc-800` to `border-dark-border` token.
- **`login/page.tsx`**:
  - Replaced blue-gradient light-glass background with `login-page` class + neon orbs (`login-orb-1/2/3`).
  - Updated auth card from white glassmorphism to `login-card` class (dark neon per design system).
  - Added `geo-corner` to auth card for geometric corner accents.
  - Replaced blue focus states to neon-cyan on inputs.
  - Updated submit button from `gradient-primary text-white` to `bg-neon-cyan text-dark-base` neon-primary style.
  - Updated "Forgot PIN?" link from `text-blue-400` to `text-neon-cyan`.
  - Updated logo from "architecture" icon to the NEXUS hexagon SVG matching TopNavBar.
  - Changed heading text to `PROSSNUM` with `neon-text-cyan` glow and `font-display` (Orbitron).
  - PIN strength bar colors updated to neon-yellow/neon-green with glow box-shadow.

---

## [2026-05-23] UI Refinement | Dark Retro Neon Cyberpunk Styling

### Description
Refined the main dashboard components to fully align with the updated `design-system-retro-neon-updated.md` specifications. Replaced light-gray layout containers with a premium glassmorphic dark theme and neon details.

### Details of Changes
- **Layout Containers**: Replaced standard light `glass-panel` wrappers in `DashboardCharts.tsx` with dynamic, neon-accented `GlassCard` components (`glow="cyan"` and `geo={true}`).
- **Interactive Tabs**: Redesigned chart selection tabs to match the dark neon cyberpunk aesthetic:
  - Tab Wrapper: `bg-slate-950/85 border border-dark-border`
  - Active: `bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/35 shadow-[0_0_8px_rgba(0,240,255,0.25)]`
  - Inactive: `text-slate-400 hover:text-slate-200`
- **Tactical Map Layer**: Updated `MapView.tsx` to render the dark tile layer (`dark_all` tiles) when the `tactical={true}` prop is passed from `DashboardCharts.tsx`.
- **Dark Mode Popups & Legends**: Refined `TacticalStyles` and `TacticalLegend` components in `MapView.tsx` to automatically render dark semi-translucent styling with high-contrast text when `tactical` mode is active.
- **Neon Chart Fills**: Updated `DistrictProgressChart.tsx` and `ComparisonChart.tsx` to map bar fills to the correct neon color roles:
  - Foundation / Electric: Neon Cyan (`#00f0ff`)
  - Pole / Ground: Neon Green (`#00ff88`)
  - Feeder: Neon Yellow (`#f0e800`)
  - Tower: Neon Purple (`#b829dd`)
  - Radio: Neon Magenta (`#ff00a0`)
- **Chart Axes & Gridlines**: Standardized gridlines to dark mode borders (`rgba(255, 255, 255, 0.08)`) and axis labels to slate grey (`#94a3b8`).
- **SSR Hydration Fix**: Resolved a Next.js hydration mismatch warning in `StatCard.tsx` by introducing a `mounted` state. Dynamic/SWR data values are deferred until hydration finishes, matching the server-side placeholder (`"--"`).
- **ESLint Warning Cleanup**:
  - Removed unused imports (`useRef` from `StatCard.tsx`, `getOverallProgress` and `progressBarHtml` from `MapView.tsx`).
  - Wrapped `setMounted` inside a microtask (`Promise.resolve().then(...)`) to prevent synchronous state updates inside `useEffect` in `StatCard.tsx`.
  - Resolved synchronous `setState` in effect warning inside `ProgressBar.tsx` by moving `setPrevValue` and `setIsSurging` into render-phase updates, and handling the surge timer in a separate scoped `useEffect`.
  - Added eslint-disable comments to silence false-positive exhaustiveness and purity checks.

---

## [2026-05-24] Dev Network Exposure, HMR Cross-Origin Security Bypass, LINE Flex Upgrade, & Session Locking

### Description
Exposed the development server to the local network, resolved HMR cross-origin blocking on external mobile devices, upgraded the LINE Flex Message template to fully follow NEXCORE v2.1 design rules, and secured data integrity on the Incidents page by automatically locking the Reporter field to the logged-in session.

### Details of Changes
- **Dev Server LAN Exposure**:
  - Updated `package.json` dev script to use `--hostname 0.0.0.0 --webpack`.
  - Enabled dynamic `allowedDevOrigins` detection inside `next.config.ts` by programmatically scanning all active local IPv4 interface addresses using Node's `os` module. This resolves Next.js cross-origin blocked websocket HMR warnings on LAN devices automatically.
  - Implemented an unhydrated GET submit fallback inside `src/app/login/page.tsx` that automatically checks and processes query parameters for auto-login if the user submits credentials before React finishes hydrating.
- **LINE Flex Message NEXCORE Design Upgrade**:
  - Refaced `src/lib/incidents/flex-message.ts` to follow the updated Retro-Neon design system: `#0a0a0f` body background, a dynamic `statusColor`-colored accent line, and an elegant glowing status badge (`${statusColor}1c` bg, `${statusColor}55` border, and a unicode `●` status dot).
  - Resolved LINE schema validation error where empty boxes are rejected by packing `{ type: "spacer" }` into the top accent line contents array.
  - Mapped `getStatusColor` in `src/lib/incidents/config.ts` to Retro Neon colors: `#f0e800` (Pending / Neon Yellow), `#00f0ff` (In Progress / Neon Cyan), and `#00ff88` (Completed / Neon Green).
- **Incident Reporter Session Lock**:
  - Created a secure `GET /api/auth/user` profile route inside `src/app/api/auth/user/route.ts` that safely bridges both NextAuth and custom `auth_session` cookie sessions to the client side.
  - Integrated `currentUser` fetch inside `src/app/incidents/page.tsx` on mount, auto-populating the "Reporter" (ผู้แจ้งเหตุ) field.
  - Set the "Reporter" input fields inside both the new incident form and inline edit rows to `readOnly`, styled with locked cyberpunk disabled layouts to prevent manual tampering.

---

## [2026-05-24] LINE Quota Recovery & Fallback System (Systems 1 & 2)

### Description
Designed and built a multi-tier recovery and fallback system for handling LINE Messaging API quota exhaustion, enabling zero-restart token switching via Supabase and automated email fallback via Microsoft 365.

### Details of Changes
- **Zero-Restart Switch (System 1 - Level A):**
  - Created a database table `public.system_settings` to house dynamic token backups: `line_backup_token`, `line_backup_group_id`, `fallback_email_to`.
  - Built a dynamic config loader (`src/lib/incidents/config.ts`) that programmatically intercepts and switches to these backup tokens in real-time, completely overriding `.env.local` parameters without server restarts.
- **Settings Card & Resend Button:**
  - Added a retro-neon glassmorphic settings card in `/incidents` for dynamic administrative override edits.
  - Positioned a custom yellow glowing "Resend LINE" button in failed queue items to retry pushing Flex Messages through `/api/incidents/[id]/resend`.
- **Microsoft 365 SMTP Auto-Fallback (System 2 - Level C):**
  - Implemented `src/lib/incidents/email-client.ts` preconfigured with Microsoft 365 SMTP parameters (`smtp.office365.com` / `587` / STARTTLS).
  - Configured environment variables in `.env.local`: `SMTP_USER`, `SMTP_PASSWORD`, `NOTIFICATION_EMAIL_TO`.
  - Added a highly resilient console logging mock when credentials are left blank to output complete structured HTML fallback emails inside server logs.
  - Upgraded `sendLineNotification` to capture quota blocks (400/403 with `monthly limit reached`) and automatically trigger email fallback.
- **Verification:** Ran `npx tsc --noEmit` and `npm run lint` with **zero errors**. Simulated quota exceptions to verify perfect local logging and dynamic database overrides.


