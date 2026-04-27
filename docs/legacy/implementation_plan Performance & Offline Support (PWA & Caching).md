## Performance & Offline Support (PWA & Caching)

# Goal Description
This plan implements Data Caching and Offline Support (Progressive Web App - PWA) to optimize performance, reduce Google Sheets API quota usage, and allow field workers to update station data even without an active internet connection. Drafted data will be synced upon regaining a connection.

## User Review Required
None.

## Proposed Changes
### Dependencies
- Install `swr` for data fetching and caching.
- Install `next-pwa` to configure the application as a PWA and generate service workers.
- Install `idb-keyval` for lightweight interaction with IndexedDB to store offline drafts.

### Data Caching (SWR)
#### [MODIFY] [page.tsx](file:///d:/APP/prossnum/webapp/src/app/page.tsx)
- Replace standard `useEffect` + [fetch](file:///d:/APP/prossnum/webapp/src/app/page.tsx#62-75) logic with SWR's `useSWR` hook.
- Configure SWR caching parameters (e.g., `dedupingInterval` of 1-5 minutes) to avoid redundant requests when navigating.

#### [MODIFY] [report/page.tsx](file:///d:/APP/prossnum/webapp/src/app/report/page.tsx)
- Apply the same SWR caching logic to the standalone report page.

### Offline Mode & Synchronization
#### [MODIFY] [next.config.mjs](file:///d:/APP/prossnum/webapp/next.config.mjs)
- Wrap the configuration with `next-pwa` to generate the service worker (`sw.js`), ensuring static assets, JS bundles, and layout frames are cached for offline access.
- Generate and place necessary `manifest.json` and PWA icons into the `/public` directory.

#### [MODIFY] [layout.tsx](file:///d:/APP/prossnum/webapp/src/app/layout.tsx)
- Embed `manifest.json` link and theme colors within the metadata to satisfy PWA requirements.

#### [NEW] [OfflineSyncManager.tsx](file:///d:/APP/prossnum/webapp/src/components/OfflineSyncManager.tsx)
- A new global component that listens to `window.addEventListener('online')` and `window.addEventListener('offline')` events.
- Displays a small floating indicator (e.g., "Offline Mode") when disconnected.
- When the connection is restored, automatically iterates over the `idb-keyval` queue and sends any saved [POST](file:///d:/APP/prossnum/webapp/src/app/api/sheet-data/route.ts#59-101) updates to `/api/sheet-data`, clearing the drafts after a successful sync.

#### [MODIFY] [StationModal.tsx](file:///d:/APP/prossnum/webapp/src/components/StationModal.tsx)
- Update the save logic to check `navigator.onLine`. If offline (or the fetch throws a network error), save the update payload to IndexedDB (via `idb-keyval`) and close the modal.
- Display a UI notification stating that data is "Saved as Draft" and will automatically sync later.

## Verification Plan
### Automated Tests
- Run `npm run build` safely to ensure `next-pwa` builds the service worker correctly without type errors.
### Manual Verification
- Simulate offline mode via Chrome DevTools (Network tab -> Disconnect).
- Attempt to edit a station and observe the "Saved Draft" behavior.
- Toggle the network back online and verify the auto-synchronization triggered by the `OfflineSyncManager` successfully updates the Google Sheet.

---

# Add Static Map to Export Bento Report

This plan details the addition of a static map box into the [ExportBentoReport](file:///d:/APP/prossnum/webapp/src/components/ExportBentoReport.tsx#29-210) component to display station pins for the selected district.

## Proposed Changes

### Frontend Components

#### [NEW] ExportMapStatic.tsx (src/components/ExportMapStatic.tsx)
- Create a new component that accepts `stations` as a prop.
- To avoid CORS issues during `html-to-image` rendering, we will implement a Google Static Maps API image generator.
- We will use an environment variable `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. If it's missing, we render a beautifully styled "Map Area Placeholder" so the layout works perfectly even without a key.
- The component calculates the center of the given stations and adds markers representing the stations.

#### [MODIFY] ExportBentoReport.tsx (src/components/ExportBentoReport.tsx)
- Adjust the layout of the Body section.
- Split the right-hand column vertically:
  - Top: Table Box (taking ~65% of vertical space, scrolling if needed)
  - Bottom: Map Box (taking ~35% of vertical space)
  - Both components will have consistent rounded corners and Bento styling.

## Verification Plan

### Manual Verification
1. Export a report for a district.
2. Verify that the new Map box appears below the table.
3. If no API key is provided, verify the placeholder is aesthetically pleasing.

---

# Add High-Resolution JPEG Export Feature

This plan details the changes required to add a new JPEG export option within the existing "Export รายอำเภอ" modal, allowing for 600 DPI high-resolution output and a selectable Color/Grayscale mode.

## Proposed Changes

### Frontend Components

#### [MODIFY] page.tsx (src/app/page.tsx)
- **State Updates**: 
  - Change `exportType` state to allow `'pdf' | 'txt' | 'jpeg'`.
  - Add new state `colorMode` set to `'color' | 'grayscale'`.
- **Modal UI Updates**:
  - Inside the Export Modal, if the triggered action was for visual reports (not TXT), show options to select between PDF and JPEG.
  - If JPEG is selected, show an additional toggle/radio group for choosing "Color" or "Grayscale".
- **Export Logic (`handleExportReport`)**:
  - Unify [handleExportPDF](file:///d:/APP/prossnum/webapp/src/app/page.tsx#190-310) and `handleExportJPEG` triggers.
  - Loop through selected districts and generate the report using `createRoot` off-screen, as done currently for PDFs.
  - If JPEG format is selected:
    - Apply `style.filter = colorMode === 'grayscale' ? 'grayscale(100%)' : 'none'` to the root element.
    - Call `toJpeg` with `quality: 1.0` and `pixelRatio: 6.25` (assuming a base 96 DPI CSS, 96 x 6.25 = 600 DPI).
    - Save each district as a separate `.jpg` file, as standard JPEGs do not support multiple pages. Trigger multiple download links.
  - If PDF format is selected, retain the current logic.

## Verification Plan

### Manual Verification
1. Open the "Export PDF รายอำเภอ" modal. 
2. Change the selection format to JPEG and choose "Grayscale". Select one or two districts.
3. Click "ยืนยัน Export".
4. Monitor memory performance.
5. Verify downloaded files are `.jpg`, high resolution, and in grayscale.

---

# Add Export to TXT Feature and Field Expansions

This plan details the changes required to add the new "Export สรุปงาน (.txt)" feature in the Dashboard and expand the database schema to support three new text fields: `poleHeight` (ความสูงเสา), `startDate` (วันที่เริ่มงาน), and `remark` (หมายเหตุ).

## Proposed Changes

### Database & API Layer

#### [MODIFY] route.ts (src/app/api/sheet-data/route.ts)
- Update [StationData](file:///d:/APP/prossnum/webapp/src/components/ExportBentoReport.tsx#7-17) interface to include `poleHeight?: string`, `startDate?: string`, `remark?: string`.
- Expand Google Sheets API data ranges from [A:G](file:///d:/APP/prossnum/webapp/src/app/api/sheet-data/route.ts#18-58) to `A:J` for GET, POST, and PUT operations to accommodate the 3 extra columns.
- Update data parsing mapping:
  - `H` (index 7) -> `poleHeight`
  - `I` (index 8) -> `startDate`
  - `J` (index 9) -> `remark`

### Frontend Components

#### [MODIFY] StationModal.tsx (src/components/StationModal.tsx)
- Add `poleHeight`, `startDate`, and `remark` to `defaultForm`.
- Map these new fields in the `useEffect` hook when editing an existing station.
- Add three new form inputs:
  - `poleHeight` (Text input: "ความสูงเสา")
  - `startDate` (Date input type: "วันที่เริ่มงาน")
  - `remark` (Text area/input: "หมายเหตุ")

#### [MODIFY] page.tsx (src/app/page.tsx)
- Update the main header actions to include a new button "Export สรุปงาน (.txt)".
- Update the export modal state to determine the `exportType` (`pdf` or `txt`), or define a [handleExportTXT](file:///d:/APP/prossnum/webapp/src/app/page.tsx#127-189) that works similarly.
- Implement the text generation loop according to the data mapping template:
  ```txt
  [ลำดับ]. สถานีลูกข่าย [ชื่อสถานี] ([ความสูงเสา]) [Type]
  งานก่อสร้างฐานราก: [เปอร์เซ็นต์ฐานราก]%
  งานติดตั้งโครงเสา: [เปอร์เซ็นต์ติดตั้งเสา]%
  ** หมายเหตุ: [ข้อมูล Remark / สิ่งที่ต้องทำต่อ]
  เริ่มงาน: [วันที่เริ่มงาน]
  
  ---
  ```
- Use `Blob` with `type: "text/plain;charset=utf-8"` to prompt immediate file download.

## Verification Plan

### Manual Verification
1. User should navigate to the website.
2. Click "เพิ่มสถานี" (Add Station) and observe the 3 new fields available for data entry (`poleHeight`, `startDate`, `remark`). Verify successful creation.
3. Edit an existing station and populate the new fields, then verify the changes save correctly to the Google Sheet.
4. From the Dashboard, select stations via the Export feature and export as `.txt`.
5. Open the downloaded `progress_summary.txt` and verify UTF-8 encoding (Thai characters display correctly) and that the text formatting matches the requested template perfectly.
