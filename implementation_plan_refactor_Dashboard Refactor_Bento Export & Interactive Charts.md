# Dashboard Refactor: Bento Export & Interactive Charts

This plan outlines the refactoring of the ProssNum Dashboard to achieve a premium, professional look for exported reports and an engaging, interactive data visualization experience.

## User Review Required

> [!IMPORTANT]
> - **Chart Library**: I recommend sticking with **Recharts** as it is already integrated and highly customizable. I will upgrade the implementation to include advanced animations and custom Tooltips.
> - **Design Tokens**: I will use a modern, high-contrast dark theme for the Bento Export (`#020617`) with cyan/emerald/indigo accents.
> - **Thai Typography**: I will ensure "Sarabun" or "Inter" fonts are correctly loaded for the professional look.

## Proposed Changes

### [Bento Export System]

#### [MODIFY] [ExportBentoReport.tsx](file:///d:/APP/prossnum/webapp/src/components/ExportBentoReport.tsx)
- **Visual Overhaul**: Implement a true "Bento Grid" layout with varied card sizes and consistent gaps (24px).
- **Premium Header**: Refactor the header to include a project "Code Name" or ID, a distinct District/Province hierarchy, and a status badge.
- **Glassmorphism**: Apply subtle background blurs and thin borders (`rgba(255,255,255,0.1)`) to cards.
- **Enhanced Progress Rings**: Replace simple percentages with high-quality SVG progress indicators if applicable, or highly styled text blocks.

### [Interactive Visualization]

#### [MODIFY] [DistrictProgressChart.tsx](file:///d:/APP/prossnum/webapp/src/components/DistrictProgressChart.tsx)
- **Entry Animations**: Enable `isAnimationActive` with a staggered `animationBegin`.
- **Modern Tooltips**: Custom tooltip component using Tailwind CSS v4.x utilities (glass effect, rounded-2xl, shadow-2xl).
- **Responsive Geometry**: Adjust bar sizes and radii for a softer, more modern feel.

#### [MODIFY] [ComparisonChart.tsx](file:///d:/APP/prossnum/webapp/src/components/ComparisonChart.tsx)
- **Gap Analysis**: Visually highlight the "Progress Gap" between different installation phases.
- **Interactive Legend**: Allow users to hover/highlight specific categories.

#### [MODIFY] [ProgressChart.tsx](file:///d:/APP/prossnum/webapp/src/components/ProgressChart.tsx)
- **Trend Visualization**: If applicable, transition to a composition that shows overall project velocity.

### [Styling & Assets]

#### [MODIFY] [globals.css](file:///d:/APP/prossnum/webapp/src/app/globals.css) (Optional)
- Add global chart color tokens and animation keyframes if needed for custom transitions.

## Verification Plan

### Automated Tests
- I will run `npm run build` to ensure no TypeScript or Tailwind regressions.
- I will use the browser tool to inspect the new chart animations and tooltip behaviors.

### Manual Verification
1. **Dashboard Interaction**: Hover over charts to verify tooltip responsiveness and content accuracy.
2. **Export Quality**: Generate a PDF/JPEG export and verify that the "Bento" layout scales correctly to the 1122x794 target size.
