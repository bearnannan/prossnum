# Repository Index - NEXCORE (Prossnum Project)

This index provides a one-line catalog of key pages, components, and hooks within the Prossnum webapp.

## Core Pages
- **[page.tsx](file:///d:/APP/prossnum/webapp/src/app/page.tsx)**: Main dashboard page organizing stats, charts, maps, and tables into a premium Bento-Grid layout.
- **[login/page.tsx](file:///d:/APP/prossnum/webapp/src/app/login/page.tsx)**: Authentication entry page styled with neon-lit retro cyberpunk radial gradients, featuring dynamic unhydrated query parameter auto-login fallback.
- **[incidents/page.tsx](file:///d:/APP/prossnum/webapp/src/app/incidents/page.tsx)**: Incident management operations page featuring the "LINE Bot Settings" configuration card and interactive glowing resend controls.
- **[api/auth/user/route.ts](file:///d:/APP/prossnum/webapp/src/app/api/auth/user/route.ts)**: Session endpoint that dynamically discovers the active authenticated user details across NextAuth and cookie-based auth sessions.
- **[api/settings/route.ts](file:///d:/APP/prossnum/webapp/src/app/api/settings/route.ts)**: RLS-secured dynamic settings controller allowing live configuration edits to Supabase in real-time.
- **[api/incidents/[id]/resend/route.ts](file:///d:/APP/prossnum/webapp/src/app/api/incidents/%5Bid%5D/resend/route.ts)**: Manual retry endpoint that programmatically builds Flex Messages and pushes notification retry requests on demand.
- **[lib/incidents/config.ts](file:///d:/APP/prossnum/webapp/src/lib/incidents/config.ts)**: Real-time configuration loader fetching dynamic Supabase override variables.
- **[lib/incidents/email-client.ts](file:///d:/APP/prossnum/webapp/src/lib/incidents/email-client.ts)**: Microsoft 365 SMTP email alert client supporting secure STARTTLS submission and high-contrast developer logging fallback.
- **[lib/incidents/line-client.ts](file:///d:/APP/prossnum/webapp/src/lib/incidents/line-client.ts)**: Active LINE notifier catching quota limitation failures and auto-routing fallback alerts to Email.


## Key UI Components
- **[GlassCard.tsx](file:///d:/APP/prossnum/webapp/src/components/ui/GlassCard.tsx)**: Base layout container implementing glassmorphic backdrops, glowing borders, and geometric corner accents.
- **[DashboardCharts.tsx](file:///d:/APP/prossnum/webapp/src/components/DashboardCharts.tsx)**: Toggle wrapper switching between the district average progress chart and the comparison chart.
- **[DistrictProgressChart.tsx](file:///d:/APP/prossnum/webapp/src/components/DistrictProgressChart.tsx)**: Vertical bar chart visualizing average progress percentages by district.
- **[ComparisonChart.tsx](file:///d:/APP/prossnum/webapp/src/components/ComparisonChart.tsx)**: Multi-bar chart comparing relative sub-system completion stages side-by-side.
- **[MapView.tsx](file:///d:/APP/prossnum/webapp/src/components/MapView.tsx)**: Leaflet map plotting active installations using pulsating status markers and dynamic tactical/light overlays.
- **[StatCard.tsx](file:///d:/APP/prossnum/webapp/src/components/StatCard.tsx)**: Interactive metrics tile with dynamic cursor spotlight tracking and custom neon glow presets.
- **[StatGrid.tsx](file:///d:/APP/prossnum/webapp/src/components/StatGrid.tsx)**: Responsive grid laying out primary completion metrics inside stat tiles.

## Logic & Hooks
- **[useDashboard.ts](file:///d:/APP/prossnum/webapp/src/hooks/useDashboard.ts)**: Core logic hook aggregating district percentages, search queries, and sync states.
- **[useMissionControl.ts](file:///d:/APP/prossnum/webapp/src/hooks/useMissionControl.ts)**: Data-fetching coordinator mapping raw database assets to type-safe client structures.
- **[useRealtime.ts](file:///d:/APP/prossnum/webapp/src/hooks/useRealtime.ts)**: Realtime listener listening to live Supabase inserts and updates.
