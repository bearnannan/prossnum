# GSD Infra Dashboard V2.0: Operational Intel Overhaul

This plan outlines the final phases of a visual and functional upgrade to the GSD Infra Dashboard, shifting from a standard corporate look to a high-density, modern "Command Center" aesthetic.

## User Review Required

> [!IMPORTANT]
> **Design Shift**: We are moving towards a heavy "Zinc-950" (almost black) and "Indigo-600" accent palette.
> **Typography**: All labels will be changed to `font-black text-[10px] uppercase tracking-[0.3em]`.
> **Naming**: Sections like "Regional Analytics" are being rebranded to "DISTRICT_ANALYTICS" to fit the technical operational theme.

## Proposed Changes

### 1. Core Framework & Navigation
- [x] **Page Layout (`page.tsx`)**: Rebuilt the hero section, stats cards, and table structure with V2.0 tokens.
- [ ] **Top Navigation (`TopNavBar.tsx`)**: Apply glassmorphism and high-density typography.
- [ ] **Side Navigation (`SideNavBar.tsx`)**: Overhaul the province filter and regional navigation.

---

### 2. User Interface Components
- [ ] **Modals (`StationModal.tsx`, `ClientSystemModal.tsx`)**: Transform standard forms into high-tech configuration panels with `rounded-[48px]`.
- [ ] **Charts (`DistrictProgressChart.tsx`, `ComparisonChart.tsx`)**: Update color palettes to use Indigo, Violet, and Emerald gradients.
- [ ] **Map View (`MapView.tsx`)**: Refine the "Geospatial" overlay labels.

---

### 3. Data Extraction & Export
- [ ] **Export Logic**: Restore and refine `handleExport` functions.
- [ ] **Export Bento (`ExportBentoReport.tsx`)**: Upgrade the PDF/Static export template to match the new dark-premium aesthetic.

## Open Questions

- [ ] Do you have a preferred accent color besides Indigo (e.g., Amber or Cyan)?
- [ ] Should the mobile menu also adopt the dark Zinc-950 theme exclusively?

## Verification Plan

### Automated Tests
- `npm run build`: Ensure no linting errors (especially for missing export handlers).
- `browser_subagent`: Verify the "Management" panel buttons are clickable and focused states work.

### Manual Verification
- Verify the "Matrix" table rows scale correctly on different screen sizes using the `adapt` skill.
- Check "Live Sync" animations in the TopNavBar.
