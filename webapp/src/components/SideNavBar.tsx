"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Magnetic } from "./motion/Magnetic";

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
    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>
            
            <motion.aside 
                variants={sidebarVariants}

                className={`fixed left-0 top-0 lg:top-16 h-full lg:h-[calc(100vh-64px)] w-[280px] flex-col pt-6 px-4 gap-2 z-50 transition-transform duration-300 lg:translate-x-0 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                } lg:flex`}
                style={{
                    background: 'rgba(250, 250, 252, 0.85)',
                    backdropFilter: 'blur(20px) saturate(1.4)',
                    WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
                    borderRight: '1px solid rgba(0, 0, 0, 0.04)',
                }}
            >
                {/* Mobile Close */}
                <div className="lg:hidden flex justify-end mb-4">
                    <Magnetic distance={0.2}>
                        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-all duration-200">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </Magnetic>
                </div>

                {/* Brand Section */}
                <div className="mb-8 px-4">
                    <h2 className="text-zinc-900 dark:text-white font-extrabold text-lg tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>
                        ProssNum
                    </h2>
                    <p className="text-zinc-400 dark:text-zinc-500 text-[11px] font-semibold tracking-wide uppercase mt-0.5">Infrastructure Management</p>
                </div>

                {/* Section Label */}
                <div className="px-4 mb-2">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.15em]">ข้อมูลหลัก</span>
                </div>
            
                <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pr-2 scrollbar-thin">
                    {/* Station Category */}
                    <div className="flex flex-col gap-0.5 relative">
                        <Magnetic distance={0.15}>
                            <button 
                                onClick={() => onCategoryChange('station')}
                                className={`group flex items-center gap-3 px-4 py-3 font-bold rounded-xl transition-all duration-300 relative w-full ${
                                    activeCategory === 'station' 
                                    ? 'text-blue-700 dark:text-blue-300' 
                                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50 hover:text-zinc-700 dark:hover:text-zinc-200'
                                }`}
                            >
                                {activeCategory === 'station' && (
                                    <motion.div 
                                        layoutId="nav-active-bg"
                                        className="absolute inset-0 bg-blue-50/80 dark:bg-blue-900/20 rounded-xl z-0"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className={`material-symbols-outlined text-[20px] transition-all duration-300 relative z-10 ${
                                    activeCategory === 'station' ? 'text-blue-600 scale-110' : 'text-zinc-400 group-hover:text-zinc-600'
                                }`} style={activeCategory === 'station' ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                    cell_tower
                                </span>
                                <span className="text-sm relative z-10">ข้อมูลสถานี</span>
                                {activeCategory === 'station' && (
                                    <motion.span 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] z-10"
                                    />
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
                                    className="overflow-hidden flex flex-col gap-0.5 ms-8 mt-1 mb-2 pl-3 border-l-2 border-zinc-200/60 dark:border-zinc-700/60"
                                >
                                    <Magnetic distance={0.1}>
                                        <button 
                                            onClick={() => onProvinceChange('All')}
                                            className={`text-left px-3 py-1.5 text-[11px] rounded-lg font-bold transition-all duration-200 w-full ${
                                                selectedProvince === 'All' 
                                                ? 'text-blue-600 bg-blue-50/60 dark:bg-blue-900/20 dark:text-blue-400' 
                                                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/30'
                                            }`}
                                        >
                                            ทั้งหมด
                                        </button>
                                    </Magnetic>
                                    {provinces.map((p, idx) => (
                                        <Magnetic key={p} distance={0.1}>
                                            <motion.button 
                                                initial={{ x: -10, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: idx * 0.03 + 0.1 }}
                                                onClick={() => onProvinceChange(p)}
                                                className={`text-left px-3 py-1.5 text-[11px] rounded-lg font-bold transition-all duration-200 w-full ${
                                                    selectedProvince === p 
                                                    ? 'text-blue-600 bg-blue-50/60 dark:bg-blue-900/20 dark:text-blue-400' 
                                                    : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/30'
                                                }`}
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
                                className={`group flex items-center gap-3 px-4 py-3 font-bold rounded-xl transition-all duration-300 relative w-full ${
                                    activeCategory === 'client' 
                                    ? 'text-blue-700 dark:text-blue-300' 
                                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50 hover:text-zinc-700 dark:hover:text-zinc-200'
                                }`}
                            >
                                {activeCategory === 'client' && (
                                    <motion.div 
                                        layoutId="nav-active-bg"
                                        className="absolute inset-0 bg-blue-50/80 dark:bg-blue-900/20 rounded-xl z-0"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className={`material-symbols-outlined text-[20px] transition-all duration-300 relative z-10 ${
                                    activeCategory === 'client' ? 'text-blue-600 scale-110' : 'text-zinc-400 group-hover:text-zinc-600'
                                }`} style={activeCategory === 'client' ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                    router
                                </span>
                                <span className="text-sm relative z-10">ระบบลูกข่าย</span>
                                {activeCategory === 'client' && (
                                    <motion.span 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] z-10"
                                    />
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
                                    className="overflow-hidden flex flex-col gap-0.5 ms-8 mt-1 mb-2 pl-3 border-l-2 border-zinc-200/60 dark:border-zinc-700/60"
                                >
                                    <Magnetic distance={0.1}>
                                        <button 
                                            onClick={() => onProvinceChange('All')}
                                            className={`text-left px-3 py-1.5 text-[11px] rounded-lg font-bold transition-all duration-200 w-full ${
                                                selectedProvince === 'All' 
                                                ? 'text-blue-600 bg-blue-50/60 dark:bg-blue-900/20 dark:text-blue-400' 
                                                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/30'
                                            }`}
                                        >
                                            ทั้งหมด
                                        </button>
                                    </Magnetic>
                                    {provinces.map((p, idx) => (
                                        <Magnetic key={p} distance={0.1}>
                                            <motion.button 
                                                initial={{ x: -10, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: idx * 0.03 + 0.1 }}
                                                onClick={() => onProvinceChange(p)}
                                                className={`text-left px-3 py-1.5 text-[11px] rounded-lg font-bold transition-all duration-200 w-full ${
                                                    selectedProvince === p 
                                                    ? 'text-blue-600 bg-blue-50/60 dark:bg-blue-900/20 dark:text-blue-400' 
                                                    : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/30'
                                                }`}
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
                    <div className="mx-4 my-3 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-700 to-transparent"></div>

                    {/* Section Label */}
                    <div className="px-4 mb-1">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.15em]">รายงาน</span>
                    </div>

                    <Magnetic distance={0.15}>
                        <a className="group flex items-center gap-3 text-zinc-500 dark:text-zinc-400 px-4 py-3 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50 transition-all duration-200 rounded-xl font-semibold hover:text-zinc-700 dark:hover:text-zinc-200 w-full" href="/report">
                            <span className="material-symbols-outlined text-[20px] text-zinc-400 group-hover:text-zinc-600 transition-colors duration-200">assessment</span>
                            <span className="text-sm">Reports</span>
                        </a>
                    </Magnetic>
                </nav>
            
                {/* Footer */}
                <div className="pt-4 border-t border-zinc-200/50 dark:border-zinc-800 mb-20 space-y-1">
                    <Magnetic distance={0.15}>
                        <a className="group flex items-center gap-3 text-zinc-400 dark:text-zinc-500 px-4 py-2.5 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50 transition-all duration-200 rounded-xl font-medium hover:text-zinc-600 dark:hover:text-zinc-300 w-full" href="#">
                            <span className="material-symbols-outlined text-[18px]">help</span>
                            <span className="text-xs">Help Center</span>
                        </a>
                    </Magnetic>
                    <div className="px-4 py-2">
                        <span className="text-[9px] font-bold text-zinc-300 dark:text-zinc-700 tracking-widest uppercase">ProssNum © 2026</span>
                    </div>
                </div>
            </motion.aside>
        </>
    );
}
