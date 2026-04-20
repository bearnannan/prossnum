# Prossnum Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-emerald?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38b2ac?logo=tailwind-css)](https://tailwindcss.com/)

A professional, high-performance infrastructure monitoring platform designed to track large-scale deployment progress for networking nodes and client systems. Prossnum provides strategic real-time visualization, 600 DPI reporting, and a robust modular architecture utilizing the latest web technologies.

---

## 🌟 Key Features

### 📊 Strategic Visualization
- **Bento-style Analytics**: High-density dashboard tiles displaying key performance indicators (KPIs) for foundation construction and system installation.
- **Meter Installation Tracking**: Real-time monitoring of meter deployment status (`Installed / Total`) with visual indicators (✅/❌) and serialized tracking.
- **Interactive Geospatial Tracking**: Real-time map visualization (MapLibre/Leaflet) for monitoring geographic distribution and status of infrastructure nodes.

### 📝 Precision Reporting & Export
- **Export Data to TXT**: Consolidated text-based reports with province-wide summaries and meter installation statistics.
- **High-Fidelity Exports**: Generate professional 600 DPI PDF and JPEG reports tailored for formal documentation and stakeholder updates.

### 🏗️ Advanced Architecture
- **Next.js 16 Proxy layer**: Modernized network protection using the `proxy.ts` convention for secure route guarding.
- **Supabase Integration**: Real-time data synchronization utilizing Supabase as the core database engine.
- **Modular Component Library**: Clean, decoupled UI components (StatCards, Table grids, Modals) for maximum maintainability.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 16.2.4 (App Router), React 19 |
| **Styling** | Tailwind CSS v4.0, Glassmorphism, Premium Shadows |
| **Database** | Supabase (PostgreSQL), SWR (Data Fetching) |
| **Auth** | Next-Auth (v5 Beta), Proxy-based Route Protection |
| **Mapping** | MapLibre GL, Leaflet, Geoapify |
| **Visuals** | Recharts, Lucide Icons, Material Symbols |

---

## ⚙️ Maintenance & Automation

Prossnum includes a specialized automation layer for managing external dependencies and AI-assisted development.

- **Module Synchronization**: Use `.\update_modules.ps1` at the root directory to automatically pull the latest updates from all 9+ integrated external modules.
- **AI-Guided Development**: The `AI_INSTRUCTIONS.md` (following the `llm-wiki` pattern) provides the architectural context and operational standards required for AI agents to perform self-healing builds and feature extensions.
- **Build Stability**: The build system is optimized with `outputFileTracingRoot` to handle workspace-wide lockfile configurations.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher
- **Package Manager**: `npm` (v10+)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/prossnum.git
   cd prossnum
   ```

2. Sync external modules:
   ```powershell
   .\update_modules.ps1
   ```

3. Install dependencies in `webapp`:
   ```bash
   cd webapp
   npm install
   ```

### Configuration

Create a `.env.local` file in the `webapp` directory with `NEXT_PUBLIC_SUPABASE_URL`, `AUTH_SECRET`, etc.

---

## 📂 Project Structure

```text
prossnum/
├── AI_INSTRUCTIONS.md # AI Operations & Architecture Manual
├── update_modules.ps1  # Automated Sync for External Repos
├── webapp/            # Primary Dashboard Application
│   ├── src/
│   │   ├── app/       # Routes & API (inc. Proxy/Middleware)
│   │   ├── components/# UI Blocks (StatGrid, Meter Tracking)
│   │   └── hooks/     # Custom Logic (useExport, useDashboard)
├── log.md             # Development & Audit Activity Log
└── workspace_audit.md # System Health & Architecture Audit
```

---
© 2026 Developed by Prossnum Team. Technical Documentation v1.4.0.
ect settings.

---
© 2026 Developed by Prossnum Team. Technical Documentation v1.3.0.
