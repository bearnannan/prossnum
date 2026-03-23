# PROSSNUM System Audit

## 1. Technology Stack
The application is a modern web-based monitoring dashboard for station management.

- **Frontend Core**: Next.js 16.1.6 (using App Router)
- **Runtime**: Node.js with React 19.2.3
- **Styling**: Tailwind CSS v4
- **State Management**: React Hooks + SWR
- **Database/Storage**: Google Sheets API (v4)
- **Authentication**: NextAuth.js v5 (Beta)
- **Maps & GIS**: Leaflet + MapLibre GL
- **Offline Support**: PWA + IndexDB

## 2. Main Skills to be Used (from .agent/skills)
- `googlesheets-automation`
- `nextjs-app-router-patterns`
- `tailwind-design-system`
- `ui-ux-pro-max`
- `react-best-practices`

## 3. Current Issues Fixed
- **Sheet Case Sensitivity**: Fixed mismatched sheet name (`station_data` -> `Stationdata`).
- **Column Mapping Error**: Resolved "Client System" update failure by aligning API payloads with the actual 26-column structure of the Google Sheet (removed non-existent `linkProgress` column).
