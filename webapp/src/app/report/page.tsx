"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { createRoot } from "react-dom/client";
import type { StationData } from "@/app/api/dashboard-data/route";
import { Skeleton } from "@/components/Skeleton";

const ExportBentoReport = dynamic(() => import("@/components/ExportBentoReport"), {
  ssr: false,
});

import ExportBentoReportRaw from "@/components/ExportBentoReport";

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((res) => res.json());

export default function ReportPage() {
  const { data: responseData, isLoading: swrIsLoading } = useSWR("/api/dashboard-data", fetcher, {
    dedupingInterval: 60000,
    keepPreviousData: true,
  });

  const data: StationData[] = responseData?.data || [];
  const isLoading = swrIsLoading && !responseData;
  const [isExporting, setIsExporting] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const router = useRouter();

  const districts = Array.from(new Set(data.map((item) => item.district).filter(Boolean))).sort();
  const displayedDistricts = selectedDistrict === "all" ? districts : [selectedDistrict];

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
        const stationsForDistrict = data.filter((item) => item.district === district);
        const container = document.createElement("div");

        Object.assign(container.style, {
          position: "fixed",
          top: "0",
          left: "-2000px",
          width: "1122px",
          height: "794px",
          zIndex: "-1000",
          pointerEvents: "none",
          backgroundColor: "#0A0A0F",
        });

        document.body.appendChild(container);
        const root = createRoot(container);

        await new Promise<void>((resolve) => {
          root.render(
            <div style={{ width: "1122px", height: "794px", background: "#0A0A0F" }}>
              <ExportBentoReportRaw
                district={district}
                stations={stationsForDistrict}
                allStations={data}
                category="station"
              />
            </div>
          );
          setTimeout(resolve, 900);
        });

        const el = container.firstChild as HTMLElement;
        const imgData = await toJpeg(el, {
          quality: 1,
          backgroundColor: "#0A0A0F",
          width: 1122,
          height: 794,
          pixelRatio: 6.25,
        });

        root.unmount();
        document.body.removeChild(container);

        if (!isFirstPage) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
        isFirstPage = false;
      }

      pdf.save(selectedDistrict === "all" ? "retro-neon-report-all.pdf" : `retro-neon-report-${selectedDistrict}.pdf`);
    } catch (err: any) {
      alert("Export failed: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-base text-slate-200 bg-grid font-sans relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-120px] left-1/4 h-[420px] w-[420px] rounded-full bg-neon-cyan/10 blur-[140px]" />
        <div className="absolute bottom-[-140px] right-1/5 h-[460px] w-[460px] rounded-full bg-neon-magenta/10 blur-[150px]" />
      </div>

      <div
        className="sticky top-0 z-30 border-b border-neon-cyan/15"
        style={{
          background: "rgba(10, 10, 15, 0.86)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          boxShadow: "0 0 24px rgba(0,240,255,0.06), 0 8px 24px rgba(0,0,0,0.35)",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 px-3 py-2 text-xs font-black uppercase tracking-wider text-neon-cyan transition-all hover:bg-neon-cyan/10 hover:shadow-[0_0_16px_rgba(0,240,255,0.18)]"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Dashboard
          </button>

          <div className="h-6 w-px bg-neon-cyan/20" />

          <h1
            className="flex items-center gap-2 text-sm font-extrabold tracking-wider text-white"
            style={{ fontFamily: "var(--font-display)", textShadow: "0 0 10px rgba(0,240,255,0.18)" }}
          >
            <span className="material-symbols-outlined text-base text-neon-cyan">assessment</span>
            Report Preview
          </h1>

          <div className="ml-auto flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neon-cyan/70 text-base pointer-events-none">filter_list</span>
              <select
                value={selectedDistrict}
                onChange={(event) => setSelectedDistrict(event.target.value)}
                className="neon-input min-w-[220px] appearance-none pl-9 pr-9 py-2.5 text-sm font-bold"
              >
                <option value="all">ทุกอำเภอ ({districts.length} อำเภอ)</option>
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">expand_more</span>
            </div>

            <button
              onClick={handleExportPDF}
              disabled={isExporting || displayedDistricts.length === 0}
              className="group flex items-center gap-2 rounded-xl bg-neon-cyan px-5 py-2.5 text-sm font-black uppercase tracking-wider text-dark-base shadow-[0_0_16px_rgba(0,240,255,0.24)] transition-all hover:scale-[1.02] hover:shadow-[0_0_26px_rgba(0,240,255,0.42)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Exporting
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm group-hover:translate-y-0.5 transition-transform">download</span>
                  Export PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        {isLoading && (
          <div className="space-y-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-16 rounded-lg bg-dark-surface" />
                  <Skeleton className="h-5 w-40 rounded-lg bg-dark-surface" />
                </div>
                <Skeleton className="w-full rounded-2xl bg-dark-surface" style={{ aspectRatio: "297/210" }} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && displayedDistricts.length === 0 && (
          <div className="geo-corner rounded-2xl border border-neon-cyan/15 bg-dark-surface/70 py-24 text-center shadow-card">
            <div className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan shadow-[0_0_18px_rgba(0,240,255,0.12)]">
              <span className="material-symbols-outlined text-4xl">folder_off</span>
            </div>
            <h3 className="mb-1 text-lg font-extrabold text-slate-300" style={{ fontFamily: "var(--font-display)" }}>
              ไม่มีข้อมูล
            </h3>
            <p className="text-sm text-slate-500">เลือกอำเภอจาก dropdown ด้านบนเพื่อดู report</p>
          </div>
        )}

        {!isLoading &&
          displayedDistricts.map((district, index) => {
            const districtData = data.filter((item) => item.district === district);
            return (
              <section key={district} className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-lg border border-neon-cyan/25 bg-neon-cyan/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-neon-cyan shadow-[0_0_12px_rgba(0,240,255,0.10)]">
                    {index + 1} / {displayedDistricts.length}
                  </span>
                  <span className="text-sm font-extrabold text-white" style={{ fontFamily: "var(--font-display)" }}>
                    {district}
                  </span>
                  <span className="text-xs font-bold text-slate-500">- {districtData.length} สถานี</span>
                </div>

                <div
                  className="geo-corner group w-full overflow-hidden rounded-2xl border border-neon-cyan/15 bg-dark-surface/80 shadow-card transition-all duration-300 hover:border-neon-cyan/30 hover:shadow-[0_0_28px_rgba(0,240,255,0.12)]"
                  style={{ aspectRatio: "297/210" }}
                >
                  <div className="h-full w-full">
                    <ExportBentoReport district={district} stations={districtData} allStations={data} category="station" />
                  </div>
                </div>
              </section>
            );
          })}
      </main>

      <div className="h-12" />
    </div>
  );
}
