# Wiki Log
A chronological record of Prossnum evolution.

## [2026-04-19] System Audit & Skill Integration
- **System Audit**: Audited 15+ new directories and integrated them into `workspace_audit.md`.
- **Skill Mapping**: Identified `ui-ux-pro-max`, `Memento-Skills`, and `caveman` as core intelligence layers.
- **Intelligence Context**: Updated `webapp/system_audit.md` with new agent integration logic.
- **Wiki Initialization**: Applied `llm-wiki.md` layout by creating `index.md` and `log.md`.
- **Clarification**: Resolved missing `AI_INSTRUCTIONS.md` via user feedback (file does not exist).
- **Design System**: Generated [MASTER.md](file:///d:/APP/prossnum/MASTER.md) following `ui-ux-pro-max` intelligence patterns to formalize "Prossnum Premium Glassmorphism".
- **UI/UX Refinement**: Refined core components (StatCard, StatGrid, DashboardTable) to adhere to `MASTER.md` standards. Implemented Tiered Glassmorphism and CSS-based stagger system.

## [2026-04-20] Audit & Intelligence Initialization
- **System Audit**: Conducted a full ecosystem audit, verifying all reference repositories (`FossFLOW`, `oh-my-codex`, etc.).
- [2026-04-20] Build Success: Resolved TypeScript error in `route.ts`, migrated from `middleware.ts` to `proxy.ts`, and optimized `next.config.ts`.
- [2026-04-20] Documentation: Synchronized `README.md` and `workspace_audit.md` with the new system architecture and maintenance features.
- **AI Core**: Generated a new `AI_INSTRUCTIONS.md` synthesized from the `llm-wiki` and `MASTER.md` architectures.
- **Context Refresh**: Updated `index.md` to confirm **Supabase** as the primary backend source of truth.
- **Refinement**: Registered 950+ skills and established the core skill priority matrix.

## [2026-04-21] Auth Integration & Build Stability
- **LINE Login**: Integrated NextAuth with LINE Provider. Added personalized Navbar with user profile images and name display.
- **UX Polish**: Added loading states to the LINE login flow to prevent multiple submissions.
- **Build Stabilization**: Resolved Vercel build failure caused by `middleware.ts` vs `proxy.ts` naming conflict.
- **Persistent Knowledge**: Established `knowledge/vercel_stability.md` to prevent future build failures, adhering to the `llm-wiki` pattern.
- **Wiki Update**: Registered the new stability guide in `index.md`.
- **Standardization**: Formalized `knowledge/github_release_process.md` following SemVer principles as requested.

## [2026-04-27] Comprehensive System Audit — 35+ Directory Integration
- **Audit Scope**: Catalogued and classified 35 new directories added since last audit (including `langgraph`, `crewAI`, `sentry`, `fastapi`, `django`, `flask`, `pandas`, `poetry`, `pytest`, `milvus`, `UltraRAG`, `MemOS`, `next-auth`, `vault`, `rbac-manager`, `sqldef`, `temporal`, `dapr`, `rtk`, `obsidian-skills`, `skills`, `loading-ui`).
- **New Core Skills Identified (P1)**:
  - `rtk/` — Rust Token Killer: 60–90% LLM token compression, native Antigravity support
  - `loading-ui/` — Animated loading components (spinners/skeletons) for webapp
  - `obsidian-skills/` — Obsidian agent skills for knowledge-management tooling
  - `skills/` (Google) — GCP/Gemini integration recipe skills
- **Tier Classification**: 35 directories sorted into 6 tiers (Core Skills → Reference → AI Frameworks → Backend Refs → Infra Refs → Archive).
- **Documentation**: Updated `workspace_audit.md` with full tier structure and new Core Skill Matrix (P1–P3).
## [2026-04-27] V2.0 Component Upgrade & Field Refinement
- **RSSI Integration**: 
  - Added RSSI data field to TXT export functionality in `useExport.tsx`.
  - Integrated RSSI data into the Bento-style export table in `ExportBentoReport.tsx` for PDF/Image reporting.
  - Standardized the RSSI label across the application to "รับแม่ข่ายได้ (dBm)".
- **Checkbox Migration**: 
  - Converted `towerProgress` (previously 0-100% number) into a simplified checkbox/toggle labeled "ติดตั้งแล้ว (Yagi)" in `ClientSystemModal.tsx` to streamline data entry.
- **Interactive Map Sync**: 
  - Implemented a "Bidirectional Coordinate Sync" system in `ClientSystemModal.tsx`.
  - Enhanced `MapView.tsx` with `isPicker` mode, allowing users to select or drag pins.
  - Manual Lat/Lon input changes now reflect instantly on the map, and map interactions (clicks/drags) update input fields with 6-decimal precision.
- **Visual Polish**: 
  - Applied premium glassmorphism tokens to the new map container and updated label typography to match V2.0 standards (`font-black text-[10px] uppercase`).

## [2026-04-28] Merge PDF Utility Integration
- **Ecosystem Consolidation**: Integrated the `Merge PDF files` utility into the `prossnum/utilities/` directory.
- **Cleanup**: Removed redundant `agent-frameworks/`, `mcp-servers/`, and `.agent/` directories from the original location to eliminate structural drift.
- **UI/UX Excellence**: Verified the application of "UI-UX Pro Max" design tokens (Stone 900/Stone 800 with Orange 600 accents).
- **Core Features**:
  - Drag & Drop integration via `tkinterdnd2`.
  - Multi-threaded merge worker for responsive UI.
  - Metadata and password-based security support.
- **Documentation**: Updated `workspace_audit.md` to officially track `merge-pdf-files` as a Tier 1 utility.
- **Knowledge Transfer**: Preserved project history from the original wiki into the master log.
## [2026-04-28] PDF to JPG Utility Integration
- **Architectural Cleanup**: Consolidated the `convertPDFtoJPG` utility into `prossnum/utilities/convert-pdf-to-jpg`.
- **System Integrity**: Purged 30+ redundant framework directories (langgraph, crewAI, rtk, etc.) that were polluting the utility's original root.
- **Enhanced Capabilities**:
  - **Batch Processing**: Multi-threaded sequential and parallel conversion with live determinative progress bars.
  - **Task Scheduler**: Persistent task automation with daemon-thread monitoring and toolbar notification badges.
  - **Quick Preview**: Real-time thumbnail strip generation with click-to-select synchronization.
- **Design Alignment**: Standardized on **Stone 900** background with **Orange 600** accents and micro-interactions.
- **Testing**: Validated via E2E headless conversion tests (`test_batch_e2e.py`).

## [2026-04-29] Final Architectural Consolidation
- **Root Cleanup**: Consolidated `backend-refs/` and `infra-refs/` into organized subdirectories under `reference/` (`reference/backend/` and `reference/infrastructure/`).
- **Utility Alignment**: Moved `cliTokenKill` to `utilities/` to match its designated role as an operational tool.
- **Audit Synchronization**: Updated `workspace_audit.md` to perfectly reflect the physical directory structure and tier classifications.
- **Ecosystem Integrity**: Validated root directory cleanliness; all project components now adhere to the structured tiers (Core → reference → utilities).

## [2026-05-01] Deployment & Release v1.9.0
- **Build Verification**: Confirmed `webapp` build stability via `npm run build` with Exit Code 0.
- **Version Sync**: Synchronized `webapp/package.json` with technical documentation (`v1.9.0`).
- **GitHub Release**: Tagged the repository with `v1.9.0` and pushed to [bearnannan/prossnum](https://github.com/bearnannan/prossnum.git).
- **Operational Excellence**: Followed the `github_release_process.md` protocol to ensure architectural compounding.

## [2026-05-01] Release v1.9.1 - Stability & Mobile Accessibility
- **TypeScript Optimization**: Resolved build failure where `framer-motion` variant `ease` properties were incorrectly typed. Added `as const` to transition arrays to ensure strict tuple typing (`BezierCurve`).
- **PWA/Mobile Accessibility**: Fixed a critical issue where "Action" buttons (Edit/Delete) were hidden on touch devices due to hover-only (`group-hover`) CSS. Implemented responsive visibility logic (`opacity-100 lg:opacity-0`) to ensure functionality on all screen sizes.
- **GitHub Sync**: Pushed final release-ready code to `main` branch.

## [2026-05-03] Architecture Update - Supabase Migration
- **Backend Infrastructure**: Officially deprecated Google Sheets as a data backend. The application is now strictly reliant on Supabase for data storage, synchronization, and Realtime subscriptions. Any future API routes or features must interact exclusively with Supabase.
