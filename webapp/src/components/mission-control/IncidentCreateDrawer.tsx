"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IncidentOperationFormFields } from "./IncidentOperationForm";
import type { IncidentAssetOption, IncidentOperationForm } from "@/hooks/useIncidentOperations";

export function IncidentCreateDrawer({
  open,
  form,
  assetOptions,
  isPending,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  form: IncidentOperationForm;
  assetOptions: IncidentAssetOption[];
  isPending: boolean;
  onChange: (form: IncidentOperationForm) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close new incident drawer"
            className="fixed inset-0 z-[70] cursor-default bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed bottom-0 right-0 top-0 z-[80] flex w-full max-w-[420px] flex-col overflow-hidden border-l border-neon-cyan/20 bg-dark-surface/94 bg-grid-fine shadow-[0_0_32px_rgba(0,240,255,0.12)] backdrop-blur-2xl sm:top-2 sm:right-2 sm:bottom-2 sm:rounded-md sm:border"
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative flex items-start justify-between gap-3 border-b border-white/10 p-3">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-neon-cyan/40 shadow-[0_0_16px_rgba(0,240,255,0.28)]" />
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan shadow-[0_0_12px_rgba(0,240,255,0.12)]">
                  <span className="material-symbols-outlined text-[16px]">add_alert</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.12em] text-white">New Incident</h2>
                  <div className="mt-0.5 text-[7px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Mission Control Intake
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-md border border-white/10 bg-dark-base/60 p-1.5 text-slate-400 transition-colors hover:border-neon-magenta/35 hover:text-neon-magenta"
                aria-label="Close drawer"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 border-b border-white/10 p-2">
              <HudChip icon="hub" label={form.assetType || "manual"} active={Boolean(form.assetId)} />
              <HudChip icon="person" label={form.reporter || "reporter"} active={Boolean(form.reporter)} />
              <HudChip icon="priority_high" label={form.priority} active />
            </div>

            <form
              className="min-h-0 flex-1 overflow-auto p-3"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
              }}
            >
              <IncidentOperationFormFields form={form} assetOptions={assetOptions} onChange={onChange} />
              <div className="sticky bottom-0 -mx-3 mt-3 border-t border-white/10 bg-dark-surface/95 p-3 backdrop-blur-xl">
                <button
                  disabled={isPending}
                  className="w-full rounded-md bg-neon-cyan px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-dark-base shadow-[0_0_18px_rgba(0,240,255,0.26)] transition-all hover:shadow-[0_0_26px_rgba(0,240,255,0.42)] disabled:opacity-50"
                >
                  {isPending ? "Processing..." : "Create Incident"}
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function HudChip({ icon, label, active }: { icon: string; label: string; active: boolean }) {
  return (
    <div
      className={`min-w-0 rounded-md border px-2 py-1.5 transition-colors duration-200 ${
        active ? "border-neon-cyan/25 bg-neon-cyan/10 text-neon-cyan" : "border-white/10 bg-dark-base/55 text-slate-500"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="material-symbols-outlined text-[13px]">{icon}</span>
        <span className="truncate text-[8px] font-black uppercase tracking-[0.1em]">{label || "-"}</span>
      </div>
    </div>
  );
}
