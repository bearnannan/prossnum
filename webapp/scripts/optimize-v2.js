/**
 * optimize-v2.js — Line-based surgical optimization script
 * Uses array splice on exact line numbers to avoid ambiguous text matching.
 * 
 * Source: page.tsx (712 lines, clean from git HEAD)
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
const raw = fs.readFileSync(filePath, 'utf-8');
const NL = raw.includes('\r\n') ? '\r\n' : '\n';
let lines = raw.split(NL);

// Helper: replace a range [start, end] (1-indexed) with new lines
function splice(startLine, endLine, newLines) {
  lines.splice(startLine - 1, endLine - startLine + 1, ...newLines);
}

// Track offset as we insert/remove lines
let offset = 0;
function s(start, end, newLines) {
  const a = start + offset;
  const b = end + offset;
  const oldCount = b - a + 1;
  const newCount = newLines.length;
  splice(a, b, newLines);
  offset += newCount - oldCount;
  console.log(`  ✓ Lines ${start}-${end} → replaced (${oldCount} → ${newCount})`);
}

console.log('Starting optimization...');

// ═══════════════════════════════════════════════════════════════════
// 1. IMPORTS (lines 1-16)
// ═══════════════════════════════════════════════════════════════════
s(1, 16, [
  '"use client";',
  '',
  'import { useRef, useState, useMemo, useEffect, Suspense } from "react";',
  'import { useRouter } from "next/navigation";',
  'import dynamic from "next/dynamic";',
  'import useSWR from "swr";',
  'import { StationData, ClientSystemData } from "./api/sheet-data/route";',
  'import { supabase } from "@/lib/supabase";',
  'import { useToast } from "@/components/Toast";',
  'import { Skeleton, SkeletonLayout } from "@/components/Skeleton";',
  'import TopNavBar from \'@/components/TopNavBar\';',
  'import SideNavBar from \'@/components/SideNavBar\';',
  '',
  '// ─── Lazy-loaded modals (deferred ~63KB until user clicks "เพิ่มสถานี") ───',
  'const StationModal = dynamic(() => import(\'@/components/StationModal\'), { ssr: false });',
  'const ClientSystemModal = dynamic(() => import(\'@/components/ClientSystemModal\'), { ssr: false });',
]);

// ═══════════════════════════════════════════════════════════════════
// 2. Remove duplicate ExportBentoReport dynamic import (lines 48-50)
// ═══════════════════════════════════════════════════════════════════
s(48, 50, [
  '// ExportBentoReport is now imported dynamically at export-time only (see handleExportPDF/JPEG)',
]);

// ═══════════════════════════════════════════════════════════════════
// 3. handleExportPDF: lines 232-234 → parallel dynamic imports
// ═══════════════════════════════════════════════════════════════════
s(232, 234, [
  '      // Dynamic imports: deferred to export-time only',
  '      const [{ toJpeg }, jsPDFModule, { createRoot }, ExportBentoReportModule] = await Promise.all([',
  "        import('html-to-image'),",
  "        import('jspdf'),",
  "        import('react-dom/client'),",
  "        import('@/components/ExportBentoReport'),",
  '      ]);',
  '      const jsPDF = jsPDFModule.default;',
  '      const ExportBentoReportRaw = ExportBentoReportModule.default;',
  '      await document.fonts.ready;',
]);

// ═══════════════════════════════════════════════════════════════════
// 4. handleExportJPEG: lines 291-292 → parallel dynamic imports
// ═══════════════════════════════════════════════════════════════════
s(291, 292, [
  '      // Dynamic imports: deferred to export-time only',
  '      const [{ toJpeg }, { createRoot }, ExportBentoReportModule] = await Promise.all([',
  "        import('html-to-image'),",
  "        import('react-dom/client'),",
  "        import('@/components/ExportBentoReport'),",
  '      ]);',
  '      const ExportBentoReportRaw = ExportBentoReportModule.default;',
  '      await document.fonts.ready;',
]);

// ═══════════════════════════════════════════════════════════════════
// 5. LAYOUT: Root container + architectural-bg (line 362)
// ═══════════════════════════════════════════════════════════════════
s(362, 362, [
  '    <div className="bg-zinc-50/50 dark:bg-zinc-950/80 architectural-bg text-zinc-900 dark:text-zinc-100 min-h-screen font-sans">',
]);

// ═══════════════════════════════════════════════════════════════════
// 6. Main container: flex-col → 12-column grid (line 374)
// ═══════════════════════════════════════════════════════════════════
s(374, 374, [
  '      <main className="lg:ml-[280px] pt-16 lg:pt-20 p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-min max-w-[1600px] mx-auto">',
]);

// ═══════════════════════════════════════════════════════════════════
// 7. Header: col-span-12 + glass-panel (line 378)
// ═══════════════════════════════════════════════════════════════════
s(378, 378, [
  '        <header className="col-span-1 md:col-span-2 lg:col-span-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 glass-panel p-6 sm:p-8">',
]);

// ═══════════════════════════════════════════════════════════════════
// 8. Metric cards container: col-span-12 (line 392)
// ═══════════════════════════════════════════════════════════════════
s(392, 392, [
  '        <div className="col-span-1 md:col-span-2 lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">',
]);

// ═══════════════════════════════════════════════════════════════════
// 9. All card panels → glass-panel with hover-lift
//    Lines: 394, 414, 426, 438, 453, 465, 477
// ═══════════════════════════════════════════════════════════════════
const cardLines = [394, 414, 426, 438, 453, 465, 477];
for (const ln of cardLines) {
  const adjusted = ln + offset;
  lines[adjusted - 1] = '              <div className="glass-panel p-6 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">';
}
console.log(`  ✓ Card panels: ${cardLines.length} lines updated to glass-panel`);

// ═══════════════════════════════════════════════════════════════════
// 10. Chart container → col-span-7 + glass-panel + Suspense (lines 496-504)
//     Map section (lines 619-621) → move to col-span-5 next to chart
// ═══════════════════════════════════════════════════════════════════
s(496, 504, [
  '        <Suspense fallback={<><div className="col-span-1 md:col-span-2 lg:col-span-7 glass-panel p-6 h-[460px] animate-pulse bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" /><div className="col-span-1 md:col-span-2 lg:col-span-5 glass-panel p-2 h-[460px] animate-pulse bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" /></>}>',
  '        <div className="col-span-1 md:col-span-2 lg:col-span-7 glass-panel p-6 flex flex-col z-10">',
  '          <div className="flex items-center gap-3 mb-6">',
  '            <button onClick={() => setChartTab(\'average\')} className={`px-4 py-2 rounded-xl text-sm font-bold ${chartTab === \'average\' ? \'bg-zinc-900 text-white\' : \'bg-zinc-100 text-zinc-600\'}`}>เฉลี่ยรายอำเภอ</button>',
  '            <button onClick={() => setChartTab(\'comparison\')} className={`px-4 py-2 rounded-xl text-sm font-bold ${chartTab === \'comparison\' ? \'bg-zinc-900 text-white\' : \'bg-zinc-100 text-zinc-600\'}`}>เปรียบเทียบ</button>',
  '          </div>',
  '          <div className="h-[400px]">',
  '            {chartTab === \'average\' ? <DistrictProgressChart data={filteredData} category={activeCategory} /> : <ComparisonChart data={filteredData} category={activeCategory} />}',
  '          </div>',
  '        </div>',
  '',
  '        <div className="col-span-1 md:col-span-2 lg:col-span-5 h-[400px] sm:h-full min-h-[400px] glass-panel p-2 flex flex-col relative">',
  '          <div className="w-full h-full rounded-2xl overflow-hidden relative z-10"><MapView data={filteredData} category={activeCategory} /></div>',
  '        </div>',
  '        </Suspense>',
]);

// ═══════════════════════════════════════════════════════════════════
// 11. Data table → col-span-12 + glass-panel (line 506)
// ═══════════════════════════════════════════════════════════════════
s(506, 506, [
  '        <div className="col-span-1 md:col-span-2 lg:col-span-12 glass-panel flex flex-col overflow-hidden z-10">',
]);

// ═══════════════════════════════════════════════════════════════════
// 12. Remove old map section at bottom (lines 619-621)
// ═══════════════════════════════════════════════════════════════════
s(619, 621, []);

// ═══════════════════════════════════════════════════════════════════
// Write result
// ═══════════════════════════════════════════════════════════════════
const result = lines.join(NL);
fs.writeFileSync(filePath, result, 'utf-8');
console.log(`\n✅ page.tsx optimized (${lines.length} lines)`);

// ═══════════════════════════════════════════════════════════════════
// 13. CSS: Add content-auto + architectural-bg utilities
// ═══════════════════════════════════════════════════════════════════
const cssPath = path.join(__dirname, '..', 'src', 'app', 'globals.css');
let css = fs.readFileSync(cssPath, 'utf-8');

if (!css.includes('@utility content-auto')) {
  css += '\n@utility content-auto {\n  content-visibility: auto;\n  contain-intrinsic-size: auto 600px;\n}\n';
  console.log('  ✓ Added content-auto utility');
}

if (!css.includes('@utility architectural-bg')) {
  css += '\n@utility architectural-bg {\n  background-image: radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px);\n  background-size: 20px 20px;\n}\n';
  console.log('  ✓ Added architectural-bg utility');
}

if (!css.includes('@utility glass-panel')) {
  css += '\n@utility glass-panel {\n  background: rgba(255, 255, 255, 0.7);\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  border-radius: 1rem;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);\n}\n';
  console.log('  ✓ Added glass-panel utility');
}

fs.writeFileSync(cssPath, css, 'utf-8');
console.log('✅ globals.css updated');
