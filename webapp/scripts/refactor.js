const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../src/app/page.tsx');
let code = fs.readFileSync(targetFile, 'utf-8');

// 1. Change background string
code = code.replace(
  '<div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen font-sans">',
  '<div className="bg-zinc-50/50 dark:bg-zinc-950/80 architectural-bg text-zinc-900 dark:text-zinc-100 min-h-screen font-sans">'
);

// 2. Change main tag
code = code.replace(
  '<main className="lg:ml-[280px] pt-16 lg:pt-20 p-4 sm:p-6 lg:p-8 flex flex-col gap-6">',
  '<main className="lg:ml-[280px] pt-16 lg:pt-20 p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-min max-w-[1600px] mx-auto">'
);

// 3. Header
code = code.replace(
  '<header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800">',
  '<header className="col-span-1 md:col-span-2 lg:col-span-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 glass-panel p-6 sm:p-8">'
);

// 4. Nested Grid for Cards
code = code.replace(
  '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">',
  '<div className="col-span-1 md:col-span-2 lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">'
);

// 5. Card glass-panel
code = code.replace(
  /bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 hover:shadow-md transition-shadow/g,
  'glass-panel p-6 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300'
);

// 6. Extract Map and move it after Chart
const mapStartStr = '<div className="h-[400px] rounded-3xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800">';
const mapStart = code.indexOf(mapStartStr);

if (mapStart > -1) {
  const mapEnd = code.indexOf('</div>', mapStart + mapStartStr.length) + 6;
  const mapContent = code.slice(mapStart, mapEnd);
  
  // Remove map from original position
  code = code.substring(0, mapStart) + code.substring(mapEnd);

  // New map content with glass-panel and col-span
  const newMapContent = mapContent.replace(
    mapStartStr,
    '<div className="col-span-1 md:col-span-2 lg:col-span-5 h-[400px] sm:h-full min-h-[400px] glass-panel p-2 flex flex-col relative">'
  ).replace(
    '<MapView data={filteredData} category={activeCategory} />',
    '<div className="w-full h-full rounded-2xl overflow-hidden relative z-10"><MapView data={filteredData} category={activeCategory} /></div>'
  );

  // Chart
  const chartStartStr = '<div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 p-4">';
  code = code.replace(
    chartStartStr,
    '<div className="col-span-1 md:col-span-2 lg:col-span-7 glass-panel p-6 flex flex-col z-10">'
  );

  // Table
  const tableStartStr = '<div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">';
  code = code.replace(
    tableStartStr,
    newMapContent + '\n\n        <div className="col-span-1 md:col-span-2 lg:col-span-12 glass-panel flex flex-col overflow-hidden z-10">'
  );
}

fs.writeFileSync(targetFile, code);
console.log("Refactor completed successfully.");
