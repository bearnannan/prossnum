import { useState } from 'react';
import { useToast } from "@/components/Toast";
import { logClientActivity } from "@/lib/client-activity";

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
  const [exportType, setExportType] = useState<"pdf" | "txt" | "jpeg" | "csv">("pdf");
  const [selectedExportStations, setSelectedExportStations] = useState<string[]>([]);
  const [expandedDistricts, setExpandedDistricts] = useState<string[]>([]);
  const { showToast } = useToast();

  const handleExportTXT = (activeCategory: 'station' | 'client' | 'incident', data: any[]) => {
    setIsExportModalOpen(false);
    const filteredExportData = data.filter(d => selectedExportStations.includes(`${d.district}|${d.stationName || d.station}`));
    if (filteredExportData.length === 0) return;
    logClientActivity({
      eventType: "export_download",
      eventName: "export_txt_started",
      targetType: activeCategory,
      targetLabel: "TXT export",
      metadata: { selectedCount: filteredExportData.length, totalCount: data.length },
    });

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
    else if (districtNames.length > 2) {
      const last = districtNames.pop();
      districtsStr = districtNames.map(d => `"${d}"`).join(", ") + ` และ "${last}"`;
    }

    // Pole height (assume the first one if present, otherwise default to legacy "9 เมตร")
    const commonPoleHeight = filteredExportData[0]?.poleHeight || "9 เมตร";

    let text = `${dateStr}\n`;
    const commonProvince = filteredExportData[0]?.province || 'กาญจนบุรี';
    if (activeCategory === 'station') {
      text += `รายงานความคืบหน้างานก่อสร้างฐานรากและติดตั้งเสาสัญญาณ ${commonPoleHeight} สถานีลูกข่าย ${districtsStr} จ.${commonProvince} เขต11 (เพชรบุรี)\n\n`;
    } else if (activeCategory === 'client') {
      text += `รายงานการติดตั้งระบบลูกข่าย (${districtsStr}) จ.${commonProvince}\n\n`;
    } else {
      text += `รายงานเหตุขัดข้องและการจัดการเหตุเสีย (${districtsStr}) จ.${commonProvince}\n\n`;
    }

    // ─── Summary: counts from ALL stations in the SAME province (regardless of selection) ───
    const provinceData = data.filter(d => d.province === commonProvince);
    const totalStations = provinceData.length;
    let completedCount = 0;
    let inProgressCount = 0;
    let notStartedCount = 0;
    let meterRequestCount = 0;
    let meterInstalledCount = 0;
    let radioInstalledCount = 0;

    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    provinceData.forEach(item => {
      if (activeCategory === 'incident') {
        const status = item.repair_status || "รอดำเนินการ";
        if (status === "เสร็จสิ้น") completedCount++;
        else if (status === "กำลังดำเนินการ") inProgressCount++;
        else notStartedCount++;

        const priority = String(item.priority || "low").toLowerCase();
        if (priority === "critical") criticalCount++;
        else if (priority === "high") highCount++;
        else if (priority === "medium") mediumCount++;
        else lowCount++;
      } else {
        let progress: number;
        if (activeCategory === 'client') {
          progress = (parseFloat(item.electricProgress || 0) + parseFloat(item.groundProgress || 0) + parseFloat(item.feederProgress || 0)) / 3;
          if (Number(item.radioProgress) === 100) radioInstalledCount++;
        } else {
          progress = (parseFloat(item.foundationProgress || 0) + parseFloat(item.poleInstallationProgress || 0)) / 2;
        }

        if (progress >= 100) completedCount++;
        else if (progress > 0) inProgressCount++;
        else notStartedCount++;

        if (item.meterRequest && item.meterRequest !== "ยังไม่ได้ยื่น") {
          meterRequestCount++;
        }

        if (item.meterInstalled) {
          meterInstalledCount++;
        }
      }
    });

    if (activeCategory === 'client') {
      text += `จำนวนทั้งหมด ${totalStations} สถานี\n`;
      text += `1. ติดตั้งระบบลูกข่าย\n`;
      text += `   - ติดตั้งระบบ ลข.แล้ว ${completedCount} สถานี\n`;
      text += `   - อยู่ระหว่างติดตั้ง ${inProgressCount} สถานี\n`;
      text += `   - ยังไม่ได้ติดตั้ง ${notStartedCount} สถานี\n`;
      text += `2. วางเครื่องวิทยุชนิดประจำที่\n`;
      text += `   - วางเครื่องวิทยุแล้วเสร็จ ${radioInstalledCount} สถานี\n`;
      text += `3. งานมิเตอร์ไฟฟ้า\n`;
      text += `   - ยื่นขอมิเตอร์แล้ว ${meterRequestCount} สถานี\n`;
      text += `   - ติดตั้งมิเตอร์แล้ว ${meterInstalledCount} สถานี\n`;
    } else if (activeCategory === 'station') {
      text += `จำนวนทั้งหมด ${totalStations} สถานี\n`;
      text += `  - ติดตั้งแล้วเสร็จ ${completedCount} สถานี\n`;
      text += `  - อยู่ระหว่างติดตั้ง ${inProgressCount} สถานี\n`;
      text += `  - ยังไม่ได้ติดตั้ง ${notStartedCount} สถานี\n`;
      text += `  - ยื่นขอมิเตอร์ ${meterRequestCount} สถานี\n`;
      text += `  - ติดตั้งมิเตอร์แล้ว ${meterInstalledCount} สถานี\n`;
    } else {
      text += `จำนวนเหตุเสียทั้งหมด ${totalStations} รายการ\n`;
      text += `  - ดำเนินการแก้ไขเสร็จสิ้น: ${completedCount} รายการ\n`;
      text += `  - อยู่ระหว่างดำเนินการแก้ไข: ${inProgressCount} รายการ\n`;
      text += `  - รอการดำเนินการ: ${notStartedCount} รายการ\n`;
      text += `ลำดับความสำคัญ:\n`;
      text += `  - วิกฤต (Critical): ${criticalCount} รายการ\n`;
      text += `  - สูง (High): ${highCount} รายการ\n`;
      text += `  - ปานกลาง (Medium): ${mediumCount} รายการ\n`;
      text += `  - ต่ำ (Low): ${lowCount} รายการ\n`;
    }

    text += `=========================================\n\n`;

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
          text += `   - การติดตั้งอุปกรณ์บนเสา (Yagi): ${item.towerProgress}%\n`;
          text += `   - การติดตั้งเครื่องวิทยุ: ${item.radioProgress}% (SN: ${item.radioSN})\n`;
          text += `   - แบตเตอรี่ (SN): ${item.batterySN}\n`;
          text += `   - RSSI ${item.rssi || "-"} dBm.\n`;
          text += `   - ขาติดตั้ง: ${item.mountType} | องศา: ${item.angle} | Test Feeder: ${item.testFeeder}\n`;
          text += `   - ยื่นขอมิเตอร์: ${item.meterRequest || "ยังไม่ได้ยื่น"}\n`;
          text += `   - มิเตอร์: ${item.meterInstalled ? "ติดตั้งแล้ว" : "ยังไม่ได้ติดตั้ง"}\n`;
          if (item.peaUserNo) text += `   - หมายเลขผู้ใช้ไฟฟ้า: ${item.peaUserNo}\n`;
          if (item.meterNo) text += `   - หมายเลขมิเตอร์ไฟฟ้า: ${item.meterNo}\n`;
          text += `   - วันที่: ${formatDateDisplay(item.startDate)} - ${formatDateDisplay(item.endDate)}\n`;
          text += `   - หมายเหตุ: ${item.remark || "-"}\n`;
        } else if (activeCategory === 'station') {
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
        } else {
          text += `[${idx + 1}]. หมายเลขแจ้งเสีย: ${item.incident_no}\n`;
          text += `   - สถานี: ${item.stationName || item.station}\n`;
          if (item.latitude || item.longitude) {
            text += `   - พิกัด: ${item.latitude || "-"}, ${item.longitude || "-"}\n`;
          }
          text += `   - ลำดับความสำคัญ: ${item.priority?.toUpperCase() || "LOW"}\n`;
          text += `   - อาการเสีย: ${item.issue_description || "-"}\n`;
          text += `   - ผู้แจ้งเหตุ: ${item.reporter || "-"} (เบอร์โทร: ${item.reporter_phone || item.phone || "-"})\n`;
          text += `   - ผู้รับผิดชอบ: ${item.assignee || "-"}\n`;
          text += `   - สถานะการดำเนินการ: ${item.repair_status || "-"}\n`;
          text += `   - เวลาที่แจ้งเหตุ: ${item.reported_at ? new Date(item.reported_at).toLocaleString('th-TH') : "-"}\n`;
          text += `   - กำหนดเสร็จ (SLA Due): ${item.sla_due_at ? new Date(item.sla_due_at).toLocaleString('th-TH') : "-"}\n`;
          if (item.penalty_amount_baht) {
            text += `   - ค่าปรับคงค้างสะสม: ${item.penalty_amount_baht} บาท\n`;
          }
          text += `   - หมายเหตุ/ข้อมูลเพิ่มเติม: ${item.remark || (item.raw_payload && (item.raw_payload as any).remark) || "-"}\n`;
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
    logClientActivity({
      eventType: "export_download",
      eventName: "export_txt_completed",
      targetType: activeCategory,
      targetLabel: link.download,
      metadata: { selectedCount: filteredExportData.length },
    });
  };

  const handleExportCSV = (activeCategory: 'station' | 'client' | 'incident', data: any[]) => {
    setIsExportModalOpen(false);
    const filteredExportData = data.filter(d => selectedExportStations.includes(`${d.district}|${d.stationName || d.station}`));
    if (filteredExportData.length === 0) {
      showToast("กรุณาเลือกข้อมูลที่ต้องการ Export", "error");
      return;
    }
    logClientActivity({
      eventType: "export_download",
      eventName: "export_csv_started",
      targetType: activeCategory,
      targetLabel: "CSV export",
      metadata: { selectedCount: filteredExportData.length, totalCount: data.length },
    });

    let csvContent = "";
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    if (activeCategory === 'incident') {
      const headers = [
        "หมายเลขแจ้งเสีย",
        "สถานี",
        "อำเภอ",
        "จังหวัด",
        "ละติจูด",
        "ลองจิจูด",
        "ลำดับความสำคัญ",
        "อาการเสีย",
        "ผู้แจ้งเหตุ",
        "เบอร์โทรผู้แจ้ง",
        "ผู้รับผิดชอบ",
        "สถานะ",
        "วันที่แจ้งเหตุ",
        "กำหนดเสร็จ (SLA Due)",
        "ค่าปรับคงค้างสะสม (บาท)",
        "หมายเหตุ"
      ];
      csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

      filteredExportData.forEach(item => {
        const row = [
          item.incident_no || "",
          item.stationName || item.station || "",
          item.district || "",
          item.province || "",
          item.latitude !== undefined && item.latitude !== null ? String(item.latitude) : "",
          item.longitude !== undefined && item.longitude !== null ? String(item.longitude) : "",
          item.priority || "",
          item.issue_description || "",
          item.reporter || "",
          item.reporter_phone || item.phone || "",
          item.assignee || "",
          item.repair_status || "",
          item.reported_at ? new Date(item.reported_at).toLocaleString('th-TH') : "",
          item.sla_due_at ? new Date(item.sla_due_at).toLocaleString('th-TH') : "",
          item.penalty_amount_baht !== undefined && item.penalty_amount_baht !== null ? String(item.penalty_amount_baht) : "0",
          item.remark || (item.raw_payload && (item.raw_payload as any).remark) || ""
        ];
        csvContent += row.map(r => `"${String(r).replace(/"/g, '""')}"`).join(",") + "\n";
      });
    } else if (activeCategory === 'client') {
      const headers = [
        "สถานี",
        "อำเภอ",
        "จังหวัด",
        "ละติจูด",
        "ลองจิจูด",
        "ความสูงเสา",
        "ระบบไฟฟ้า (%)",
        "ระยะสาย Main (ม.)",
        "ระบบกราวด์ (%)",
        "กราวด์ AC (Ω)",
        "กราวด์ Equip (Ω)",
        "สาย Feeder (%)",
        "Yagi No",
        "SN Yagi",
        "ระยะ Feed (ม.)",
        "ติดตั้งอุปกรณ์บนเสา (%)",
        "ติดตั้งเครื่องวิทยุ (%)",
        "SN วิทยุ",
        "SN แบตเตอรี่",
        "RSSI (dBm)",
        "ขาติดตั้ง",
        "องศา",
        "Test Feeder",
        "ยื่นขอมิเตอร์",
        "ติดตั้งมิเตอร์",
        "หมายเลขผู้ใช้ไฟฟ้า",
        "หมายเลขมิเตอร์ไฟฟ้า",
        "เริ่มงาน",
        "เสร็จงาน",
        "หมายเหตุ"
      ];
      csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

      filteredExportData.forEach(item => {
        const row = [
          item.stationName || "",
          item.district || "",
          item.province || "",
          item.lat || "",
          item.lon || "",
          item.poleHeight || "",
          item.electricProgress || "0",
          item.electricMain || "",
          item.groundProgress || "0",
          item.groundAC || "",
          item.groundEquip || "",
          item.feederProgress || "0",
          item.yagiNo || "",
          item.sn || "",
          item.feedDistance || "",
          item.towerProgress || "0",
          item.radioProgress || "0",
          item.radioSN || "",
          item.batterySN || "",
          item.rssi || "",
          item.mountType || "",
          item.angle || "",
          item.testFeeder || "",
          item.meterRequest || "ยังไม่ได้ยื่น",
          item.meterInstalled ? "ติดตั้งแล้ว" : "ยังไม่ได้ติดตั้ง",
          item.peaUserNo || "",
          item.meterNo || "",
          formatDateDisplay(item.startDate),
          formatDateDisplay(item.endDate),
          item.remark || ""
        ];
        csvContent += row.map(r => `"${String(r).replace(/"/g, '""')}"`).join(",") + "\n";
      });
    } else {
      const headers = [
        "สถานี",
        "อำเภอ",
        "จังหวัด",
        "ความสูงเสา",
        "Base Type",
        "Type",
        "ความคืบหน้าฐานราก (%)",
        "ความคืบหน้าเสา (%)",
        "เริ่มงาน",
        "เสร็จงาน",
        "หมายเหตุ"
      ];
      csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

      filteredExportData.forEach(item => {
        const row = [
          item.stationName || "",
          item.district || "",
          item.province || "",
          item.poleHeight || "",
          item.baseType || "",
          item.type || "",
          item.foundationProgress || "0",
          item.poleInstallationProgress || "0",
          formatDateDisplay(item.startDate),
          formatDateDisplay(item.endDate),
          item.remark || ""
        ];
        csvContent += row.map(r => `"${String(r).replace(/"/g, '""')}"`).join(",") + "\n";
      });
    }

    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report_${activeCategory}_${dateStr}.csv`;
    link.click();
    logClientActivity({
      eventType: "export_download",
      eventName: "export_csv_completed",
      targetType: activeCategory,
      targetLabel: link.download,
      metadata: { selectedCount: filteredExportData.length },
    });
    showToast("Export CSV สำเร็จ", "success");
  };

  const handleExportPDF = async (activeCategory: 'station' | 'client' | 'incident', data: any[]) => {
    setIsExportModalOpen(false);
    if (isExporting) return;
    setIsExporting(true);
    try {
      const [{ toJpeg }, jsPDFModule, { createRoot }] = await Promise.all([
        import('html-to-image'),
        import('jspdf'),
        import('react-dom/client'),
      ]);
      const jsPDF = jsPDFModule.default;
      await document.fonts.ready;

      const filtered = data.filter(d => selectedExportStations.includes(`${d.district}|${d.stationName || d.station}`));
      if (filtered.length === 0) {
        showToast("กรุณาเลือกข้อมูลที่ต้องการ Export", "error");
        setIsExporting(false);
        return;
      }
      logClientActivity({
        eventType: "export_download",
        eventName: "export_pdf_started",
        targetType: activeCategory,
        targetLabel: "PDF export",
        metadata: { selectedCount: filtered.length, totalCount: data.length },
      });

      const groupedToExport = filtered.reduce((acc, item) => {
        if (!acc[item.district]) acc[item.district] = [];
        acc[item.district].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      const districtKeys = Object.keys(groupedToExport).sort();
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      let isFirst = true;

      let ReportComponent: any;
      if (activeCategory === 'incident') {
        const mod = await import('@/components/ExportIncidentReport');
        ReportComponent = mod.default;
      } else {
        const mod = await import('@/components/ExportBentoReport');
        ReportComponent = mod.default;
      }

      for (const d of districtKeys) {
        const stations = groupedToExport[d];
        const container = document.createElement('div');
        Object.assign(container.style, { position: 'fixed', top: '0', left: '-2000px', width: '1122px', height: '794px', zIndex: '-1000', backgroundColor: '#0A0A0F' });
        document.body.appendChild(container);
        const root = createRoot(container);

        await new Promise<void>(resolve => {
          if (activeCategory === 'incident') {
            root.render(<ReportComponent district={d} incidents={stations} allIncidents={data} />);
          } else {
            root.render(<ReportComponent district={d} stations={stations} allStations={data} category={activeCategory} />);
          }
          setTimeout(resolve, 800);
        });

        const el = container.firstChild as HTMLElement;
        const dataUrl = await toJpeg(el, { quality: 1.0, backgroundColor: '#0A0A0F', width: 1122, height: 794, pixelRatio: 6.25 });

        if (!isFirst) pdf.addPage();
        pdf.addImage(dataUrl, 'JPEG', 0, 0, 297, 210);
        isFirst = false;

        root.unmount();
        document.body.removeChild(container);
      }

      const fileName = `report_${activeCategory}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
      logClientActivity({
        eventType: "export_download",
        eventName: "export_pdf_completed",
        targetType: activeCategory,
        targetLabel: fileName,
        metadata: { selectedCount: filtered.length, districts: districtKeys.length },
      });
      showToast('Export PDF สำเร็จ (600 DPI)', 'success');
    } catch (error: any) {
      console.error(error);
      showToast('Export ล้มเหลว: ' + error.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJPEG = async (activeCategory: 'station' | 'client' | 'incident', data: any[]) => {
    setIsExportModalOpen(false);
    if (isExporting) return;
    setIsExporting(true);
    try {
      const [{ toJpeg }, { createRoot }] = await Promise.all([
        import('html-to-image'),
        import('react-dom/client'),
      ]);
      await document.fonts.ready;

      const filtered = data.filter(d => selectedExportStations.includes(`${d.district}|${d.stationName || d.station}`));
      if (filtered.length === 0) {
        showToast("กรุณาเลือกข้อมูลที่ต้องการ Export", "error");
        setIsExporting(false);
        return;
      }
      logClientActivity({
        eventType: "export_download",
        eventName: "export_jpeg_started",
        targetType: activeCategory,
        targetLabel: "JPEG export",
        metadata: { selectedCount: filtered.length, totalCount: data.length },
      });

      const groupedToExport = filtered.reduce((acc, item) => {
        if (!acc[item.district]) acc[item.district] = [];
        acc[item.district].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      const districtsToExport = Object.keys(groupedToExport).sort();

      let ReportComponent: any;
      if (activeCategory === 'incident') {
        const mod = await import('@/components/ExportIncidentReport');
        ReportComponent = mod.default;
      } else {
        const mod = await import('@/components/ExportBentoReport');
        ReportComponent = mod.default;
      }

      for (const d of districtsToExport) {
        const stations = groupedToExport[d];
        const container = document.createElement('div');
        Object.assign(container.style, { position: 'fixed', top: '0', left: '-2000px', width: '1122px', height: '794px', zIndex: '-1000', backgroundColor: '#0A0A0F' });
        document.body.appendChild(container);
        const root = createRoot(container);

        await new Promise<void>(res => {
          if (activeCategory === 'incident') {
            root.render(<ReportComponent district={d} incidents={stations} allIncidents={data} />);
          } else {
            root.render(<ReportComponent district={d} stations={stations} allStations={data} category={activeCategory} />);
          }
          setTimeout(res, 800);
        });

        const el = container.firstChild as HTMLElement;
        const dataUrl = await toJpeg(el, { quality: 1.0, backgroundColor: '#0A0A0F', width: 1122, height: 794, pixelRatio: 6.25 });
        const link = document.createElement('a');
        link.download = `report_${d}_${new Date().getTime()}.jpg`;
        link.href = dataUrl;
        link.click();

        root.unmount();
        document.body.removeChild(container);
      }
      showToast('Export JPEG สำเร็จ', 'success');
      logClientActivity({
        eventType: "export_download",
        eventName: "export_jpeg_completed",
        targetType: activeCategory,
        targetLabel: "JPEG export",
        metadata: { selectedCount: filtered.length, districts: districtsToExport.length },
      });
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
    handleExportJPEG,
    handleExportCSV
  };
}
