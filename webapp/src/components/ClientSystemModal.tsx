"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { addMutation } from "@/lib/offline-sync";
import { useToast } from "@/components/Toast";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { ClientSystemData } from "@/app/api/dashboard-data/route";

interface ClientSystemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editingStation?: ClientSystemData | null;
    districts: string[];
}

const MapView = dynamic(() => import("./MapView"), { 
    ssr: false,
    loading: () => (
        <div className="h-full w-full animate-pulse rounded-xl flex items-center justify-center text-slate-600 text-xs font-bold italic tracking-wider"
            style={{ background: 'rgba(10,10,15,0.80)', border: '1px solid rgba(0,240,255,0.10)' }}
        >
            <span className="material-symbols-outlined text-neon-cyan/30 text-3xl animate-spin" style={{ animationDuration: '3s' }}>radar</span>
        </div>
    )
});

const defaultForm = {
    province: "กาญจนบุรี",
    district: "",
    stationName: "",
    electricProgress: 0,
    electricMain: "",
    groundProgress: 0,
    lat: 14.0,
    lon: 99.0,
    poleHeight: "",
    groundAC: "",
    groundEquip: "",
    feederProgress: 0,
    towerProgress: 0,
    radioProgress: 0,
    radioSN: "",
    batterySN: "",
    rssi: "",
    yagiNo: "",
    sn: "",
    feedDistance: "",
    mountType: "",
    angle: "",
    testFeeder: "",
    meterRequest: "",
    startDate: "",
    endDate: "",
    remark: "",
    meterInstalled: false,
    peaUserNo: "",
    meterNo: "",
};

export default function ClientSystemModal({
    isOpen,
    onClose,
    onSave,
    editingStation,
    districts,
}: ClientSystemModalProps) {
    const [formData, setFormData] = useState(defaultForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { showToast } = useToast();

    const isEditing = !!editingStation;

    useEffect(() => {
        if (editingStation) {
            setFormData({
                province: editingStation.province || "กาญจนบุรี",
                district: editingStation.district || "",
                stationName: editingStation.stationName || "",
                electricProgress: editingStation.electricProgress ?? 0,
                electricMain: editingStation.electricMain || "",
                groundProgress: editingStation.groundProgress ?? 0,
                lat: editingStation.lat || 14.0,
                lon: editingStation.lon || 99.0,
                poleHeight: editingStation.poleHeight || "",
                groundAC: editingStation.groundAC || "",
                groundEquip: editingStation.groundEquip || "",
                feederProgress: editingStation.feederProgress ?? 0,
                towerProgress: editingStation.towerProgress ?? 0,
                radioProgress: editingStation.radioProgress ?? 0,
                radioSN: editingStation.radioSN || "",
                batterySN: editingStation.batterySN || "",
                rssi: editingStation.rssi || "",
                yagiNo: editingStation.yagiNo || "",
                sn: editingStation.sn || "",
                feedDistance: editingStation.feedDistance || "",
                mountType: editingStation.mountType || "",
                angle: editingStation.angle || "",
                testFeeder: editingStation.testFeeder || "",
                meterRequest: editingStation.meterRequest || "",
                startDate: editingStation.startDate || "",
                endDate: editingStation.endDate || "",
                remark: editingStation.remark || "",
                meterInstalled: editingStation.meterInstalled ?? false,
                peaUserNo: editingStation.peaUserNo || "",
                meterNo: editingStation.meterNo || "",
            });
        } else {
            setFormData(defaultForm);
        }
        setErrors({});
    }, [editingStation, isOpen]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.district.trim()) newErrors.district = "กรุณาระบุอำเภอ";
        if (!formData.stationName.trim()) newErrors.stationName = "กรุณาระบุชื่อสถานี";
        const ep = Number(formData.electricProgress);
        const gp = Number(formData.groundProgress);
        const fp = Number(formData.feederProgress);
        const tp = Number(formData.towerProgress);
        const rp = Number(formData.radioProgress);

        if (isNaN(ep) || ep < 0 || ep > 100) newErrors.electricProgress = "0–100";
        if (isNaN(gp) || gp < 0 || gp > 100) newErrors.groundProgress = "0–100";
        if (isNaN(fp) || fp < 0 || fp > 100) newErrors.feederProgress = "0–100";
        if (isNaN(tp) || tp < 0 || tp > 100) newErrors.towerProgress = "0–100";
        if (isNaN(rp) || rp < 0 || rp > 100) newErrors.radioProgress = "0–100";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            const method = isEditing ? "PUT" : "POST";
            const payload = isEditing
                ? { ...formData, id: editingStation!.id }
                : formData;

            // Offline Check: Use centralized sync engine
            if (!navigator.onLine) {
                await addMutation({ 
                    method, 
                    payload, 
                    dataset: "client" 
                });
                
                showToast("บันทึกข้อมูลแบบออฟไลน์สำเร็จ ระบบจะซิงค์เมื่อเชื่อมต่อเน็ตได้", "info");
                onSave();
                onClose();
                return;
            }

            const res = await fetch("/api/dashboard-data?dataset=client", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json() as { error?: string };
                throw new Error(err.error || "Failed to save");
            }

            showToast(isEditing ? "แก้ไขข้อมูลสำเร็จ" : "เพิ่มระบบลูกข่ายสำเร็จ", "success");
            onSave();
            onClose();
        } catch (err: unknown) {
            setErrors({ form: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" });
        } finally {
            setIsSubmitting(false);
        }
    };


    // ── Headless UI v2.1: Dialog with built-in transition support ──────────
    return (
        <Dialog open={isOpen} onClose={onClose} transition className="relative z-50">
            {/* Backdrop — dark neon */}
            <DialogBackdrop
                transition
                className="fixed inset-0 backdrop-blur-xl transition duration-200 ease-out data-closed:opacity-0"
                style={{ background: 'rgba(0, 0, 0, 0.80)' }}
            />

            {/* Centering container with scroll support */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel
                    transition
                    className="w-full max-w-lg overflow-hidden transition duration-200 ease-out data-closed:scale-95 data-closed:opacity-0 geo-corner"
                    style={{
                        background: 'rgba(18, 18, 26, 0.97)',
                        backdropFilter: 'blur(40px) saturate(1.5)',
                        border: '1px solid rgba(0, 240, 255, 0.18)',
                        borderRadius: '18px',
                        boxShadow: '0 0 40px rgba(0,240,255,0.08), 0 25px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(0,240,255,0.08)',
                    }}
                >
                    {/* Neon top accent */}
                    <div className="h-[1px] w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.7), transparent)' }} />
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(0,240,255,0.08)' }}>
                        <div>
                            <DialogTitle
                                className="text-base font-extrabold text-white tracking-wider"
                                style={{ fontFamily: 'var(--font-display)', textShadow: '0 0 8px rgba(0,240,255,0.25)' }}
                            >
                                {isEditing ? (
                                    <><span className="text-neon-cyan">แก้ไข</span>ข้อมูลระบบลูกข่าย</>
                                ) : (
                                    <><span className="text-neon-cyan">เพิ่ม</span>ระบบลูกข่ายใหม่</>
                                )}
                            </DialogTitle>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-medium tracking-wide uppercase">
                                {isEditing ? `กำลังแก้ไข: ${editingStation?.stationName}` : "กรอกข้อมูลความคืบหน้าการติดตั้ง"}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="ปิด"
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-neon-cyan hover:bg-neon-cyan/10 border border-transparent hover:border-neon-cyan/20 transition-all duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Form — scrollable within the panel */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
                        {errors.form && (
                            <div
                                className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
                                style={{ background: 'rgba(255,0,160,0.10)', border: '1px solid rgba(255,0,160,0.30)', color: '#ff6eb4' }}
                            >
                                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                                {errors.form}
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className={neonLabel}>จังหวัด</label>
                                <NeonInput name="province" value={formData.province} onChange={handleChange} list="province-list-client" placeholder="จังหวัด..." />
                                <datalist id="province-list-client"><option value="กาญจนบุรี" /></datalist>
                            </div>
                            <div>
                                <label className={neonLabel}>อำเภอ</label>
                                <NeonInput list="district-list-client" name="district" value={formData.district} onChange={handleChange} placeholder="อำเภอ..." hasError={!!errors.district} />
                                <datalist id="district-list-client">{districts.map(d => <option key={d} value={d} />)}</datalist>
                                {errors.district && <p className="mt-1 text-[10px] font-bold text-neon-magenta">{errors.district}</p>}
                            </div>
                            <div>
                                <label className={neonLabel}>ชื่อสถานี</label>
                                <NeonInput name="stationName" value={formData.stationName} onChange={handleChange} placeholder="ชื่อสถานี..." hasError={!!errors.stationName} />
                                {errors.stationName && <p className="mt-1 text-[10px] font-bold text-neon-magenta">{errors.stationName}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className={neonLabel}>Latitude (lat)</label>
                                <NeonInput name="lat" type="number" step="any" value={formData.lat} onChange={handleChange} placeholder="14.xxxx" />
                            </div>
                            <div>
                                <label className={neonLabel}>Longitude (lon)</label>
                                <NeonInput name="lon" type="number" step="any" value={formData.lon} onChange={handleChange} placeholder="99.xxxx" />
                            </div>
                            <div>
                                <label className={neonLabel}>ความสูงเสา</label>
                                <NeonInput name="poleHeight" value={formData.poleHeight} onChange={handleChange} placeholder="เช่น 18 เมตร" />
                            </div>
                        </div>

                        {/* Map Preview */}
                        <div
                            className="h-[200px] w-full rounded-xl overflow-hidden group relative"
                            style={{ border: '1px solid rgba(0,240,255,0.15)', boxShadow: '0 0 15px rgba(0,240,255,0.05) inset' }}
                        >
                            <div
                                className="absolute top-2 left-2 z-[1000] backdrop-blur px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
                                style={{ background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(0,240,255,0.20)', color: '#00f0ff', textShadow: '0 0 6px rgba(0,240,255,0.4)' }}
                            >
                                MAP PREVIEW
                            </div>
                            <MapView 
                                data={[formData]} 
                                category="client" 
                                isPicker={true} 
                                onPositionChange={(lat, lon) => {
                                    setFormData(prev => ({ 
                                        ...prev, 
                                        lat: parseFloat(lat.toFixed(6)), 
                                        lon: parseFloat(lon.toFixed(6)) 
                                    }));
                                }} 
                            />
                            <div
                                className="absolute bottom-2 right-2 z-[1000] opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded text-[9px] font-bold pointer-events-none tracking-wide"
                                style={{ background: 'rgba(0,240,255,0.15)', border: '1px solid rgba(0,240,255,0.30)', color: '#00f0ff' }}
                            >
                                คลิกหรือลากหมุดเพื่อเปลี่ยนพิกัด
                            </div>
                        </div>

                        <NeonDivider />

                        {/* Electrical System */}
                        <NeonSection label="1. ระบบไฟฟ้า" color="cyan">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={neonLabel}>ความคืบหน้า (%)</label>
                                    <NeonInput name="electricProgress" type="number" min="0" max="100" value={formData.electricProgress} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className={neonLabel}>ระยะสาย Main (m)</label>
                                    <NeonInput name="electricMain" value={formData.electricMain} onChange={handleChange} placeholder="ใส่ค่า m" />
                                </div>
                            </div>
                        </NeonSection>

                        {/* Grounding System */}
                        <NeonSection label="2. ระบบกราวด์" color="green">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className={neonLabel}>ความคืบหน้า (%)</label>
                                    <NeonInput name="groundProgress" type="number" min="0" max="100" value={formData.groundProgress} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className={neonLabel}>AC (Ω)</label>
                                    <NeonInput name="groundAC" value={formData.groundAC} onChange={handleChange} placeholder="AC Ω" />
                                </div>
                                <div>
                                    <label className={neonLabel}>Equip (Ω)</label>
                                    <NeonInput name="groundEquip" value={formData.groundEquip} onChange={handleChange} placeholder="Equip Ω" />
                                </div>
                            </div>
                        </NeonSection>

                        {/* Feeder System */}
                        <NeonSection label="3. สาย Feeder" color="amber">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={neonLabel}>ความคืบหน้า (%)</label>
                                    <NeonInput name="feederProgress" type="number" min="0" max="100" value={formData.feederProgress} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className={neonLabel}>Yagi No.</label>
                                    <NeonInput name="yagiNo" value={formData.yagiNo} onChange={handleChange} placeholder="Yagi No." />
                                </div>
                                <div>
                                    <label className={neonLabel}>SN (Antenna)</label>
                                    <NeonInput name="sn" value={formData.sn} onChange={handleChange} placeholder="SN Ant..." />
                                </div>
                                <div>
                                    <label className={neonLabel}>ระยะ feed (m)</label>
                                    <NeonInput name="feedDistance" value={formData.feedDistance} onChange={handleChange} placeholder="ระยะ feed (m)" />
                                </div>
                                <div>
                                    <label className={neonLabel}>ขาติดตั้ง</label>
                                    <NeonInput name="mountType" value={formData.mountType} onChange={handleChange} list="mountType-list" placeholder="เลือกขาติดตั้ง" />
                                    <datalist id="mountType-list"><option value="A" /><option value="B" /><option value="C" /><option value="D" /></datalist>
                                </div>
                                <div>
                                    <label className={neonLabel}>องศา (°)</label>
                                    <NeonInput name="angle" value={formData.angle} type="number" onChange={handleChange} placeholder="เช่น 20" />
                                </div>
                            </div>
                        </NeonSection>

                        <NeonDivider />

                        {/* Tower/Radio Progress */}
                        <div className="space-y-4">
                            <NeonSection label="4. ติดตั้งอุปกรณ์บนเสา" color="purple">
                                <div className="flex items-center gap-4 py-1">
                                    <NeonCheckbox
                                        checked={Number(formData.towerProgress) === 100}
                                        onChange={(e) => setFormData(prev => ({ ...prev, towerProgress: e.target.checked ? 100 : 0 }))}
                                        label="ติดตั้งแล้ว (Yagi)"
                                    />
                                </div>
                            </NeonSection>

                            {/* Section 5: Radio Installation */}
                            <NeonSection label="5. ติดตั้งเครื่องวิทยุ" color="magenta">
                                <div className="flex items-center gap-3 py-1">
                                    <NeonCheckbox
                                        checked={Number(formData.radioProgress) === 100}
                                        onChange={(e) => setFormData(prev => ({ ...prev, radioProgress: e.target.checked ? 100 : 0 }))}
                                        label="ติดตั้งแล้ว"
                                    />
                                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: Number(formData.radioProgress) === 100 ? '#00ff88' : '#475569' }}>
                                        {Number(formData.radioProgress) !== 100 ? "ยังไม่ได้ติดตั้ง" : "✓ เรียบร้อย"}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <label className={neonLabel}>Radio Serial Number (SN)</label>
                                        <NeonInput name="radioSN" value={formData.radioSN} onChange={handleChange} placeholder="SN เครื่องวิทยุ..." />
                                    </div>
                                    <div>
                                        <label className={neonLabel}>Battery 50AH SN</label>
                                        <NeonInput name="batterySN" value={formData.batterySN} onChange={handleChange} placeholder="SN แบตเตอรี่..." />
                                    </div>
                                    <div>
                                        <label className={neonLabel}>รับแม่ข่ายได้ (dBm)</label>
                                        <div className="flex items-center gap-2">
                                            <NeonInput name="rssi" value={formData.rssi} onChange={handleChange} placeholder="เช่น -85" />
                                            <span className="text-xs text-slate-500 font-bold whitespace-nowrap font-mono">dBm</span>
                                        </div>
                                    </div>
                                </div>
                            </NeonSection>
                        </div>

                        <NeonDivider />

                        {/* Additional Tracking */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={neonLabel}>ค่า Test Feeder</label>
                                <NeonInput name="testFeeder" value={formData.testFeeder} onChange={handleChange} list="testFeeder-list" placeholder="เลือกสถานะ" />
                                <datalist id="testFeeder-list"><option value="ยังไม่ได้เก็บ" /><option value="เก็บแล้ว" /></datalist>
                            </div>
                            <div>
                                <label className={neonLabel}>ยื่นขอมิเตอร์</label>
                                <NeonInput name="meterRequest" value={formData.meterRequest} onChange={handleChange} list="meterRequest-list" placeholder="เลือกสถานะ" />
                                <datalist id="meterRequest-list"><option value="ยังไม่ได้ยื่น" /><option value="รออนุมัติ" /><option value="ติดตั้งแล้ว" /></datalist>
                            </div>
                        </div>

                        <NeonDivider />
                        
                        {/* Meter Information */}
                        <NeonSection label="มิเตอร์ไฟฟ้า" color="yellow">
                            <div className="flex items-center gap-3 py-1">
                                <NeonCheckbox
                                    checked={formData.meterInstalled}
                                    onChange={(e) => setFormData(prev => ({ ...prev, meterInstalled: e.target.checked }))}
                                    label="ติดตั้งแล้ว"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: formData.meterInstalled ? '#00ff88' : '#475569' }}>
                                    {!formData.meterInstalled ? "ยังไม่ได้ติดตั้ง" : "✓ เรียบร้อย"}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={neonLabel}>หมายเลขผู้ใช้ไฟฟ้า</label>
                                    <NeonInput name="peaUserNo" value={formData.peaUserNo} onChange={handleChange} placeholder="ระบุหมายเลข..." />
                                </div>
                                <div>
                                    <label className={neonLabel}>หมายเลขมิเตอร์ไฟฟ้า</label>
                                    <NeonInput name="meterNo" value={formData.meterNo} onChange={handleChange} placeholder="ระบุหมายเลข..." />
                                </div>
                            </div>
                        </NeonSection>

                        <NeonDivider />

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">วันที่เริ่มงาน</label>
                                <input
                                    name="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">วันที่เสร็จงาน</label>
                                <input
                                    name="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={neonLabel}>งานเพิ่มเติม / ปัญหาอุปสรรค</label>
                            <NeonTextarea name="remark" value={formData.remark} onChange={handleChange} rows={3} placeholder="ระบุข้อมูลเพิ่มเติม..." />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-all duration-200 border border-dark-border hover:border-slate-600"
                                style={{ background: 'rgba(255,255,255,0.04)' }}
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 rounded-xl py-2.5 text-sm font-black text-dark-base hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 tracking-wider"
                                style={{ background: '#00f0ff', boxShadow: '0 0 15px rgba(0,240,255,0.3), 0 4px 12px rgba(0,0,0,0.3)' }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <><span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{isEditing ? 'save' : 'add_circle'}</span>
                                    {isEditing ? "บันทึกการแก้ไข" : "เพิ่มข้อมูล"}</>
                                )}
                            </button>
                        </div>
                    </form>
                </DialogPanel>
            </div>
        </Dialog>
    );
}

// ─── Shared style constant ───────────────────────────────────────────────────
const neonLabel = "block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-[0.12em]";

// ─── Reusable neon primitives ────────────────────────────────────────────────

function NeonInput({ hasError, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
    return (
        <input
            {...props}
            className={[
                "w-full rounded-xl px-3 py-2 text-sm font-medium text-slate-200",
                "placeholder:text-slate-600 outline-none transition-all duration-200",
                "focus:ring-2 focus:ring-neon-cyan/15",
                className ?? "",
            ].join(" ")}
            style={{
                background: "rgba(10, 10, 15, 0.70)",
                border: hasError ? "1px solid rgba(255,0,160,0.50)" : "1px solid rgba(0,240,255,0.18)",
                ...(hasError ? { boxShadow: "0 0 8px rgba(255,0,160,0.12)" } : {}),
            }}
            onFocus={e => { e.currentTarget.style.borderColor = hasError ? "rgba(255,0,160,0.70)" : "rgba(0,240,255,0.50)"; e.currentTarget.style.boxShadow = hasError ? "0 0 0 3px rgba(255,0,160,0.10)" : "0 0 0 3px rgba(0,240,255,0.10)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = hasError ? "rgba(255,0,160,0.50)" : "rgba(0,240,255,0.18)"; e.currentTarget.style.boxShadow = hasError ? "0 0 8px rgba(255,0,160,0.12)" : "none"; }}
        />
    );
}

function NeonTextarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            {...props}
            className={[
                "w-full rounded-xl px-3 py-2 text-sm font-medium text-slate-200",
                "placeholder:text-slate-600 outline-none transition-all duration-200 resize-none",
                "focus:ring-2 focus:ring-neon-cyan/15",
                className ?? "",
            ].join(" ")}
            style={{ background: "rgba(10,10,15,0.70)", border: "1px solid rgba(0,240,255,0.18)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,240,255,0.50)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,240,255,0.10)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,240,255,0.18)"; e.currentTarget.style.boxShadow = "none"; }}
        />
    );
}

type NeonColor = 'cyan' | 'green' | 'magenta' | 'yellow' | 'purple' | 'amber';
const NEON_COLOR_MAP: Record<NeonColor, string> = {
    cyan:    'rgba(0,240,255,0.18)',
    green:   'rgba(0,255,136,0.18)',
    magenta: 'rgba(255,0,160,0.18)',
    yellow:  'rgba(240,232,0,0.15)',
    purple:  'rgba(184,41,221,0.18)',
    amber:   'rgba(255,123,0,0.18)',
};
const NEON_TEXT_MAP: Record<NeonColor, string> = {
    cyan:    '#00f0ff',
    green:   '#00ff88',
    magenta: '#ff00a0',
    yellow:  '#f0e800',
    purple:  '#b829dd',
    amber:   '#ff7b00',
};

function NeonSection({ label, color = 'cyan', children }: { label: string; color?: NeonColor; children: React.ReactNode }) {
    const borderColor = NEON_COLOR_MAP[color];
    const textColor = NEON_TEXT_MAP[color];
    return (
        <div className="space-y-3 rounded-xl p-3" style={{ background: 'rgba(10,10,15,0.40)', border: `1px solid ${borderColor}` }}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: textColor, textShadow: `0 0 6px ${textColor}60` }}>
                {label}
            </h3>
            {children}
        </div>
    );
}

function NeonCheckbox({ checked, onChange, label }: { checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; label: string }) {
    return (
        <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#00f0ff' }}
            />
            <span className="text-sm font-medium transition-colors duration-200" style={{ color: checked ? '#00f0ff' : '#64748b' }}>
                {label}
            </span>
        </label>
    );
}

function NeonDivider() {
    return (
        <div className="flex items-center gap-3 py-0.5">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,240,255,0.15), transparent)' }} />
            <div className="w-1 h-1 rounded-full" style={{ background: 'rgba(0,240,255,0.30)' }} />
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(270deg, rgba(0,240,255,0.15), transparent)' }} />
        </div>
    );
}
