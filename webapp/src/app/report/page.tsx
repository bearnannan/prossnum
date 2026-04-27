"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { StationData } from "@/app/api/sheet-data/route";
import { createRoot } from "react-dom/client";
import { Skeleton } from "@/components/Skeleton";

const ExportBentoReport = dynamic(() => import("@/components/ExportBentoReport"), {
    ssr: false,
});

// Keep raw import for PDF rendering
import ExportBentoReportRaw from "@/components/ExportBentoReport";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ReportPage() {
    const { data: responseData, isLoading: swrIsLoading } = useSWR("/api/sheet-data", fetcher, {
        dedupingInterval: 60000,
        keepPreviousData: true,
    });

    const data: StationData[] = responseData?.data || [];
    const isLoading = swrIsLoading && !responseData;

    const [isExporting, setIsExporting] = useState(false);
    const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
    const router = useRouter();

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
                    left: "-2000px",
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
                    setTimeout(resolve, 800);
                });

                const el = container.firstChild as HTMLElement;
                await toJpeg(el, { width: 1122, height: 794 }).catch(() => { });
                const imgData = await toJpeg(el, {
                    quality: 1.0,
                    backgroundColor: "#F3F4F6",
                    width: 1122,
                    height: 794,
                    pixelRatio: 6.25,
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
        <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950/80 architectural-bg font-sans">
            {/* ═══ Top Bar — Frosted Glass ═══ */}
            <div 
                className="sticky top-0 z-30"
                style={{
                    background: 'rgba(255, 255, 255, 0.72)',
                    backdropFilter: 'blur(24px) saturate(1.5)',
                    WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 16px rgba(0,0,0,0.02)',
                }}
            >
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
                    {/* Back button — pill style */}
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
                        style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        กลับ Dashboard
                    </button>

                    <div className="h-5 w-px bg-zinc-200/60 dark:bg-zinc-700" style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) 0.05s both' }} />

                    {/* Title */}
                    <h1 
                        className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2 tracking-tight"
                        style={{ 
                            fontFamily: 'var(--font-headline)',
                            animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) 0.1s both',
                        }}
                    >
                        <span className="material-symbols-outlined text-base text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>assessment</span>
                        Report Preview
                    </h1>

                    <div className="ml-auto flex items-center gap-2.5 flex-wrap">
                        {/* District filter */}
                        <div 
                            className="relative"
                            style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) 0.15s both' }}
                        >
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-base pointer-events-none">filter_list</span>
                            <select
                                value={selectedDistrict}
                                onChange={e => setSelectedDistrict(e.target.value)}
                                className="appearance-none rounded-xl border border-zinc-200/60 dark:border-zinc-700 pl-9 pr-8 py-2.5 text-sm font-semibold bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 cursor-pointer"
                            >
                                <option value="all">ทุกอำเภอ ({districts.length} อำเภอ)</option>
                                {districts.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">expand_more</span>
                        </div>

                        {/* Export button — gradient */}
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting || displayedDistricts.length === 0}
                            className="group flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-premium-sm hover:shadow-premium-md transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] gradient-primary relative overflow-hidden"
                            style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) 0.2s both' }}
                        >
                            {/* Hover shimmer */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{
                                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                                    backgroundSize: '200% 100%',
                                    animation: 'shimmer 2s ease-in-out infinite',
                                }}
                            />
                            <span className="relative z-10 flex items-center gap-2">
                                {isExporting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm group-hover:translate-y-0.5 transition-transform duration-200">download</span>
                                        Export PDF
                                        {selectedDistrict !== "all" && (
                                            <span className="text-white/60 font-normal">— {selectedDistrict}</span>
                                        )}
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══ Content ═══ */}
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-6">
                {/* Loading — Skeleton shimmer */}
                {isLoading && (
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="space-y-3" style={{ animation: `fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s both` }}>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-5 w-16 rounded-lg" />
                                    <Skeleton className="h-5 w-40 rounded-lg" />
                                </div>
                                <Skeleton className="w-full rounded-2xl" style={{ aspectRatio: '297/210' }} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && displayedDistricts.length === 0 && (
                    <div 
                        className="text-center py-24 animate-fade-in-up"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 mb-5">
                            <span className="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-600">folder_off</span>
                        </div>
                        <h3 className="text-lg font-bold text-zinc-500 dark:text-zinc-400 mb-1" style={{ fontFamily: 'var(--font-headline)' }}>ไม่มีข้อมูล</h3>
                        <p className="text-sm text-zinc-400 dark:text-zinc-500">เลือกอำเภอจาก dropdown ด้านบนเพื่อดู report</p>
                    </div>
                )}

                {/* District Report Cards */}
                {!isLoading && displayedDistricts.map((district, i) => {
                    const districtData = data.filter(d => d.district === district);
                    return (
                        <div 
                            key={district} 
                            className="space-y-3"
                            style={{ animation: `fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s both` }}
                        >
                            {/* District Label */}
                            <div className="flex items-center gap-3">
                                <span className="pill-badge bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold">
                                    {i + 1} / {displayedDistricts.length}
                                </span>
                                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>
                                    {district}
                                </span>
                                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                                    — {districtData.length} สถานี
                                </span>
                            </div>

                            {/* Report Card — premium glass panel */}
                            <div
                                className="group w-full overflow-hidden rounded-[20px] transition-all duration-500 hover:scale-[1.003] cursor-default relative"
                                style={{ 
                                    aspectRatio: "297/210",
                                    background: 'rgba(255, 255, 255, 0.85)',
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(0, 0, 0, 0.04)',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03), 0 12px 32px rgba(0,0,0,0.04)',
                                }}
                            >
                                {/* Gradient accent line — top */}
                                <div 
                                    className="absolute top-0 left-0 right-0 h-[3px] opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{ background: 'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)' }}
                                />

                                {/* Hover glow overlay */}
                                <div 
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[20px]"
                                    style={{ boxShadow: '0 8px 40px rgba(59, 130, 246, 0.06), 0 20px 60px rgba(99, 102, 241, 0.04)' }}
                                />

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

            {/* ═══ Bottom Padding ═══ */}
            <div className="h-12" />
        </div>
    );
}
