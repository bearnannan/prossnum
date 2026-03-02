"use client";

import { useState, useEffect } from "react";
import { StationData } from "@/app/api/sheet-data/route";

interface StationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editingStation?: StationData | null;
    districts: string[];
}

const defaultForm = {
    district: "",
    stationName: "",
    type: "C",
    foundationProgress: 0,
    poleInstallationProgress: 0,
    lat: 14.0,
    lon: 99.0,
};

export default function StationModal({
    isOpen,
    onClose,
    onSave,
    editingStation,
    districts,
}: StationModalProps) {
    const [formData, setFormData] = useState(defaultForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const isEditing = !!editingStation;

    useEffect(() => {
        if (editingStation) {
            setFormData({
                district: editingStation.district,
                stationName: editingStation.stationName,
                type: editingStation.type || "C",
                foundationProgress: editingStation.foundationProgress,
                poleInstallationProgress: editingStation.poleInstallationProgress,
                lat: editingStation.lat || 14.0,
                lon: editingStation.lon || 99.0,
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

            const res = await fetch("/api/sheet-data", {
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
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                            {isEditing ? "แก้ไขข้อมูลสถานี" : "เพิ่มสถานีใหม่"}
                        </h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            {isEditing ? `กำลังแก้ไข: ${editingStation?.stationName}` : "กรอกข้อมูลสถานีลูกข่าย"}
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
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {errors.form && (
                        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                            {errors.form}
                        </div>
                    )}

                    {/* District */}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">อำเภอ</label>
                        <input
                            list="district-list"
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            placeholder="เลือกหรือพิมพ์ชื่ออำเภอ..."
                            className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-white dark:bg-zinc-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.district ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-700'}`}
                        />
                        <datalist id="district-list">
                            {districts.map(d => <option key={d} value={d} />)}
                        </datalist>
                        {errors.district && <p className="mt-1 text-xs text-red-500">{errors.district}</p>}
                    </div>

                    {/* Station Name */}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">ชื่อสถานี</label>
                        <input
                            name="stationName"
                            value={formData.stationName}
                            onChange={handleChange}
                            placeholder="ชื่อสถานีลูกข่าย..."
                            className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-white dark:bg-zinc-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.stationName ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-700'}`}
                        />
                        {errors.stationName && <p className="mt-1 text-xs text-red-500">{errors.stationName}</p>}
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">ประเภท (Type)</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm bg-white dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        >
                            <option value="A">Type A</option>
                            <option value="B">Type B</option>
                            <option value="C">Type C</option>
                        </select>
                    </div>

                    {/* Progress */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">ฐานราก (%)</label>
                            <input
                                name="foundationProgress"
                                type="number"
                                min="0" max="100"
                                value={formData.foundationProgress}
                                onChange={handleChange}
                                className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-white dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.foundationProgress ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-700'}`}
                            />
                            {errors.foundationProgress && <p className="mt-1 text-xs text-red-500">{errors.foundationProgress}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">ติดตั้งเสา (%)</label>
                            <input
                                name="poleInstallationProgress"
                                type="number"
                                min="0" max="100"
                                value={formData.poleInstallationProgress}
                                onChange={handleChange}
                                className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-white dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.poleInstallationProgress ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-700'}`}
                            />
                            {errors.poleInstallationProgress && <p className="mt-1 text-xs text-red-500">{errors.poleInstallationProgress}</p>}
                        </div>
                    </div>

                    {/* Lat/Lon */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Latitude</label>
                            <input
                                name="lat"
                                type="number"
                                step="any"
                                value={formData.lat}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm bg-white dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Longitude</label>
                            <input
                                name="lon"
                                type="number"
                                step="any"
                                value={formData.lon}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm bg-white dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            />
                        </div>
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
                                isEditing ? "บันทึกการแก้ไข" : "เพิ่มสถานี"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
