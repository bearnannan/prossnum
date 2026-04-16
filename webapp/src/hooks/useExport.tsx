import { useState } from 'react';
import { useToast } from "@/components/Toast";

export const formatDateDisplay = (dateStr?: string) => {
  if (!dateStr || dateStr === "-" || dateStr === "") return "-";
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const yy = y.slice(-2);
  return `${d}/${m}/${yy}`;
};

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<"pdf" | "txt" | "jpeg">("pdf");
  const [selectedExportStations, setSelectedExportStations] = useState<string[]>([]);
  const [expandedDistricts, setExpandedDistricts] = useState<string[]>([]);
  const { showToast } = useToast();

  const handleExportTXT = (activeCategory: 'station' | 'client', data: any[]) => {
    setIsExportModalOpen(false);
    const filteredExportData = data.filter(d => selectedExportStations.includes(`${d.district}|${d.stationName}`));
    if (filteredExportData.length === 0) return;
    
    const grouped = filteredExportData.reduce((acc, item) => {
      if (!acc[item.district]) acc[item.district] = [];
      acc[item.district].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    
    // Header Logic
    const districtNames = Object.keys(grouped).map(d => `อ.${d}`);
    let districtsStr = "";
    if (districtNames.length === 1) districtsStr = `"${districtNames[0]}"`;
    else if (districtNames.length === 2) districtsStr = `"${districtNames[0]}" และ "${districtNames[1]}"`;
    else {
      const last = districtNames.pop();
      districtsStr = districtNames.map(d => `"${d}"`).join(", ") + ` และ "${last}"`;
    }

    // Pole height (assume the first one if present, otherwise default to legacy "9 เมตร")
    const commonPoleHeight = filteredExportData[0]?.poleHeight || "9 เมตร";
    
    let text = `${dateStr}\n`;
    const commonProvince = filteredExportData[0]?.province || 'กาญจนบุรี';
    if (activeCategory === 'station') {
      text += `รายงานความคืบหน้างานก่อสร้างฐานรากและติดตั้งเสาสัญญาณ ${commonPoleHeight} สถานีลูกข่าย ${districtsStr} จ.${commonProvince} เขต11 (เพชรบุรี)\n\n`;
    } else {
       text += `รายงานการติดตั้งระบบลูกข่าย (${districtsStr}) จ.${commonProvince}\n\n`;
    }

    // ─── Summary: total / completed / in-progress / not-started ───
    const totalStations = filteredExportData.length;
    let completedCount = 0;
    let inProgressCount = 0;
    let notStartedCount = 0;

    filteredExportData.forEach(item => {
      let progress: number;
      if (activeCategory === 'client') {
        progress = (parseFloat(item.electricProgress || 0) + parseFloat(item.groundProgress || 0) + parseFloat(item.feederProgress || 0)) / 3;
      } else {
        progress = (parseFloat(item.foundationProgress || 0) + parseFloat(item.poleInstallationProgress || 0)) / 2;
      }
      if (progress >= 100) completedCount++;
      else if (progress > 0) inProgressCount++;
      else notStartedCount++;
    });

    text += `จำนวนทั้งหมด ${totalStations} สถานี\n`;
    text += `  - ติดตั้งแล้วเสร็จ ${completedCount} สถานี\n`;
    text += `  - อยู่ระหว่างติดตั้ง ${inProgressCount} สถานี\n`;
    text += `  - ยังไม่ได้ติดตั้ง ${notStartedCount} สถานี\n\n`;

    const groupedEntries = Object.entries(grouped) as [string, any[]][];
    groupedEntries.forEach(([district, items], gIdx) => {
      text += `📍 อำเภอ${district}\n\n`;
      items.forEach((item, idx) => {
        if (activeCategory === 'client') {
          text += `[${idx + 1}]. ${item.stationName}\n`;
          text += `   - พิกัด: ${item.lat}, ${item.lon}\n`;
          text += `   - ความสูงเสา: ${item.poleHeight}\n`;
          text += `   - ระบบไฟฟ้า: ${item.electricProgress}% (ระยะสาย Main: ${item.electricMain})\n`;
          text += `   - ระบบกราวด์: ${item.groundProgress}% (AC: ${item.groundAC} Ω | Equip: ${item.groundEquip} Ω)\n`;
          text += `   - สาย Feeder: ${item.feederProgress}% (Yagi No: ${item.yagiNo} | SN: ${item.sn} | ระยะ feed: ${item.feedDistance})\n`;
          text += `   - การติดตั้งอุปกรณ์บนเสา: ${item.towerProgress}%\n`;
          text += `   - การติดตั้งเครื่องวิทยุฯ: ${item.radioProgress}% (SN: ${item.radioSN})\n`;
          text += `   - แบตเตอรี่ SN: ${item.batterySN}\n`;
          text += `   - ขาติดตั้ง: ${item.mountType} | องศา: ${item.angle} | Test Feeder: ${item.testFeeder}\n`;
          text += `   - ยื่นขอมิเตอร์: ${item.meterRequest || "ยังไม่ได้ยื่น"}\n`;
          text += `   - วันที่: ${formatDateDisplay(item.startDate)} - ${formatDateDisplay(item.endDate)}\n`;
          text += `   - หมายเหตุ: ${item.remark || "-"}\n`;
        } else {
          text += `[${idx + 1}]. ${item.stationName}`;
          if (item.poleHeight) text += ` (${item.poleHeight})`;
          if (item.baseType) text += ` ${item.baseType}`;
          if (item.type) text += ` ${item.type}`;
          text += `\n`;
          text += `งานก่อสร้างฐานราก: ${item.foundationProgress}%\n`;
          text += `งานติดตั้งโครงเสา: ${item.poleInstallationProgress}%\n`;
          text += `** หมายเหตุ: ${item.remark || "-"}\n`;
          text += `เริ่มงาน: ${formatDateDisplay(item.startDate)}\n`;
          text += `เสร็จงาน: ${formatDateDisplay(item.endDate)}\n`;
        }
        
        if (idx < items.length - 1) {
          text += `\n---\n\n`;
        }
      });

      if (gIdx < groupedEntries.length - 1) {
        text += `\n=========================================\n\n`;
      }
    });

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report_${activeCategory}_${dateStr}.txt`;
    link.click();
  };

  const handleExportPDF = async (activeCategory: 'station' | 'client', data: any[]) => {
    setIsExportModalOpen(false);
    if (isExporting) return;
    setIsExporting(true);
    try {
      const [{ toJpeg }, jsPDFModule, { createRoot }, ExportBentoReportModule] = await Promise.all([
        import('html-to-image'),
        import('jspdf'),
        import('react-dom/client'),
        import('@/components/ExportBentoReport'),
      ]);
      const jsPDF = jsPDFModule.default;
      const ExportBentoReportRaw = ExportBentoReportModule.default;
      await document.fonts.ready;

      const filtered = data.filter(d => selectedExportStations.includes(`${d.district}|${d.stationName}`));
      if (filtered.length === 0) {
        showToast("กรุณาเลือกข้อมูลที่ต้องการ Export", "error");
        setIsExporting(false);
        return;
      }

      const groupedToExport = filtered.reduce((acc, item) => {
        if (!acc[item.district]) acc[item.district] = [];
        acc[item.district].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      const districtKeys = Object.keys(groupedToExport).sort();
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      let isFirst = true;

      for (const d of districtKeys) {
        const stations = groupedToExport[d];
        const container = document.createElement('div');
        Object.assign(container.style, { position: 'fixed', top: '0', left: '-2000px', width: '1122px', height: '794px', zIndex: '-1000' });
        document.body.appendChild(container);
        const root = createRoot(container);
        
        await new Promise<void>(resolve => {
          root.render(<ExportBentoReportRaw district={d} stations={stations} category={activeCategory} />);
          setTimeout(resolve, 800); 
        });

        const el = container.firstChild as HTMLElement;
        const dataUrl = await toJpeg(el, { quality: 1.0, width: 1122, height: 794, pixelRatio: 6.25 });
        
        if (!isFirst) pdf.addPage();
        pdf.addImage(dataUrl, 'JPEG', 0, 0, 297, 210);
        isFirst = false;

        root.unmount();
        document.body.removeChild(container);
      }

      pdf.save(`report_${activeCategory}_${new Date().getTime()}.pdf`);
      showToast('Export PDF สำเร็จ (600 DPI)', 'success');
    } catch (error: any) {
      console.error(error);
      showToast('Export ล้มเหลว: ' + error.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJPEG = async (activeCategory: 'station' | 'client', data: any[]) => {
    setIsExportModalOpen(false);
    if (isExporting) return;
    setIsExporting(true);
    try {
      const [{ toJpeg }, { createRoot }, ExportBentoReportModule] = await Promise.all([
        import('html-to-image'),
        import('react-dom/client'),
        import('@/components/ExportBentoReport'),
      ]);
      const ExportBentoReportRaw = ExportBentoReportModule.default;
      await document.fonts.ready;
      
      const filtered = data.filter(d => selectedExportStations.includes(`${d.district}|${d.stationName}`));
      if (filtered.length === 0) {
        showToast("กรุณาเลือกข้อมูลที่ต้องการ Export", "error");
        setIsExporting(false);
        return;
      }
      
      const groupedToExport = filtered.reduce((acc, item) => {
        if (!acc[item.district]) acc[item.district] = [];
        acc[item.district].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      const districtsToExport = Object.keys(groupedToExport).sort();

      for (const d of districtsToExport) {
        const stations = groupedToExport[d];
        const container = document.createElement('div');
        Object.assign(container.style, { position: 'fixed', top: '0', left: '-2000px', width: '1122px', height: '794px', zIndex: '-1000' });
        document.body.appendChild(container);
        const root = createRoot(container);
        
        await new Promise<void>(res => {
          root.render(<ExportBentoReportRaw district={d} stations={stations} category={activeCategory} />);
          setTimeout(res, 800);
        });

        const el = container.firstChild as HTMLElement;
        const dataUrl = await toJpeg(el, { quality: 1.0, width: 1122, height: 794, pixelRatio: 6.25 });
        const link = document.createElement('a');
        link.download = `report_${d}_${new Date().getTime()}.jpg`;
        link.href = dataUrl;
        link.click();
        
        root.unmount();
        document.body.removeChild(container);
      }
      showToast('Export JPEG สำเร็จ', 'success');
    } catch (error: any) {
      console.error(error);
      showToast('Export ล้มเหลว: ' + error.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting, setIsExporting,
    isExportModalOpen, setIsExportModalOpen,
    exportType, setExportType,
    selectedExportStations, setSelectedExportStations,
    expandedDistricts, setExpandedDistricts,
    handleExportTXT,
    handleExportPDF,
    handleExportJPEG
  };
}
