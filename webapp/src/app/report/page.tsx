"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { StationData } from "@/app/api/sheet-data/route";
import { createRoot } from "react-dom/client";
import ExportBentoReportRaw from "@/components/ExportBentoReport";

const ExportBentoReport = dynamic(() => import("@/components/ExportBentoReport"), {
    ssr: false,
});

export default function ReportPage() {
    const [data, setData] = useState<StationData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
    const router = useRouter();

    useEffect(() => {
        fetch("/api/sheet-data")
            .then(res => res.json())
            .then(json => setData(json.data || []))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const districts = Array.from(new Set(data.map(d => d.district).filter(Boolean)));

    const displayedDistricts = selectedDistrict === "all"
        ? districts
        : [selectedDistrict];

    const handleExportPDF = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            const { toJpeg } = await import("html-to-image");
            const jsPDF = (await import("jspdf")).default;
            await document.fonts.ready;

            const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
            let isFirstPage = true;

            for (const district of displayedDistricts) {
                const stationsForDistrict = data.filter(d => d.district === district);

                const container = document.createElement("div");
                Object.assign(container.style, {
                    position: "fixed",
                    top: "0",
                    left: "0",
                    width: "1122px",
                    height: "794px",
                    zIndex: "-1000",
                    pointerEvents: "none",
                    backgroundColor: "#F3F4F6",
                });
                document.body.appendChild(container);

                const root = createRoot(container);
                await new Promise<void>((resolve) => {
                    root.render(
                        <div style={{ width: "100%", height: "100%" }}>
                            <ExportBentoReportRaw
                                district={district}
                                stations={stationsForDistrict}
                            />
                        </div>
                    );
                    setTimeout(resolve, 400);
                });

                const el = container.firstChild as HTMLElement;
                await toJpeg(el, { width: 1122, height: 794 }).catch(() => { });
                const imgData = await toJpeg(el, {
                    quality: 0.95,
                    backgroundColor: "#F3F4F6",
                    width: 1122,
                    height: 794,
                    pixelRatio: 2,
                });

                root.unmount();
                document.body.removeChild(container);

                const pdfW = pdf.internal.pageSize.getWidth();
                const pdfH = pdf.internal.pageSize.getHeight();
                if (!isFirstPage) pdf.addPage();
                pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
                isFirstPage = false;
            }

            const filename = selectedDistrict === "all"
                ? "district-report-all.pdf"
                : `district-report-${selectedDistrict}.pdf`;
            pdf.save(filename);
        } catch (err: any) {
            alert("Export failed: " + err.message);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-zinc-900 font-sans">
            {/* Top Bar */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
                    {/* Back button */}
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        กลับ Dashboard
                    </button>

                    <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

                    <h1 className="text-sm font-bold text-zinc-900 dark:text-white">
                        📊 Report Preview
                    </h1>

                    <div className="ml-auto flex items-center gap-2 flex-wrap">
                        {/* District filter */}
                        <select
                            value={selectedDistrict}
                            onChange={e => setSelectedDistrict(e.target.value)}
                            className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        >
                            <option value="all">ทุกอำเภอ ({districts.length} อำเภอ)</option>
                            {districts.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>

                        {/* Export button */}
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting || displayedDistricts.length === 0}
                            className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-900 shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isExporting ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    กำลัง Export...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Export PDF
                                    {selectedDistrict !== "all" && ` — ${selectedDistrict}`}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-6">
                {isLoading && (
                    <div className="flex items-center justify-center py-24 text-zinc-500 gap-3">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        กำลังโหลดข้อมูล...
                    </div>
                )}

                {!isLoading && displayedDistricts.length === 0 && (
                    <div className="text-center py-24 text-zinc-500">ไม่มีข้อมูล</div>
                )}

                {!isLoading && displayedDistricts.map((district, i) => {
                    const districtData = data.filter(d => d.district === district);
                    return (
                        <div key={district} className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                    {i + 1} / {displayedDistricts.length}
                                </span>
                                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                    {district} — {districtData.length} สถานี
                                </span>
                            </div>
                            {/* Preview card — aspect ratio 297:210 (A4 landscape) */}
                            <div
                                className="w-full overflow-hidden rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800"
                                style={{ aspectRatio: "297/210" }}
                            >
                                <div className="w-full h-full" style={{ transform: "scale(1)", transformOrigin: "top left" }}>
                                    <ExportBentoReport
                                        district={district}
                                        stations={districtData}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
