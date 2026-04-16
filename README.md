# Prossnum Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-emerald?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38b2ac?logo=tailwind-css)](https://tailwindcss.com/)

A professional, high-performance infrastructure monitoring platform designed to track large-scale deployment progress for networking nodes and client systems. Prossnum provides strategic real-time visualization, 600 DPI reporting, and a robust modular architecture utilizing the latest web technologies.

---

## 🌟 Key Features

### 📊 Strategic Visualization
- **Bento-style Analytics**: High-density dashboard tiles displaying key performance indicators (KPIs) for foundation construction and system installation.
- **Interactive Geospatial Tracking**: Real-time map visualization (MapLibre/Leaflet) for monitoring geographic distribution and status of infrastructure nodes.
- **Dynamic Charting**: Multi-mode visualization (Recharts) for comparing progress across districts and station types.

### 📝 Precision Reporting
- **High-Fidelity Exports**: Generate professional 600 DPI PDF and JPEG reports tailored for formal documentation and stakeholder updates.
- **Daily Summaries**: Automated text-based summaries optimized for quick communication via messaging platforms.

### 🏗️ Advanced Architecture
- **Supabase Integration**: Real-time data synchronization utilizing Supabase as the core database engine.
- **Modular Component Library**: Clean, decoupled UI components (StatCards, Table grids, Modals) for maximum maintainability.
- **Resilient UI**: Integrated React ErrorBoundaries, offline-ready mapping, and a comprehensive A11y (Accessibility) layer.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 16.1.6 (App Router), React 19 |
| **Styling** | Tailwind CSS v4.0, Glassmorphism, Premium Shadows |
| **Database** | Supabase (PostgreSQL), SWR (Data Fetching) |
| **Auth** | Next-Auth (v5 Beta), LINE Login Integration |
| **Mapping** | MapLibre GL, Leaflet, Geoapify |
| **Visuals** | Recharts, Lucide Icons, Material Symbols |
| **Export** | jsPDF, html-to-image |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.x` or higher
- **Package Manager**: `npm` (v9+) or `yarn`

### Installation

1. Clone the repository and navigate to the `webapp` directory:
   ```bash
   git clone https://github.com/your-repo/prossnum.git
   cd prossnum/webapp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

Create a `.env.local` file in the `webapp` directory. Use the table below as a reference for required variables:

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Public API Key |
| `NEXT_PUBLIC_MAP_PROVIDER` | Map engine provider (e.g., `geoapify`) |
| `NEXT_PUBLIC_MAP_API_KEY` | API key for the map tile provider |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Required for strategic address lookups |
| `AUTH_LINE_ID` | LINE Channel ID for authentication |
| `AUTH_LINE_SECRET` | LINE Channel Secret |
| `AUTH_SECRET` | Secret key for Next-Auth encryption |

### Run / Usage

**Development Server:**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm start
```

---

## 📂 Project Structure

```text
webapp/
├── src/
│   ├── app/           # Next.js Routes & API Endpoints
│   ├── components/    # Reusable UI Blocks (StatGrid, Charts, Table)
│   ├── hooks/         # Custom Shared Logic (useDashboard, useExport)
│   ├── lib/           # Core Utilities (Supabase Client, Auth config)
│   └── design-system/ # Master tokens, colors, and global CSS
├── public/            # Static assets and PWA manifests
└── scripts/           # Maintenance and refactoring utilities
```

---

## 🔌 Core Functionalities & APIs

### Data Engine (`/api/sheet-data`)
The project utilizes a unified internal API to manage all infrastructure records.

- `GET ?sheet=<type>`: Retrieves prioritized records for `station` or `client` systems.
- `POST ?sheet=<type>`: Direct insertion of new deployment records into Supabase.
- `PUT ?sheet=<type>`: Update existing record progress (Foundation %, Radio SN, etc.).
- `DELETE ?sheet=<type>`: Secure removal of records with confirmation triggers.

### Testing & Deployment
- **Static Analysis**: The project uses ESLint and TypeScript for strict type checking during the build phase.
- **CI/CD Build**: All refactors must pass `npm run build` to verify Next.js server/client boundaries.
- **Deployment**: Optimized for Vercel. Ensure all Environment Variables are mirrored in the Vercel Dashboard project settings.

---
© 2026 Developed by Prossnum Team. Technical Documentation v1.3.0.
