"use client";

import React from "react";

interface SideNavBarProps {
    activeCategory: 'station' | 'client';
    onCategoryChange: (cat: 'station' | 'client') => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export default function SideNavBar({ activeCategory, onCategoryChange, isOpen, onClose }: SideNavBarProps) {
    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}
            
            <aside className={`fixed left-0 top-0 lg:top-16 h-full lg:h-[calc(100vh-64px)] w-64 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200/50 dark:border-zinc-800 flex-col pt-6 px-4 gap-2 z-50 transition-transform duration-300 lg:translate-x-0 ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:flex`}>
                <div className="lg:hidden flex justify-end mb-4">
                    <button onClick={onClose} className="p-2 text-zinc-500">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            <div className="mb-6 px-4">
                <h2 className="text-zinc-900 dark:text-white font-bold text-lg">Project Alpha</h2>
                <p className="text-zinc-500 text-xs font-medium">Phase 2 Construction</p>
            </div>
            
            <nav className="flex-1 flex flex-col gap-1">
                <button 
                    onClick={() => onCategoryChange('station')}
                    className={`flex items-center gap-3 px-4 py-3 font-semibold rounded-lg transition-all ${
                        activeCategory === 'station' 
                        ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                    }`}
                >
                    <span className="material-symbols-outlined">train</span>
                    ข้อมูลสถานีเดิม
                </button>
                <button 
                    onClick={() => onCategoryChange('client')}
                    className={`flex items-center gap-3 px-4 py-3 font-semibold rounded-lg transition-all ${
                        activeCategory === 'client' 
                        ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                    }`}
                >
                    <span className="material-symbols-outlined">cell_tower</span>
                    ระบบลูกข่าย
                </button>
                <a className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all rounded-lg font-medium" href="/report">
                    <span className="material-symbols-outlined">assessment</span>
                    Reports
                </a>
            </nav>
            
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 mb-20">
                <a className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all rounded-lg font-medium" href="#">
                    <span className="material-symbols-outlined">help</span>
                    Help Center
                </a>
            </div>
            </aside>
        </>
    );
}
