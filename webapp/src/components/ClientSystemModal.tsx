"use client";

import { useState, useEffect } from "react";
import { get, set } from "idb-keyval";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { ClientSystemData } from "@/app/api/sheet-data/route";

interface ClientSystemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editingStation?: ClientSystemData | null;
    districts: string[];
}

// TS 5.3: typed offline mutation queue item
interface OfflineMutation {
    id: string;
    method: "POST" | "PUT";
    payload: unknown;
    timestamp: number;
    sheet: "station" | "client";
}

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
    linkProgress: 0,
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
                linkProgress: editingStation.linkProgress ?? 0,
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
        const lp = Number(formData.linkProgress);

        if (isNaN(ep) || ep < 0 || ep > 100) newErrors.electricProgress = "0–100";
        if (isNaN(gp) || gp < 0 || gp > 100) newErrors.groundProgress = "0–100";
        if (isNaN(fp) || fp < 0 || fp > 100) newErrors.feederProgress = "0–100";
        if (isNaN(tp) || tp < 0 || tp > 100) newErrors.towerProgress = "0–100";
        if (isNaN(rp) || rp < 0 || rp > 100) newErrors.radioProgress = "0–100";
        if (isNaN(lp) || lp < 0 || lp > 100) newErrors.linkProgress = "0–100";
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

            if (!navigator.onLine) {
                const queue: OfflineMutation[] = (await get("offline-mutations")) || [];
                queue.push({ id: Date.now().toString(), method, payload, timestamp: Date.now(), sheet: "client" });
                await set("offline-mutations", queue);
                alert("Saved as Draft. It will sync automatically when back online.");
                onSave();
                onClose();
                return;
            }

            const res = await fetch("/api/sheet-data?sheet=client", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json() as { error?: string };
                throw new Error(err.error || "Failed to save");
            }

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
            {/* Backdrop — fades in/out */}
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition duration-200 ease-out data-closed:opacity-0"
            />

            {/* Centering container with scroll support */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel
                    transition
                    className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 transition duration-200 ease-out data-closed:scale-95 data-closed:opacity-0"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                        <div>
                            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                                {isEditing ? "แก้ไขข้อมูลระบบลูกข่าย" : "เพิ่มระบบลูกข่ายใหม่"}
                            </DialogTitle>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                {isEditing ? `กำลังแก้ไข: ${editingStation?.stationName}` : "กรอกข้อมูลความคืบหน้าการติดตั้ง"}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="ปิด"
                            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Form — scrollable within the panel */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                        {errors.form && (
                            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                                {errors.form}
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-4">
                            {/* Province */}
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">จังหวัด</label>
                                <input
                                    name="province"
                                    value={formData.province}
                                    onChange={handleChange}
                                    list="province-list-client"
                                    placeholder="จังหวัด..."
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                                <datalist id="province-list-client">
                                    <option value="กาญจนบุรี" />
                                </datalist>
                            </div>

                            {/* District */}
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">อำเภอ</label>
                                <input
                                    list="district-list-client"
                                    name="district"
                                    value={formData.district}
                                    onChange={handleChange}
                                    placeholder="อำเภอ..."
                                    className={`w-full rounded-xl border px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.district ? "border-red-400" : "border-zinc-200 dark:border-zinc-700"}`}
                                />
                                <datalist id="district-list-client">
                                    {districts.map(d => <option key={d} value={d} />)}
                                </datalist>
                            </div>

                            {/* Station Name */}
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">ชื่อสถานี</label>
                                <input
                                    name="stationName"
                                    value={formData.stationName}
                                    onChange={handleChange}
                                    placeholder="ชื่อสถานี..."
                                    className={`w-full rounded-xl border px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.stationName ? "border-red-400" : "border-zinc-200 dark:border-zinc-700"}`}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {/* Latitude */}
                            <div>
                                <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">Latitude (lat)</label>
                                <input
                                    name="lat"
                                    type="number"
                                    step="any"
                                    value={formData.lat}
                                    onChange={handleChange}
                                    placeholder="14.xxxx"
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                            </div>
                            {/* Longitude */}
                            <div>
                                <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">Longitude (lon)</label>
                                <input
                                    name="lon"
                                    type="number"
                                    step="any"
                                    value={formData.lon}
                                    onChange={handleChange}
                                    placeholder="99.xxxx"
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                            </div>
                            {/* Pole Height */}
                            <div>
                                <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">ความสูงเสา</label>
                                <input
                                    name="poleHeight"
                                    value={formData.poleHeight}
                                    onChange={handleChange}
                                    placeholder="เช่น 18 เมตร"
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                            </div>
                        </div>

                        <hr className="border-zinc-100 dark:border-zinc-800" />

                        {/* Electrical System */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">1. ระบบไฟฟ้า</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase">ความคืบหน้า (%)</label>
                                    <input
                                        name="electricProgress"
                                        type="number"
                                        min="0" max="100"
                                        value={formData.electricProgress}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase">ระยะสาย Main (m)</label>
                                    <input
                                        name="electricMain"
                                        value={formData.electricMain}
                                        onChange={handleChange}
                                        placeholder="ใส่ค่า m"
                                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Grounding System */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">2. ระบบกราวด์</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase">ความคืบหน้า (%)</label>
                                    <input
                                        name="groundProgress"
                                        type="number"
                                        min="0" max="100"
                                        value={formData.groundProgress}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase">AC (Ω)</label>
                                    <input
                                        name="groundAC"
                                        value={formData.groundAC}
                                        onChange={handleChange}
                                        placeholder="AC Ω"
                                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase">Equip (Ω)</label>
                                    <input
                                        name="groundEquip"
                                        value={formData.groundEquip}
                                        onChange={handleChange}
                                        placeholder="Equip Ω"
                                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Feeder System */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">3. สาย Feeder</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase">ความคืบหน้า (%)</label>
                                    <input
                                        name="feederProgress"
                                        type="number"
                                        min="0" max="100"
                                        value={formData.feederProgress}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase">Yagi No.</label>
                                    <input
                                        name="yagiNo"
                                        value={formData.yagiNo}
                                        onChange={handleChange}
                                        placeholder="Yagi No."
                                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase">SN (Antenna)</label>
                                    <input
                                        name="sn"
                                        value={formData.sn}
                                        onChange={handleChange}
                                        placeholder="SN Ant..."
                                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase">ระยะ feed (m)</label>
                                    <input
                                        name="feedDistance"
                                        value={formData.feedDistance}
                                        onChange={handleChange}
                                        placeholder="ระยะ feed (m)"
                                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase">ขาติดตั้ง</label>
                                    <input
                                        name="mountType"
                                        value={formData.mountType}
                                        onChange={handleChange}
                                        list="mountType-list"
                                        placeholder="เลือกขาติดตั้ง"
                                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                    />
                                    <datalist id="mountType-list">
                                        <option value="A" /><option value="B" /><option value="C" /><option value="D" />
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase">องศา (°)</label>
                                    <input
                                        name="angle"
                                        value={formData.angle}
                                        type="number"
                                        onChange={handleChange}
                                        placeholder="เช่น 20"
                                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-zinc-100 dark:border-zinc-800" />

                        {/* Tower/Radio Progress */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">4. ติดตั้งอุปกรณ์บนเสา (%)</label>
                                <input
                                    name="towerProgress"
                                    type="number"
                                    min="0" max="100"
                                    value={formData.towerProgress}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                />
                            </div>

                            {/* Section 5: Radio Installation */}
                            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 space-y-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">5. ติดตั้งเครื่องวิทยุ</h3>
                                    <div className="flex-1">
                                        <input
                                            name="radioProgress"
                                            type="number"
                                            min="0" max="100"
                                            value={formData.radioProgress}
                                            onChange={handleChange}
                                            placeholder="%"
                                            className={`w-full rounded-xl border px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white ${errors.radioProgress ? "border-red-400" : "border-zinc-200 dark:border-zinc-700"}`}
                                        />
                                        {errors.radioProgress && <p className="text-[10px] text-red-500 mt-0.5">{errors.radioProgress}</p>}
                                    </div>
                                    <span className="text-sm text-zinc-500 font-medium">%</span>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Radio Serial Number (SN)</label>
                                    <input
                                        name="radioSN"
                                        value={formData.radioSN}
                                        onChange={handleChange}
                                        placeholder="SN เครื่องวิทยุ..."
                                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white mb-2"
                                    />
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Battery 50AH SN</label>
                                    <input
                                        name="batterySN"
                                        value={formData.batterySN}
                                        onChange={handleChange}
                                        placeholder="SN แบตเตอรี่..."
                                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">รับแม่ข่าย BS-261 BS หนองนกแก้ว รับได้ (dBm)</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            name="rssi"
                                            value={formData.rssi}
                                            onChange={handleChange}
                                            placeholder="เช่น -85"
                                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                        />
                                        <span className="text-sm text-zinc-500 font-medium whitespace-nowrap">dBm</span>
                                    </div>
                                </div>
                            </div>
                            {/* Section 6: Link Progress */}
                            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 space-y-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">6. การเชื่อมต่อ (Link)</h3>
                                    <div className="flex-1">
                                        <input
                                            name="linkProgress"
                                            type="number"
                                            min="0" max="100"
                                            value={formData.linkProgress}
                                            onChange={handleChange}
                                            placeholder="%"
                                            className={`w-full rounded-xl border px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white ${errors.linkProgress ? "border-red-400" : "border-zinc-200 dark:border-zinc-700"}`}
                                        />
                                        {errors.linkProgress && <p className="text-[10px] text-red-500 mt-0.5">{errors.linkProgress}</p>}
                                    </div>
                                    <span className="text-sm text-zinc-500 font-medium">%</span>
                                </div>
                            </div>
                        </div>

                        <hr className="border-zinc-100 dark:border-zinc-800" />

                        {/* Additional Tracking */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">ค่า Test Feeder</label>
                                <input
                                    name="testFeeder"
                                    value={formData.testFeeder}
                                    onChange={handleChange}
                                    list="testFeeder-list"
                                    placeholder="เลือกสถานะ"
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                                <datalist id="testFeeder-list">
                                    <option value="ยังไม่ได้เก็บ" /><option value="เก็บแล้ว" />
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">ยื่นขอมิเตอร์</label>
                                <input
                                    name="meterRequest"
                                    value={formData.meterRequest}
                                    onChange={handleChange}
                                    list="meterRequest-list"
                                    placeholder="เลือกสถานะ"
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                                <datalist id="meterRequest-list">
                                    <option value="ยังไม่ได้ยื่น" /><option value="รออนุมัติ" /><option value="ติดตั้งแล้ว" />
                                </datalist>
                            </div>
                        </div>

                        <hr className="border-zinc-100 dark:border-zinc-800" />

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

                        {/* Remark */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">งานเพิ่มเติม / ปัญหาอุปสรรค</label>
                            <textarea
                                name="remark"
                                value={formData.remark}
                                onChange={handleChange}
                                rows={3}
                                placeholder="ระบุข้อมูลเพิ่มเติม..."
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                                    isEditing ? "บันทึกการแก้ไข" : "เพิ่มข้อมูล"
                                )}
                            </button>
                        </div>
                    </form>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
