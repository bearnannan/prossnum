"use client";

import { useState, useEffect, useId } from "react";
import { addMutation } from "@/lib/offline-sync";
import { useToast } from "@/components/Toast";
import { StationData } from "@/app/api/dashboard-data/route";

interface StationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editingStation?: StationData | null;
    districts: string[];
}

const defaultForm = {
    province: "กาญจนบุรี",
    district: "",
    stationName: "",
    baseType: "แผ่",
    type: "C",
    foundationProgress: 0,
    poleInstallationProgress: 0,
    lat: 14.0,
    lon: 99.0,
    poleHeight: "",
    startDate: "",
    endDate: "",
    remark: "",
};

// ─── Shared style tokens ────────────────────────────────────────────────────
const labelClass = "block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-[0.12em]";

export default function StationModal({
    isOpen,
    onClose,
    onSave,
    editingStation,
    districts,
}: StationModalProps) {
    const titleId = useId();
    const descriptionId = useId();
    const [formData, setFormData] = useState(defaultForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { showToast } = useToast();

    const isEditing = !!editingStation;

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (editingStation) {
            setFormData({
                province: editingStation.province || "กาญจนบุรี",
                district: editingStation.district || "",
                stationName: editingStation.stationName || "",
                baseType: editingStation.baseType || "แผ่",
                type: editingStation.type || "C",
                foundationProgress: editingStation.foundationProgress ?? 0,
                poleInstallationProgress: editingStation.poleInstallationProgress ?? 0,
                lat: editingStation.lat || 14.0,
                lon: editingStation.lon || 99.0,
                poleHeight: editingStation.poleHeight || "",
                startDate: editingStation.startDate || "",
                endDate: editingStation.endDate || "",
                remark: editingStation.remark || "",
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
        const fp = Number(formData.foundationProgress);
        const pp = Number(formData.poleInstallationProgress);
        if (isNaN(fp) || fp < 0 || fp > 100) newErrors.foundationProgress = "ต้องอยู่ระหว่าง 0–100";
        if (isNaN(pp) || pp < 0 || pp > 100) newErrors.poleInstallationProgress = "ต้องอยู่ระหว่าง 0–100";
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
            const dataToSave = isEditing
                ? { ...formData, id: editingStation!.id }
                : formData;

            if (!navigator.onLine) {
                await addMutation({ method, payload: dataToSave, dataset: "station" });
                showToast("บันทึกข้อมูลแบบออฟไลน์สำเร็จ ระบบจะซิงค์เมื่อเชื่อมต่อเน็ตได้", "info");
                onSave();
                onClose();
                return;
            }

            const res = await fetch("/api/dashboard-data", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSave),
            });

            if (!res.ok) {
                const err = await res.json() as { error?: string };
                throw new Error(err.error || "Failed to save");
            }

            showToast(isEditing ? "แก้ไขข้อมูลสำเร็จ" : "เพิ่มสถานีสำเร็จ", "success");
            onSave();
            onClose();
        } catch (err: unknown) {
            setErrors({ form: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="relative z-50">
            {/* Backdrop — dark neon */}
            <button
                type="button"
                aria-label="ปิด"
                onClick={onClose}
                className="fixed inset-0 cursor-default backdrop-blur-xl"
                style={{ background: 'rgba(0, 0, 0, 0.80)' }}
            />

            <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    aria-describedby={descriptionId}
                    className="pointer-events-auto w-full max-w-md overflow-hidden transition duration-200 ease-out geo-corner"
                    style={{
                        background: 'rgba(18, 18, 26, 0.97)',
                        backdropFilter: 'blur(40px) saturate(1.5)',
                        border: '1px solid rgba(0, 240, 255, 0.18)',
                        borderRadius: '18px',
                        boxShadow: '0 0 40px rgba(0,240,255,0.08), 0 25px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(0,240,255,0.08)',
                    }}
                >
                    {/* Neon top accent line */}
                    <div
                        className="h-[1px] w-full"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.7), transparent)' }}
                    />

                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-6 py-4"
                        style={{ borderBottom: '1px solid rgba(0,240,255,0.08)' }}
                    >
                        <div>
                            <h2
                                id={titleId}
                                className="text-base font-extrabold text-white tracking-wider"
                                style={{ fontFamily: 'var(--font-display)', textShadow: '0 0 8px rgba(0,240,255,0.25)' }}
                            >
                                {isEditing ? (
                                    <><span className="text-neon-cyan">แก้ไข</span>ข้อมูลสถานี</>
                                ) : (
                                    <><span className="text-neon-cyan">เพิ่ม</span>สถานีใหม่</>
                                )}
                            </h2>
                            <p id={descriptionId} className="text-[10px] text-slate-500 mt-0.5 font-medium tracking-wide uppercase">
                                {isEditing ? `กำลังแก้ไข: ${editingStation?.stationName}` : "กรอกข้อมูลสถานีลูกข่าย"}
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

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin">

                        {/* Error banner */}
                        {errors.form && (
                            <div
                                className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
                                style={{ background: 'rgba(255,0,160,0.10)', border: '1px solid rgba(255,0,160,0.30)', color: '#ff6eb4' }}
                            >
                                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                                {errors.form}
                            </div>
                        )}

                        {/* Province & District */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>จังหวัด</label>
                                <NeonInput
                                    name="province"
                                    value={formData.province}
                                    onChange={handleChange}
                                    list="province-list"
                                    placeholder="จังหวัด..."
                                />
                                <datalist id="province-list">
                                    <option value="กาญจนบุรี" />
                                </datalist>
                            </div>
                            <div>
                                <label className={labelClass}>อำเภอ</label>
                                <NeonInput
                                    name="district"
                                    list="district-list"
                                    value={formData.district}
                                    onChange={handleChange}
                                    placeholder="เลือกหรือพิมพ์ชื่ออำเภอ..."
                                    hasError={!!errors.district}
                                />
                                <datalist id="district-list">
                                    {districts.map(d => <option key={d} value={d} />)}
                                </datalist>
                                {errors.district && <p className="mt-1 text-[10px] font-bold text-neon-magenta">{errors.district}</p>}
                            </div>
                        </div>

                        {/* Station Name */}
                        <div>
                            <label className={labelClass}>ชื่อสถานี</label>
                            <NeonInput
                                name="stationName"
                                value={formData.stationName}
                                onChange={handleChange}
                                placeholder="ชื่อสถานีลูกข่าย..."
                                hasError={!!errors.stationName}
                            />
                            {errors.stationName && <p className="mt-1 text-[10px] font-bold text-neon-magenta">{errors.stationName}</p>}
                        </div>

                        {/* Base Type & Type */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>ฐานราก (Base Type)</label>
                                <NeonSelect name="baseType" value={formData.baseType} onChange={handleChange}>
                                    <option value="แผ่">แผ่ (Spread)</option>
                                    <option value="เข็ม">เข็ม (Pile)</option>
                                </NeonSelect>
                            </div>
                            <div>
                                <label className={labelClass}>ประเภท (Type)</label>
                                <NeonSelect name="type" value={formData.type} onChange={handleChange}>
                                    <option value="A">Type A</option>
                                    <option value="B">Type B</option>
                                    <option value="C">Type C</option>
                                </NeonSelect>
                            </div>
                        </div>

                        {/* Divider with label */}
                        <SectionDivider label="ความคืบหน้า" />

                        {/* Progress */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>ฐานราก (%)</label>
                                <NeonInput
                                    name="foundationProgress"
                                    type="number"
                                    min="0" max="100"
                                    value={formData.foundationProgress}
                                    onChange={handleChange}
                                    hasError={!!errors.foundationProgress}
                                />
                                {errors.foundationProgress && <p className="mt-1 text-[10px] font-bold text-neon-magenta">{errors.foundationProgress}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>ติดตั้งเสา (%)</label>
                                <NeonInput
                                    name="poleInstallationProgress"
                                    type="number"
                                    min="0" max="100"
                                    value={formData.poleInstallationProgress}
                                    onChange={handleChange}
                                    hasError={!!errors.poleInstallationProgress}
                                />
                                {errors.poleInstallationProgress && <p className="mt-1 text-[10px] font-bold text-neon-magenta">{errors.poleInstallationProgress}</p>}
                            </div>
                        </div>

                        <SectionDivider label="พิกัด & ข้อมูลเสา" />

                        {/* Lat / Lon */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Latitude</label>
                                <NeonInput name="lat" type="number" step="any" value={formData.lat} onChange={handleChange} />
                            </div>
                            <div>
                                <label className={labelClass}>Longitude</label>
                                <NeonInput name="lon" type="number" step="any" value={formData.lon} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Pole Height & Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>ความสูงเสา</label>
                                <NeonInput name="poleHeight" value={formData.poleHeight} onChange={handleChange} placeholder="เช่น 30m" />
                            </div>
                            <div>
                                <label className={labelClass}>วันที่เริ่มงาน</label>
                                <NeonInput name="startDate" type="date" value={formData.startDate} onChange={handleChange} />
                            </div>
                            <div>
                                <label className={labelClass}>วันที่เสร็จงาน</label>
                                <NeonInput name="endDate" type="date" value={formData.endDate} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Remark */}
                        <div>
                            <label className={labelClass}>หมายเหตุ</label>
                            <NeonTextarea
                                name="remark"
                                value={formData.remark}
                                onChange={handleChange}
                                rows={2}
                                placeholder="ระบุหมายเหตุ / สิ่งที่ต้องทำต่อ..."
                            />
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
                                style={{
                                    background: '#00f0ff',
                                    boxShadow: '0 0 15px rgba(0,240,255,0.3), 0 4px 12px rgba(0,0,0,0.3)',
                                }}
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
                                    {isEditing ? "บันทึกการแก้ไข" : "เพิ่มสถานี"}</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ─── Reusable neon input primitives ─────────────────────────────────────────

function NeonInput({ hasError, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
    return (
        <input
            {...props}
            className={[
                "w-full rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200",
                "placeholder:text-slate-600 outline-none transition-all duration-200",
                "focus:ring-2 focus:ring-neon-cyan/15",
                className ?? "",
            ].join(" ")}
            style={{
                background: "rgba(10, 10, 15, 0.70)",
                border: hasError
                    ? "1px solid rgba(255, 0, 160, 0.50)"
                    : "1px solid rgba(0, 240, 255, 0.18)",
                ...(hasError ? { boxShadow: "0 0 8px rgba(255,0,160,0.12)" } : {}),
            }}
            onFocus={e => {
                e.currentTarget.style.borderColor = hasError ? "rgba(255,0,160,0.70)" : "rgba(0,240,255,0.50)";
                e.currentTarget.style.boxShadow = hasError ? "0 0 0 3px rgba(255,0,160,0.10)" : "0 0 0 3px rgba(0,240,255,0.10)";
            }}
            onBlur={e => {
                e.currentTarget.style.borderColor = hasError ? "rgba(255,0,160,0.50)" : "rgba(0,240,255,0.18)";
                e.currentTarget.style.boxShadow = hasError ? "0 0 8px rgba(255,0,160,0.12)" : "none";
            }}
        />
    );
}

function NeonSelect({ children, className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            {...props}
            className={[
                "w-full rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200",
                "outline-none transition-all duration-200 cursor-pointer",
                "focus:ring-2 focus:ring-neon-cyan/15",
                className ?? "",
            ].join(" ")}
            style={{
                background: "rgba(10, 10, 15, 0.70)",
                border: "1px solid rgba(0, 240, 255, 0.18)",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,240,255,0.50)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,240,255,0.10)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,240,255,0.18)"; e.currentTarget.style.boxShadow = "none"; }}
        >
            {children}
        </select>
    );
}

function NeonTextarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            {...props}
            className={[
                "w-full rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200",
                "placeholder:text-slate-600 outline-none transition-all duration-200 resize-none",
                "focus:ring-2 focus:ring-neon-cyan/15",
                className ?? "",
            ].join(" ")}
            style={{
                background: "rgba(10, 10, 15, 0.70)",
                border: "1px solid rgba(0, 240, 255, 0.18)",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,240,255,0.50)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,240,255,0.10)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,240,255,0.18)"; e.currentTarget.style.boxShadow = "none"; }}
        />
    );
}

function SectionDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,240,255,0.15), transparent)' }} />
            <span className="text-[9px] font-black tracking-[0.15em] uppercase text-neon-cyan/50">{label}</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(270deg, rgba(0,240,255,0.15), transparent)' }} />
        </div>
    );
}
