# Prossnum Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-emerald?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.2-38b2ac?logo=tailwind-css)](https://tailwindcss.com/)

A professional, high-performance infrastructure monitoring platform designed to track large-scale deployment progress for networking nodes and client systems. Prossnum provides strategic real-time visualization, high-fidelity reporting, and a robust modular architecture utilizing the latest web technologies.

---

## 🌟 Key Features

### 📊 Strategic Visualization

- **Bento-style Analytics**: High-density dashboard tiles displaying key performance indicators (KPIs) for foundation construction and system installation.
- **Meter Installation Tracking**: Real-time monitoring of meter deployment status (`Installed / Total`) with visual indicators and serialized tracking.
- **Interactive Geospatial Tracking**: Real-time map visualization for monitoring geographic distribution of infrastructure nodes.

### 📝 Precision Reporting & Export

- **Export Data to TXT**: Consolidated text-based reports with province-wide summaries and meter installation statistics.
- **High-Fidelity Exports**: Generate professional PDF and JPEG reports tailored for formal documentation.

### 🚨 Resilient Operations & Recovery

- **Zero-Restart Token Switcher**: Built-in dynamic override that queries backup bot credentials from Supabase in real-time, instantly bypassing `.env.local` without service interruptions or restarts.
- **Office 365 Auto-Fallback**: Automatic fallback that detects LINE Messaging API quota blockades (400/403 exceptions) and instantly dispatches highly styled HTML notification alerts using Microsoft 365 SMTP (`smtp.office365.com` / `587`).
- **Resilient Developer Logging**: High-contrast local console logging fallback to inspect complete HTML alert layouts during developer testing with zero SMTP credentials.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 16.2.4 (App Router), React 19 |
| **Styling** | Tailwind CSS v4.2.0, Glassmorphism, Premium Shadow/Glow Accents |
| **Database** | Supabase (PostgreSQL), SWR (Data Fetching) |
| **Mapping** | MapLibre GL, Leaflet, Geoapify overlays |
| **Email/Fallback** | Nodemailer (Microsoft 365 SMTP integration) |

---

## ⚙️ Maintenance & Automation

- **AI-Guided Standards**: The `AI_INSTRUCTIONS.md` defines operational standards for AI agents, ensuring self-healing builds and quality design enforcement via the `ui-ux-pro-max` engine.
- **Dynamic Configuration Updates**: Settings can be dynamically modified through the administrative portal on `/incidents` to write credentials directly to Supabase setting tables.

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

2. Install dependencies in the `webapp` directory:

   ```bash
   cd webapp
   npm install
   ```

### Running Locally

To run the development server, navigate to the `webapp` directory and run:

```bash
npm run dev
```

Open `http://localhost:3000` to view the dashboard.

### Configuration

Create a `.env.local` file in the `webapp` directory using your environment keys (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_USER`, `SMTP_PASSWORD`, etc.).

---

## 📂 Project Structure

```text
prossnum/
├── webapp/                 # Primary Dashboard Application
│   ├── src/                # Application source code (Pages, Components, Hooks)
│   ├── sql/                # Supabase Database Migrations & Schemas
│   ├── scripts/            # Local data processing & optimization scripts
│   └── public/             # Static assets, manifests, and PWA service workers
├── AI_INSTRUCTIONS.md      # AI Operations Manual
├── MASTER.md               # Design System Standards & Visual Identity
├── README.md               # Main repository overview & features
├── index.md                # Repository symbol/page catalog index
├── log.md                  # Chronological development logs
└── workspace_audit.md      # System Architecture Audit log
```

---

© 2026 Developed by Prossnum Team. **Technical Documentation v2.0.0**
