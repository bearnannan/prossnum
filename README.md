# Prossnum Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-emerald?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38b2ac?logo=tailwind-css)](https://tailwindcss.com/)

A professional, high-performance infrastructure monitoring platform designed to track large-scale deployment progress for networking nodes and client systems. Prossnum provides strategic real-time visualization, 600 DPI reporting, and a robust modular architecture utilizing the latest web technologies.

---

## 🌟 Key Features

### 🧠 Intelligence Layer (GitNexus)
- **Codebase Knowledge Graph**: Powered by GitNexus, providing the agent with semantic search, impact analysis, and deep architectural insights across the monorepo.
- **Compounding Memory**: Integration with `llm-wiki.md` for persistent technical documentation that grows with the project.

### 📊 Strategic Visualization
- **Bento-style Analytics**: High-density dashboard tiles displaying key performance indicators (KPIs) for foundation construction and system installation.
- **Meter Installation Tracking**: Real-time monitoring of meter deployment status (`Installed / Total`) with visual indicators (✅/❌) and serialized tracking.
- **Interactive Geospatial Tracking**: Real-time map visualization for monitoring geographic distribution of infrastructure nodes.

### 📝 Precision Reporting & Export
- **Export Data to TXT**: Consolidated text-based reports with province-wide summaries and meter installation statistics.
- **High-Fidelity Exports**: Generate professional 600 DPI PDF and JPEG reports tailored for formal documentation.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 16.2.4 (App Router), React 19 |
| **Intelligence** | GitNexus (Knowledge Graph), Memento-Loop (Reflective Agents) |
| **Styling** | Tailwind CSS v4.0, Glassmorphism, Premium Shadows |
| **Database** | Supabase (PostgreSQL), SWR (Data Fetching) |
| **Mapping** | MapLibre GL, Leaflet, Geoapify |

---

## ⚙️ Maintenance & Automation

- **Intelligence Sync**: Use `GitNexus` to analyze codebase changes and update the `llm-wiki.md` pattern library.
- **Module Management**: Automated scripts in `scripts/` (e.g., `update_modules.ps1`) for handling external repository synchronization.
- **AI-Guided Standards**: The `AI_INSTRUCTIONS.md` defines operational standards for AI agents, ensuring self-healing builds and quality design enforcement via the `ui-ux-pro-max` engine.

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

## 📂 Project Structure (Organized)

```text
prossnum/
├── GitNexus/          # Codebase Intelligence Engine
├── webapp/            # Primary Dashboard Application
├── agent-frameworks/  # Consolidated AI Frameworks (LangGraph, CrewAI, etc.)
├── mcp-servers/       # MCP Infrastructure (Sentry, DrawIO)
├── infra-refs/        # Infrastructure Internals (Vault, Dapr, RTK)
├── reference/         # Pattern Libraries & Component Refs (Loading-UI, Skills)
├── backend-refs/      # Backend Framework Internals (FastAPI, Django)
├── knowledge/         # Technical Knowledge Base (LLM-Wiki)
├── docs/legacy/       # Archived Implementation Plans & Logs
├── scripts/           # Utility & Automation Scripts
├── AI_INSTRUCTIONS.md # AI Operations Manual
└── workspace_audit.md # System Architecture Audit (Revision 5.0)
```

---

© 2026 Developed by Prossnum Team. **Technical Documentation v1.9.0**

---

## Persistent Skills Bootstrap

This repository includes a persistent skills bootstrap flow for Super-Agent initialization.

- Registry file: `scripts/global-skills-registry.json`
- Bootstrap script: `scripts/bootstrap-global-skills.ps1`
- Run bootstrap: `npm run skills:bootstrap`
- Run bootstrap and update existing repos: `npm run skills:bootstrap:update`

The bootstrap script verifies each registry path and clones missing repositories automatically.
