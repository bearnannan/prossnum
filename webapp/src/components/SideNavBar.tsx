"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Magnetic } from "./motion/Magnetic";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/rbac";

interface SideNavBarProps {
    activeCategory: 'station' | 'client';
    onCategoryChange: (cat: 'station' | 'client') => void;
    provinces: string[];
    selectedProvince: string;
    onProvinceChange: (province: string) => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const sidebarVariants = {
    hidden: { x: -40, opacity: 0, filter: "blur(10px)" },
    visible: { 
        x: 0, 
        opacity: 1,
        filter: "blur(0px)",
        transition: {
            duration: 1.0,
            ease: [0.22, 1, 0.36, 1] as const,
        }
    }
};

export default function SideNavBar({ 
    activeCategory, 
    onCategoryChange, 
    provinces,
    selectedProvince,
    onProvinceChange,
    isOpen, 
    onClose 
}: SideNavBarProps) {
    const [mounted, setMounted] = React.useState(false);
    const [role, setRole] = React.useState<AppRole>("user");
    const pathname = usePathname();
    const isIncidentsActive = pathname.startsWith("/incidents") || pathname.startsWith("/mission-control");
    const isNotificationOpsActive = pathname.startsWith("/notification-ops");
    const isActivityLogsActive = pathname.startsWith("/activity-logs");
    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        let isMounted = true;
        fetch("/api/auth/user", { cache: "no-store" })
            .then((response) => response.json())
            .then((json) => {
                if (isMounted && (json.user?.role === "admin" || json.user?.role === "user")) {
                    setRole(json.user.role);
                }
            })
            .catch(() => undefined);
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>
            
            <motion.aside 
                variants={sidebarVariants}
                initial="hidden"
                animate="visible"
                className={`fixed left-0 top-0 lg:top-16 h-full lg:h-[calc(100vh-64px)] w-[280px] flex-col pt-6 px-4 gap-2 z-50 transition-transform duration-300 lg:translate-x-0 bg-grid ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                } lg:flex`}
                style={{
                    background: "rgba(10, 10, 15, 0.60)",
                    backdropFilter: "blur(16px)",
                    borderRight: "1px solid rgba(0, 240, 255, 0.10)",
                    boxShadow: "inset -10px 0 20px rgba(0,0,0,0.3), 0 0 20px rgba(0,240,255,0.03)",
                }}
            >
                {/* Lightning line top */}
                <div className="lightning-line mb-4 opacity-50" />

                {/* Mobile Close */}
                <div className="lg:hidden flex justify-end mb-4">
                    <Magnetic distance={0.2}>
                        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-xl transition-all duration-200">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </Magnetic>
                </div>

                {/* Brand Section */}
                <div className="mb-6 px-4">
                    <h2 className="text-white font-extrabold text-lg tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                        NEXUS IMS
                    </h2>
                    <p className="text-neon-cyan/70 text-[9px] font-bold tracking-widest uppercase mt-0.5">INFRASTRUCTURE MGMT</p>
                </div>

                {/* Section Label */}
                <div className="px-4 mb-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">ข้อมูลหลัก</span>
                </div>
            
                <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pr-2 scrollbar-thin">
                    {/* Station Category */}
                    <div className="flex flex-col gap-0.5 relative">
                        <Magnetic distance={0.15}>
                            <button 
                                onClick={() => onCategoryChange('station')}
                                className={cn(
                                    "group flex items-center gap-3 px-4 py-3 font-bold rounded-xl transition-all duration-300 relative w-full",
                                    activeCategory === 'station' 
                                    ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' 
                                    : 'text-slate-400 hover:bg-neon-cyan/5 hover:text-neon-cyan/80'
                                )}
                                style={activeCategory === 'station' ? { 
                                    boxShadow: "0 0 12px rgba(0,240,255,0.1), inset 0 0 8px rgba(0,240,255,0.05)",
                                    textShadow: "0 0 4px rgba(0,240,255,0.3)"
                                } : {}}
                            >
                                <span className={`material-symbols-outlined text-[20px] transition-all duration-300 relative z-10 ${
                                    activeCategory === 'station' ? 'text-neon-cyan scale-110' : 'text-zinc-400 group-hover:text-neon-cyan'
                                }`} style={activeCategory === 'station' ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                    cell_tower
                                </span>
                                <span className="text-sm relative z-10">ข้อมูลสถานี</span>
                                {activeCategory === 'station' && (
                                    <span className="absolute right-2 w-1 h-4 rounded-full bg-neon-cyan shadow-[0_0_6px_#00f0ff] z-10" />
                                )}
                            </button>
                        </Magnetic>
                        
                        <AnimatePresence>
                            {activeCategory === 'station' && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0, filter: 'blur(4px)' }}
                                    animate={{ height: 'auto', opacity: 1, filter: 'blur(0px)' }}
                                    exit={{ height: 0, opacity: 0, filter: 'blur(4px)' }}
                                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                                    className="overflow-hidden flex flex-col gap-0.5 ms-8 mt-1 mb-2 pl-3 border-l-2 border-neon-cyan/25"
                                >
                                    <Magnetic distance={0.1}>
                                        <button 
                                            onClick={() => onProvinceChange('All')}
                                            className={cn(
                                                "text-left px-3 py-1.5 text-[11px] rounded-lg font-bold transition-all duration-200 w-full",
                                                selectedProvince === 'All' 
                                                ? 'text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/20' 
                                                : 'text-zinc-400 hover:text-neon-cyan/80 hover:bg-neon-cyan/5'
                                            )}
                                        >
                                            ทั้งหมด
                                        </button>
                                    </Magnetic>
                                    {mounted && provinces.map((p, idx) => (
                                        <Magnetic key={p} distance={0.1}>
                                            <motion.button 
                                                initial={{ x: -10, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: idx * 0.03 + 0.1 }}
                                                onClick={() => onProvinceChange(p)}
                                                className={cn(
                                                    "text-left px-3 py-1.5 text-[11px] rounded-lg font-bold transition-all duration-200 w-full",
                                                    selectedProvince === p 
                                                    ? 'text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/20' 
                                                    : 'text-zinc-400 hover:text-neon-cyan/80 hover:bg-neon-cyan/5'
                                                )}
                                            >
                                                {p}
                                            </motion.button>
                                        </Magnetic>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Client Category */}
                    <div className="flex flex-col gap-0.5 relative">
                        <Magnetic distance={0.15}>
                            <button 
                                onClick={() => onCategoryChange('client')}
                                className={cn(
                                    "group flex items-center gap-3 px-4 py-3 font-bold rounded-xl transition-all duration-300 relative w-full",
                                    activeCategory === 'client' 
                                    ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' 
                                    : 'text-slate-400 hover:bg-neon-cyan/5 hover:text-neon-cyan/80'
                                )}
                                style={activeCategory === 'client' ? { 
                                    boxShadow: "0 0 12px rgba(0,240,255,0.1), inset 0 0 8px rgba(0,240,255,0.05)",
                                    textShadow: "0 0 4px rgba(0,240,255,0.3)"
                                } : {}}
                            >
                                <span className={`material-symbols-outlined text-[20px] transition-all duration-300 relative z-10 ${
                                    activeCategory === 'client' ? 'text-neon-cyan scale-110' : 'text-zinc-400 group-hover:text-neon-cyan'
                                }`} style={activeCategory === 'client' ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                    router
                                </span>
                                <span className="text-sm relative z-10">ระบบลูกข่าย</span>
                                {activeCategory === 'client' && (
                                    <span className="absolute right-2 w-1 h-4 rounded-full bg-neon-cyan shadow-[0_0_6px_#00f0ff] z-10" />
                                )}
                            </button>
                        </Magnetic>

                        <AnimatePresence>
                            {activeCategory === 'client' && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0, filter: 'blur(4px)' }}
                                    animate={{ height: 'auto', opacity: 1, filter: 'blur(0px)' }}
                                    exit={{ height: 0, opacity: 0, filter: 'blur(4px)' }}
                                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                                    className="overflow-hidden flex flex-col gap-0.5 ms-8 mt-1 mb-2 pl-3 border-l-2 border-neon-cyan/25"
                                >
                                    <Magnetic distance={0.1}>
                                        <button 
                                            onClick={() => onProvinceChange('All')}
                                            className={cn(
                                                "text-left px-3 py-1.5 text-[11px] rounded-lg font-bold transition-all duration-200 w-full",
                                                selectedProvince === 'All' 
                                                ? 'text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/20' 
                                                : 'text-zinc-400 hover:text-neon-cyan/80 hover:bg-neon-cyan/5'
                                            )}
                                        >
                                            ทั้งหมด
                                        </button>
                                    </Magnetic>
                                    {mounted && provinces.map((p, idx) => (
                                        <Magnetic key={p} distance={0.1}>
                                            <motion.button 
                                                initial={{ x: -10, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: idx * 0.03 + 0.1 }}
                                                onClick={() => onProvinceChange(p)}
                                                className={cn(
                                                    "text-left px-3 py-1.5 text-[11px] rounded-lg font-bold transition-all duration-200 w-full",
                                                    selectedProvince === p 
                                                    ? 'text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/20' 
                                                    : 'text-zinc-400 hover:text-neon-cyan/80 hover:bg-neon-cyan/5'
                                                )}
                                            >
                                                {p}
                                            </motion.button>
                                        </Magnetic>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Divider */}
                    <div className="mx-4 my-3 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent"></div>

                    {/* Incidents */}
                    <div className="px-4 mb-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">ปฏิบัติการ</span>
                    </div>

                    <Magnetic distance={0.15}>
                        <Link
                            href="/mission-control"
                            className={cn(
                                "group flex items-center gap-3 px-4 py-3 font-bold rounded-xl transition-all duration-300 relative w-full",
                                isIncidentsActive
                                    ? "bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/25"
                                    : "text-slate-400 hover:bg-neon-magenta/5 hover:text-neon-magenta/80"
                            )}
                            style={isIncidentsActive ? {
                                boxShadow: "0 0 12px rgba(255,0,160,0.12), inset 0 0 8px rgba(255,0,160,0.05)",
                                textShadow: "0 0 4px rgba(255,0,160,0.3)"
                            } : {}}
                        >
                            <span className={`material-symbols-outlined text-[20px] transition-all duration-300 ${
                                isIncidentsActive ? "text-neon-magenta scale-110" : "text-zinc-400 group-hover:text-neon-magenta"
                            }`} style={isIncidentsActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                report
                            </span>
                            <span className="text-sm">Incidents</span>
                            {isIncidentsActive && (
                                <span className="absolute right-2 w-1 h-4 rounded-full bg-neon-magenta shadow-[0_0_6px_#ff00a0]" />
                            )}
                        </Link>
                    </Magnetic>

                    {role === "admin" && (
                    <>
                    <Magnetic distance={0.15}>
                        <Link
                            href="/notification-ops"
                            className={cn(
                                "group flex items-center gap-3 px-4 py-3 font-bold rounded-xl transition-all duration-300 relative w-full",
                                isNotificationOpsActive
                                    ? "bg-neon-yellow/10 text-neon-yellow border border-neon-yellow/25"
                                    : "text-slate-400 hover:bg-neon-yellow/5 hover:text-neon-yellow/80"
                            )}
                            style={isNotificationOpsActive ? {
                                boxShadow: "0 0 12px rgba(240,232,0,0.12), inset 0 0 8px rgba(240,232,0,0.05)",
                                textShadow: "0 0 4px rgba(240,232,0,0.3)"
                            } : {}}
                        >
                            <span className={`material-symbols-outlined text-[20px] transition-all duration-300 ${
                                isNotificationOpsActive ? "text-neon-yellow scale-110" : "text-zinc-400 group-hover:text-neon-yellow"
                            }`} style={isNotificationOpsActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                notifications_active
                            </span>
                            <span className="text-sm">Notification Ops</span>
                            {isNotificationOpsActive && (
                                <span className="absolute right-2 w-1 h-4 rounded-full bg-neon-yellow shadow-[0_0_6px_#f0e800]" />
                            )}
                        </Link>
                    </Magnetic>

                    <Magnetic distance={0.15}>
                        <Link
                            href="/activity-logs"
                            className={cn(
                                "group flex items-center gap-3 px-4 py-3 font-bold rounded-xl transition-all duration-300 relative w-full",
                                isActivityLogsActive
                                    ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/25"
                                    : "text-slate-400 hover:bg-neon-cyan/5 hover:text-neon-cyan/80"
                            )}
                            style={isActivityLogsActive ? {
                                boxShadow: "0 0 12px rgba(0,240,255,0.12), inset 0 0 8px rgba(0,240,255,0.05)",
                                textShadow: "0 0 4px rgba(0,240,255,0.3)"
                            } : {}}
                        >
                            <span className={`material-symbols-outlined text-[20px] transition-all duration-300 ${
                                isActivityLogsActive ? "text-neon-cyan scale-110" : "text-zinc-400 group-hover:text-neon-cyan"
                            }`} style={isActivityLogsActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                manage_search
                            </span>
                            <span className="text-sm">Activity Logs</span>
                            {isActivityLogsActive && (
                                <span className="absolute right-2 w-1 h-4 rounded-full bg-neon-cyan shadow-[0_0_6px_#00f0ff]" />
                            )}
                        </Link>
                    </Magnetic>

                    </>
                    )}

                    <div className="mx-4 my-3 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent"></div>

                    {/* Section Label */}
                    <div className="px-4 mb-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">รายงาน</span>
                    </div>

                    <Magnetic distance={0.15}>
                        <a className="group flex items-center gap-3 text-slate-400 px-4 py-3 hover:bg-neon-cyan/5 hover:text-neon-cyan/80 transition-all duration-200 rounded-xl font-semibold w-full" href="/report">
                            <span className="material-symbols-outlined text-[20px] text-zinc-400 group-hover:text-neon-cyan transition-colors duration-200">assessment</span>
                            <span className="text-sm">Reports</span>
                        </a>
                    </Magnetic>
                </nav>
            
                {/* Footer */}
                <div className="pt-4 border-t border-dark-border mb-20 space-y-1">
                    <Magnetic distance={0.15}>
                        <a className="group flex items-center gap-3 text-zinc-500 px-4 py-2.5 hover:bg-neon-cyan/5 hover:text-neon-cyan/80 transition-all duration-200 rounded-xl font-medium w-full" href="#">
                            <span className="material-symbols-outlined text-[18px]">help</span>
                            <span className="text-xs">Help Center</span>
                        </a>
                    </Magnetic>
                    <div className="px-4 py-2">
                        <span className="text-[9px] font-bold text-zinc-700 tracking-widest uppercase" style={{ textShadow: "0 0 4px rgba(255,255,255,0.02)" }}>ProssNum © 2026</span>
                    </div>
                </div>

                {/* Bottom lightning line */}
                <div className="mt-auto lightning-line opacity-30" />
            </motion.aside>
        </>
    );
}
