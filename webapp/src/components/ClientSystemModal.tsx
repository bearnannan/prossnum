"use client";

import { useState, useEffect } from "react";
import { get, set } from "idb-keyval";
import { ClientSystemData } from "@/app/api/sheet-data/route";

interface ClientSystemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editingStation?: ClientSystemData | null;
    districts: string[];
}

const defaultForm = {
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
    feederMount: "",
    feederDegree: "",
    testFeeder: "",
    meterRequest: "",
    startDate: "",
    endDate: "" ,
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
                district: editingStation.district,
                stationName: editingStation.stationName,
                electricProgress: editingStation.electricProgress,
                electricMain: editingStation.electricMain || "",
                groundProgress: editingStation.groundProgress,
                lat: editingStation.lat || 14.0,
                lon: editingStation.lon || 99.0,
                poleHeight: editingStation.poleHeight || "",
                groundAC: editingStation.groundAC || "",
                groundEquip: editingStation.groundEquip || "",
                feederProgress: editingStation.feederProgress,
                towerProgress: editingStation.towerProgress || 0,
                radioProgress: editingStation.radioProgress || 0,
                radioSN: editingStation.radioSN || "",
                batterySN: editingStation.batterySN || "",
                rssi: editingStation.rssi || "",
                yagiNo: editingStation.yagiNo || "",
                sn: editingStation.sn || "",
                feedDistance: editingStation.feedDistance || "",
                feederMount: editingStation.feederMount || "",
                feederDegree: editingStation.feederDegree || "",
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
                ? { ...formData, rowIndex: editingStation!.rowIndex }
                : formData;

            if (!navigator.onLine) {
                const queue: any[] = (await get("offline-mutations")) || [];
                queue.push({
                    id: Date.now().toString(),
                    method,
                    payload,
                    timestamp: Date.now(),
                    sheet: "client"
                });
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
                const err = await res.json();
                throw new Error(err.error || "Failed to save");
            }

            onSave();
            onClose();
        } catch (err: any) {
            setErrors({ form: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                            {isEditing ? "แก้ไขข้อมูลระบบลูกข่าย" : "เพิ่มระบบลูกข่ายใหม่"}
                        </h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            {isEditing ? `กำลังแก้ไข: ${editingStation?.stationName}` : "กรอกข้อมูลความคืบหน้าการติดตั้ง"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {errors.form && (
                        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                            {errors.form}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* District */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">อำเภอ</label>
                            <input
                                list="district-list"
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                placeholder="อำเภอ..."
                                className={`w-full rounded-xl border px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.district ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-700'}`}
                            />
                            <datalist id="district-list">
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
                                className={`w-full rounded-xl border px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.stationName ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-700'}`}
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
                                <label className="block text-[10px] font-semibold text-zinc-500 uppercase">AC (Ω)</label>
                                <input
                                    name="groundAC"
                                    value={formData.groundAC}
                                    onChange={handleChange}
                                    placeholder="AC Ω"
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-zinc-500 uppercase">Equip (Ω)</label>
                                <input
                                    name="groundEquip"
                                    value={formData.groundEquip}
                                    onChange={handleChange}
                                    placeholder="Equip Ω"
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
                                <label className="block text-[10px] font-semibold text-zinc-500 uppercase">SN.</label>
                                <input
                                    name="sn"
                                    value={formData.sn}
                                    onChange={handleChange}
                                    placeholder="SN."
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
                                <select
                                    name="feederMount"
                                    value={formData.feederMount}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                >
                                    <option value="">- เลือก -</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-zinc-500 uppercase">องศา (°)</label>
                                <input
                                    name="feederDegree"
                                    value={formData.feederDegree}
                                    onChange={handleChange}
                                    placeholder="องศา (°)"
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-zinc-100 dark:border-zinc-800" />

                    {/* Tower/Radio/Link Progress */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
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
                            <div>
                                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">ค่า Test Feeder</label>
                                <select
                                    name="testFeeder"
                                    value={formData.testFeeder}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                >
                                    <option value="">- เลือก -</option>
                                    <option value="ยังไม่ได้เก็บ">ยังไม่ได้เก็บ</option>
                                    <option value="เก็บค่า Test Feeder">เก็บค่า Test Feeder</option>
                                </select>
                            </div>
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
                                        className={`w-full rounded-xl border px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white ${errors.radioProgress ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-700'}`}
                                    />
                                    {errors.radioProgress && <p className="text-[10px] text-red-500 mt-0.5">{errors.radioProgress}</p>}
                                </div>
                                <span className="text-sm text-zinc-500 font-medium">%</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">[MT680 Plus (S) F5] SN</label>
                                    <input
                                        name="radioSN"
                                        value={formData.radioSN}
                                        onChange={handleChange}
                                        placeholder="SN เครื่องวิทยุ..."
                                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Battery 50AH SN</label>
                                    <input
                                        name="batterySN"
                                        value={formData.batterySN}
                                        onChange={handleChange}
                                        placeholder="SN แบตเตอรี่..."
                                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                                    />
                                </div>
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
                    </div>

                    <hr className="border-zinc-100 dark:border-zinc-800" />
                    
                    {/* Meter Request */}
                    <div>
                        <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">6. ยื่นขอมิเตอร์ไฟฟ้า</label>
                        <select
                            name="meterRequest"
                            value={formData.meterRequest}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-white"
                        >
                            <option value="">- เลือก -</option>
                            <option value="ยังไม่ได้ยื่น">ยังไม่ได้ยื่น</option>
                            <option value="ยื่นเอกสารแล้ว">ยื่นเอกสารแล้ว</option>
                        </select>
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
            </div>
        </div>
    );
}
