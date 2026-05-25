# PROSSNUM System Audit

## 1. Technology Stack
The application is a modern web-based monitoring dashboard for station management.

- **Frontend Core**: Next.js 16.1.6 (using App Router)
- **Runtime**: Node.js with React 19.2.3
- **Styling**: Tailwind CSS v4
- **State Management**: React Hooks + SWR
- **Database/Storage**: Supabase (PostgreSQL + Realtime)
- **Authentication**: NextAuth.js v5 (Beta)
- **Maps & GIS**: Leaflet + MapLibre GL
- **Offline Support**: PWA + IndexDB

## 2. Main Skills to be Used
- `nextjs-app-router-patterns`: Architecture maintenance.
- `ui-ux-pro-max`: Premium design reasoning and generation (`ui-ux-pro-max-skill`).
- `memento-loop`: Automated reflection and error recovery (`Memento-Skills`).
- `caveman-prose`: token-efficient and fast agent communication (`caveman`).
- `diagram-mcp`: Architecture visualization (`drawio-mcp`).

## 3. Current Issues Fixed
- **Sheet Case Sensitivity**: Fixed mismatched sheet name (`station_data` -> `Stationdata`).
- **Column Mapping Error**: Resolved "Client System" update failure by aligning API payloads.
- **Supabase Migration**: Successfully migrated all data operations from Google Sheets to Supabase.
- **Dev LAN Exposure & Hydration**: Resolved Next.js HMR cross-origin blocking on local networks by dynamically discovering and authorizing all local IPv4 network interface addresses, and added an unhydrated GET submit fallback for mobile phone logins.
- **LINE Flex Message Upgrade**: Redesigned the LINE Flex template to match NEXCORE Retro-Neon aesthetics (glowing status badges, dark backgrounds, accent borders) while preserving LINE API validation compliance.
- **Incident Reporter Locking**: Added a secure `/api/auth/user` endpoint and locked the "Reporter" input boxes on `/incidents` to the current session (read-only) to protect data integrity.
- **LINE Quota Recoveries (Systems 1 & 2)**:
  - **Zero-Restart Switcher (Level A):** Implemented the `public.system_settings` Supabase table and live override resolver in `src/lib/incidents/config.ts` to seamlessly intercept and switch token backups in real-time without requiring system reboots. Added dynamic UI settings inputs and failed queue glowing "Resend LINE" triggers.
  - **Office 365 Auto-Fallback (Level C):** Created `src/lib/incidents/email-client.ts` configured for `@forth.co.th` using Microsoft 365 SMTP defaults (`smtp.office365.com` / `587` / STARTTLS) with a highly resilient terminal logging fallback, auto-pushing HTML fallback notification alerts upon LINE API limit exhaustion blocks.


## 4. Agent Integration Context
To ensure high performance and premium design, the agent now operates with:
- **Design Intelligence**: Utilizing `ui-ux-pro-max-skill` to enforce glassmorphism aesthetics and responsive layouts.
- **Reflective Learning**: Applying `Memento-Skills` logic to monitor and prevent regression.
- **Efficiency Mode**: Using `caveman` style for internal processing to reduce latency.
- **Backend Integrity**: Enforcing Supabase-only interactions for all new features.
