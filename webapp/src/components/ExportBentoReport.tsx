"use client";

import React from "react";
import ExportChartStatic from "./ExportChartStatic";
import ExportMapStatic from "./ExportMapStatic";

interface ExportBentoReportProps {
  district: string;
  stations: any[];
  allStations?: any[];
  category?: "station" | "client";
}

const NEON = {
  cyan: "#00F0FF",
  green: "#00FF88",
  yellow: "#F0E800",
  magenta: "#FF00A0",
  purple: "#B829DD",
  orange: "#FF7B00",
  base: "#0A0A0F",
  elevated: "#12121A",
  surface: "#1A1A25",
  muted: "#94A3B8",
  text: "#E2E8F0",
};

const pageStyle: React.CSSProperties = {
  width: "1122px",
  height: "794px",
  padding: "32px",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  overflow: "hidden",
  color: NEON.text,
  fontFamily: "'Sarabun', 'Inter', 'Noto Sans Thai', sans-serif",
  backgroundColor: NEON.base,
  backgroundImage:
    "radial-gradient(circle at 18% 18%, rgba(0,240,255,0.14), transparent 34%), radial-gradient(circle at 82% 20%, rgba(255,0,160,0.10), transparent 30%), linear-gradient(rgba(0,240,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.045) 1px, transparent 1px)",
  backgroundSize: "100% 100%, 100% 100%, 40px 40px, 40px 40px",
};

const panelStyle: React.CSSProperties = {
  background: "rgba(26, 26, 37, 0.86)",
  border: "1px solid rgba(0, 240, 255, 0.18)",
  borderRadius: "18px",
  boxShadow:
    "0 14px 32px rgba(0,0,0,0.45), 0 0 24px rgba(0,240,255,0.07), inset 0 1px 0 rgba(255,255,255,0.06)",
};

function avg(stations: any[], key: string): number {
  if (stations.length === 0) return 0;
  const sum = stations.reduce((acc, station) => acc + (parseFloat(station[key] as any) || 0), 0);
  return Math.round(sum / stations.length);
}

function neonStat(label: string, value: number, sub: string, color: string): React.CSSProperties {
  return {
    minWidth: "100px",
    padding: "12px 14px",
    textAlign: "center",
    borderRadius: "14px",
    color,
    background: `${color}12`,
    border: `1px solid ${color}40`,
    boxShadow: `0 0 18px ${color}18, inset 0 1px 0 rgba(255,255,255,0.05)`,
  };
}

function SectionTitle({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "999px",
          background: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
      <span style={{ color: NEON.text, fontSize: "14px", fontWeight: 800 }}>
        {children}
      </span>
    </div>
  );
}

export default function ExportBentoReport({
  district,
  stations,
  allStations = [],
  category = "station",
}: ExportBentoReportProps) {
  const isClient = category === "client";
  const provinceName = stations[0]?.province || "กาญจนบุรี";
  const displayDistrict = district.startsWith("อำเภอ") ? district : `อำเภอ${district}`;
  const stationCount = stations.length;
  const summarySource = (allStations.length > 0 ? allStations : stations).filter(
    (station) => station.province === provinceName
  );
  const totalInProvince = summarySource.length || stationCount;

  let avgOverall = 0;
  let stat1 = { label: "", value: 0, sub: "", color: NEON.cyan };
  let stat2 = { label: "", value: 0, sub: "", color: NEON.green };
  let stat3 = { label: "", value: 0, sub: "", color: NEON.yellow };

  if (isClient) {
    const completedCount = summarySource.filter((item) => {
      const progress =
        (parseFloat(item.electricProgress || 0) +
          parseFloat(item.groundProgress || 0) +
          parseFloat(item.feederProgress || 0)) /
        3;
      return progress >= 100;
    }).length;
    const radioInstalledCount = summarySource.filter((item) => Number(item.radioProgress) === 100).length;
    const meterInstalledCount = summarySource.filter((item) => item.meterInstalled).length;
    const avgElectric = avg(summarySource, "electricProgress");
    const avgGround = avg(summarySource, "groundProgress");
    const avgFeeder = avg(summarySource, "feederProgress");
    const avgTower = avg(summarySource, "towerProgress");
    const avgRadio = avg(summarySource, "radioProgress");

    avgOverall = Math.round((avgElectric + avgGround + avgFeeder + avgTower + avgRadio) / 5);
    stat1 = { label: "ติดตั้งระบบ ลข.", value: completedCount, sub: `จาก ${totalInProvince}`, color: NEON.cyan };
    stat2 = { label: "วางเครื่องวิทยุ", value: radioInstalledCount, sub: `จาก ${totalInProvince}`, color: NEON.green };
    stat3 = { label: "งานมิเตอร์ไฟฟ้า", value: meterInstalledCount, sub: `จาก ${totalInProvince}`, color: NEON.yellow };
  } else {
    const avgFoundation = avg(summarySource, "foundationProgress");
    const avgPole = avg(summarySource, "poleInstallationProgress");
    const completedCount = summarySource.filter((item) => {
      const progress =
        (parseFloat(item.foundationProgress || 0) + parseFloat(item.poleInstallationProgress || 0)) / 2;
      return progress >= 100;
    }).length;

    avgOverall = Math.round((avgFoundation + avgPole) / 2);
    stat1 = { label: "ติดตั้งแล้วเสร็จ", value: completedCount, sub: `จาก ${totalInProvince}`, color: NEON.cyan };
    stat2 = { label: "ฐานรากเฉลี่ย", value: avgFoundation, sub: "%", color: NEON.green };
    stat3 = { label: "ติดตั้งเสาเฉลี่ย", value: avgPole, sub: "%", color: NEON.yellow };
  }

  const overallColor = avgOverall >= 75 ? NEON.green : avgOverall >= 40 ? NEON.yellow : NEON.magenta;

  return (
    <div style={pageStyle}>
      <div
        style={{
          ...panelStyle,
          flexShrink: 0,
          padding: "24px 30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, rgba(18,18,26,0.98), rgba(26,26,37,0.92))",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: NEON.cyan,
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "2.6px",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
              textShadow: "0 0 10px rgba(0,240,255,0.45)",
            }}
          >
            <span style={{ width: "18px", height: "3px", borderRadius: "3px", background: NEON.cyan, boxShadow: `0 0 10px ${NEON.cyan}` }} />
            รายงาน{isClient ? "ติดตั้งระบบลูกข่าย" : "ก่อสร้างฐานรากและเสา"}
          </div>
          <div
            style={{
              color: "#FFFFFF",
              fontSize: "42px",
              fontWeight: 900,
              lineHeight: 1.05,
              textShadow: "0 0 18px rgba(255,255,255,0.18)",
            }}
          >
            {displayDistrict}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
            <span style={{ color: NEON.text, fontSize: "21px", fontWeight: 800 }}>จ.{provinceName}</span>
            <span style={{ width: "5px", height: "5px", borderRadius: "999px", background: "rgba(0,240,255,0.55)" }} />
            <span style={{ color: NEON.muted, fontSize: "15px", fontWeight: 700 }}>{stationCount} สถานีลูกข่าย</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {[stat1, stat2, stat3].map((stat) => (
            <div key={stat.label} style={neonStat(stat.label, stat.value, stat.sub, stat.color)}>
              <div style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.6px", marginBottom: "5px" }}>{stat.label}</div>
              <div style={{ color: "#FFFFFF", fontSize: "29px", fontWeight: 900, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ color: NEON.muted, fontSize: "10px", marginTop: "5px", fontWeight: 700 }}>{stat.sub}</div>
            </div>
          ))}
          <div style={{ ...neonStat("ความคืบหน้า", avgOverall, "ภาพรวม", overallColor), minWidth: "112px", marginLeft: "6px" }}>
            <div style={{ fontSize: "10px", fontWeight: 900, letterSpacing: "0.8px", marginBottom: "5px" }}>ความคืบหน้า</div>
            <div style={{ color: overallColor, fontSize: "37px", fontWeight: 900, lineHeight: 1, textShadow: `0 0 14px ${overallColor}70` }}>
              {avgOverall}<span style={{ fontSize: "14px", color: NEON.muted, marginLeft: "2px" }}>%</span>
            </div>
            <div style={{ color: NEON.muted, fontSize: "9px", marginTop: "5px", fontWeight: 800 }}>ภาพรวม</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", flex: 1, minHeight: 0 }}>
        <div style={{ flex: "0 0 62%", display: "flex", flexDirection: "column", gap: "16px", minHeight: 0 }}>
          <div style={{ ...panelStyle, flex: 1, padding: "22px", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <SectionTitle color={NEON.cyan}>ความคืบหน้าแยกตามสถานี</SectionTitle>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ExportChartStatic data={stations} category={category} width={616} height={320} />
            </div>
          </div>

          <div style={{ ...panelStyle, flex: "0 0 32%", padding: "18px", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <SectionTitle color={NEON.green}>แผนที่พิกัดสถานี</SectionTitle>
            <div style={{ flex: 1, overflow: "hidden", borderRadius: "14px", border: "1px solid rgba(0,255,136,0.20)", background: "rgba(10,10,15,0.72)" }}>
              <ExportMapStatic stations={stations} category={category} />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          <div style={{ ...panelStyle, height: "100%", padding: "22px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <SectionTitle color={NEON.purple}>รายชื่อสถานี</SectionTitle>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                <thead>
                  <tr style={{ background: "rgba(0,240,255,0.08)" }}>
                    <th style={{ textAlign: "left", padding: "7px 5px", color: NEON.cyan, fontWeight: 800, borderBottom: "1px solid rgba(0,240,255,0.18)" }}>สถานี</th>
                    {!isClient ? (
                      <>
                        <th style={{ textAlign: "center", padding: "7px 4px", color: NEON.purple, fontWeight: 800, borderBottom: "1px solid rgba(0,240,255,0.18)" }}>Type</th>
                        <th style={{ textAlign: "right", padding: "7px 4px", color: NEON.cyan, fontWeight: 800, borderBottom: "1px solid rgba(0,240,255,0.18)" }}>ฐานราก</th>
                        <th style={{ textAlign: "right", padding: "7px 4px", color: NEON.green, fontWeight: 800, borderBottom: "1px solid rgba(0,240,255,0.18)" }}>เสา</th>
                        <th style={{ textAlign: "right", padding: "7px 4px", color: NEON.yellow, fontWeight: 800, borderBottom: "1px solid rgba(0,240,255,0.18)" }}>วันที่เสร็จ</th>
                      </>
                    ) : (
                      <>
                        {["ไฟฟ้า", "กราวด์", "Feeder", "Yagi", "วิทยุ", "มิเตอร์", "RSSI"].map((head, index) => (
                          <th key={head} style={{ textAlign: "right", padding: "7px 2px", color: [NEON.cyan, NEON.green, NEON.yellow, NEON.purple, NEON.magenta, NEON.muted, NEON.orange][index], fontWeight: 800, borderBottom: "1px solid rgba(0,240,255,0.18)" }}>
                            {head}
                          </th>
                        ))}
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {stations.map((station, index) => (
                    <tr key={`${station.stationName}-${index}`} style={{ background: index % 2 === 0 ? "rgba(255,255,255,0.025)" : "rgba(0,240,255,0.035)" }}>
                      <td style={{ padding: "5px", color: NEON.text, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {station.stationName}
                      </td>
                      {!isClient ? (
                        <>
                          <td style={{ padding: "5px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <span style={{ color: NEON.purple, background: `${NEON.purple}18`, border: `1px solid ${NEON.purple}45`, padding: "1px 5px", borderRadius: "5px", fontSize: "9px", fontWeight: 800 }}>
                              {station.type}
                            </span>
                          </td>
                          <td style={{ padding: "5px", textAlign: "right", color: NEON.cyan, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{station.foundationProgress}%</td>
                          <td style={{ padding: "5px", textAlign: "right", color: NEON.green, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{station.poleInstallationProgress}%</td>
                          <td style={{ padding: "5px", textAlign: "right", color: NEON.muted, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{station.endDate || "-"}</td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: "5px 2px", textAlign: "right", color: NEON.cyan, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{station.electricProgress || 0}%</td>
                          <td style={{ padding: "5px 2px", textAlign: "right", color: NEON.green, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{station.groundProgress || 0}%</td>
                          <td style={{ padding: "5px 2px", textAlign: "right", color: NEON.yellow, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{station.feederProgress || 0}%</td>
                          <td style={{ padding: "5px 2px", textAlign: "right", color: NEON.purple, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{station.towerProgress || 0}%</td>
                          <td style={{ padding: "5px 2px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{station.radioProgress === 100 ? "OK" : "-"}</td>
                          <td style={{ padding: "5px 2px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{station.meterInstalled ? "OK" : "-"}</td>
                          <td style={{ padding: "5px 2px", textAlign: "center", color: NEON.orange, fontWeight: 900, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{station.rssi || "-"}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: "10px", borderTop: "1px solid rgba(0,240,255,0.14)", paddingTop: "8px", display: "flex", justifyContent: "space-between", color: "#64748B", fontSize: "9px", fontWeight: 700 }}>
              <span>Progress Dashboard - Retro Neon Report</span>
              <span>พิมพ์: {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
