/**
 * optimize.js — Combined Bento Grid + Performance Optimization Script
 * Uses CRLF-aware replacements
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
let c = fs.readFileSync(filePath, 'utf-8');
const NL = c.includes('\r\n') ? '\r\n' : '\n';

function r(search, repl) {
  if (!c.includes(search)) {
    console.warn('⚠ NOT FOUND:', JSON.stringify(search).slice(0, 80));
    return false;
  }
  c = c.replace(search, repl);
  return true;
}

// Normalize to \n for easier matching, re-add CRLF at end
c = c.replace(/\r\n/g, '\n');

// ═══ STEP 1: Optimize imports ═══

r(`import { useRef, useState, useMemo, useEffect } from "react";`,
  `import { useRef, useState, useMemo, useEffect, Suspense } from "react";`);

r(`import { createRoot } from "react-dom/client";\n`, '');

r(`import ExportBentoReportRaw from '@/components/ExportBentoReport';\n`, '');

r(`import StationModal from '@/components/StationModal';\nimport ClientSystemModal from '@/components/ClientSystemModal';\n`,
  `// ─── Lazy-loaded modals (deferred ~63KB until user clicks "เพิ่มสถานี") ───\nconst StationModal = dynamic(() => import('@/components/StationModal'), { ssr: false });\nconst ClientSystemModal = dynamic(() => import('@/components/ClientSystemModal'), { ssr: false });\n`);

r(`const ExportBentoReport = dynamic(() => import('@/components/ExportBentoReport'), {\n  ssr: false,\n});`,
  `// ExportBentoReport is now imported dynamically at export-time only (see handleExportPDF/JPEG)`);

// ═══ STEP 2: Fix handleExportPDF ═══

r(`      const { toJpeg } = await import('html-to-image');\n      const jsPDF = (await import('jspdf')).default;\n      await document.fonts.ready;`,
  `      // Dynamic imports: deferred to export-time only\n      const [{ toJpeg }, jsPDFModule, { createRoot }, ExportBentoReportModule] = await Promise.all([\n        import('html-to-image'),\n        import('jspdf'),\n        import('react-dom/client'),\n        import('@/components/ExportBentoReport'),\n      ]);\n      const jsPDF = jsPDFModule.default;\n      const ExportBentoReportRaw = ExportBentoReportModule.default;\n      await document.fonts.ready;`);

// ═══ STEP 3: Fix handleExportJPEG ═══

r(`      const { toJpeg } = await import('html-to-image');\n      await document.fonts.ready;\n\n      const filtered = data.filter(d => selectedExportStations`,
  `      // Dynamic imports: deferred to export-time only\n      const [{ toJpeg }, { createRoot }, ExportBentoReportModule] = await Promise.all([\n        import('html-to-image'),\n        import('react-dom/client'),\n        import('@/components/ExportBentoReport'),\n      ]);\n      const ExportBentoReportRaw = ExportBentoReportModule.default;\n      await document.fonts.ready;\n\n      const filtered = data.filter(d => selectedExportStations`);

// ═══ STEP 4: Bento Grid layout ═══

// 4a. Root container
r(`<div className="bg-zinc-50/50 dark:bg-zinc-950/80 text-zinc-900 dark:text-zinc-100 min-h-screen font-sans">`,
  `<div className="bg-zinc-50/50 dark:bg-zinc-950/80 architectural-bg text-zinc-900 dark:text-zinc-100 min-h-screen font-sans">`);

// 4b. Main container
r(`<main className="lg:ml-[280px] pt-16 lg:pt-20 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto">`,
  `<main className="lg:ml-[280px] pt-16 lg:pt-20 p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-min max-w-[1600px] mx-auto">`);

// 4c. Header
r(`<header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 bg-white dark:bg-zinc-900/70 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-6 sm:p-8">`,
  `<header className="col-span-1 md:col-span-2 lg:col-span-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 glass-panel p-6 sm:p-8">`);

// 4d. Metric cards wrapper
r(`<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">`,
  `<div className="col-span-1 md:col-span-2 lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">`);

// 4e. All metric card panels → glass-panel with hover
const cardOld = `className="bg-white dark:bg-zinc-900/70 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-6 flex items-center gap-4"`;
const cardNew = `className="glass-panel p-6 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"`;
while (c.includes(cardOld)) {
  c = c.replace(cardOld, cardNew);
}

// 4f. Chart container → col-span-7 + glass-panel + Suspense start
r(`<div className="bg-white dark:bg-zinc-900/70 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-6 flex flex-col z-10">`,
  `<Suspense fallback={<><div className="col-span-1 md:col-span-2 lg:col-span-7 glass-panel p-6 h-[460px] animate-pulse bg-zinc-100 dark:bg-zinc-800/50" /><div className="col-span-1 md:col-span-2 lg:col-span-5 glass-panel p-2 h-[460px] animate-pulse bg-zinc-100 dark:bg-zinc-800/50" /></>}>\n        <div className="col-span-1 md:col-span-2 lg:col-span-7 glass-panel p-6 flex flex-col z-10">`);

// 4g. Map container → col-span-5 + glass-panel + Suspense close
r(`<div className="h-[400px] sm:h-[500px] rounded-3xl overflow-hidden relative z-10">\n          <MapView data={filteredData} category={activeCategory} />\n        </div>`,
  `<div className="col-span-1 md:col-span-2 lg:col-span-5 h-[400px] sm:h-full min-h-[400px] glass-panel p-2 flex flex-col relative">\n          <div className="w-full h-full rounded-2xl overflow-hidden relative z-10"><MapView data={filteredData} category={activeCategory} /></div>\n        </div>\n        </Suspense>`);

// 4h. Data table → col-span-12 + glass-panel
r(`<div className="bg-white dark:bg-zinc-900/70 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col overflow-hidden z-10">`,
  `<div className="col-span-1 md:col-span-2 lg:col-span-12 glass-panel flex flex-col overflow-hidden z-10">`);

// Restore line endings
if (NL === '\r\n') {
  c = c.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, c, 'utf-8');

// ═══ STEP 5: CSS utility ═══
const cssPath = path.join(__dirname, '..', 'src', 'app', 'globals.css');
let css = fs.readFileSync(cssPath, 'utf-8');
if (!css.includes('@utility content-auto')) {
  css += `\n@utility content-auto {\n  content-visibility: auto;\n  contain-intrinsic-size: auto 600px;\n}\n`;
  fs.writeFileSync(cssPath, css, 'utf-8');
  console.log('✅ Added content-auto utility to globals.css');
}

console.log('✅ Optimization completed successfully.');
