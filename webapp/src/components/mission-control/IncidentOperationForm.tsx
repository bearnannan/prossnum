"use client";

import React from "react";
import {
  EQUIPMENT_SLA_RULES,
  getEquipmentSlaRule,
  getPriorityOptionsForEquipment,
  normalizePriorityForEquipment,
} from "@/lib/incidents/sla";
import type { IncidentPriority } from "@/lib/incidents/types";
import {
  assetOptionToFormPatch,
  REPAIR_STATUSES,
  type IncidentAssetOption,
  type IncidentOperationForm,
} from "@/hooks/useIncidentOperations";
import {
  formatIncidentPhone,
  invalidPhoneMessage,
  isValidIncidentPhone,
  PHONE_PATTERN,
} from "@/lib/incidents/phone";

function formatSlaDuration(hours?: number | null) {
  if (!hours) return "-";
  if (hours < 24) return `${hours}h`;
  return `${hours / 24}d`;
}

function formatBaht(value?: number | null) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function IncidentOperationFormFields({
  form,
  assetOptions,
  onChange,
  mode = "create",
}: {
  form: IncidentOperationForm;
  assetOptions: IncidentAssetOption[];
  onChange: (form: IncidentOperationForm) => void;
  mode?: "create" | "edit";
}) {
  const priorityOptions = getPriorityOptionsForEquipment(form.equipmentType);
  const reporterPhoneValid = isValidIncidentPhone(form.reporterPhone);
  const contactPhoneValid = isValidIncidentPhone(form.phone);

  const updateEquipment = (equipmentType: string) => {
    onChange({
      ...form,
      equipmentType,
      priority: normalizePriorityForEquipment(equipmentType, form.priority),
    });
  };

  const updateAsset = (assetKey: string) => {
    const asset = assetOptions.find((item) => item.key === assetKey);
    if (!asset) {
      onChange({
        ...form,
        assetId: "",
        assetType: "",
        assetName: "",
        province: "",
        district: "",
        lat: "",
        lon: "",
      });
      return;
    }
    onChange({ ...form, ...assetOptionToFormPatch(asset) });
  };

  return (
    <div className="space-y-2.5">
      <section className="rounded-md border border-neon-cyan/10 bg-dark-base/45 p-2.5">
        <FormSectionTitle icon="hub" title="Target" />
        <div className="mt-2">
      <Field label="Asset">
        <select
          value={form.assetType && form.assetId ? `${form.assetType}:${form.assetId}` : ""}
          onChange={(event) => updateAsset(event.target.value)}
          className="neon-input rounded-md px-2 py-1.5 text-[10px]"
        >
          <option value="">Manual / unmatched client system...</option>
          {assetOptions.map((asset) => (
            <option key={asset.key} value={asset.key}>
              CLIENT | {asset.stationName} | {asset.province || "-"} / {asset.district || "-"}
            </option>
          ))}
        </select>
        <input
          value={form.station}
          onChange={(event) => onChange({ ...form, station: event.target.value, assetName: event.target.value })}
          className="neon-input mt-1.5 rounded-md px-2 py-1.5 text-[10px]"
          placeholder="Station name"
          aria-label="Station name"
        />
        {form.lat && form.lon && (
          <div className="mt-1 text-[8px] font-mono text-slate-500">
            {form.assetType || "asset"} {form.lat}, {form.lon}
          </div>
        )}
      </Field>
        </div>
      </section>

      <section className="rounded-md border border-white/10 bg-dark-base/35 p-2.5">
        <FormSectionTitle icon="assignment_ind" title="Report" />
        <div className="mt-2 space-y-2.5">
      <Field label="Reporter">
        <input
          value={form.reporter}
          readOnly={mode === "edit"}
          onChange={(event) => onChange({ ...form, reporter: event.target.value })}
          className={`neon-input rounded-md px-2 py-1.5 text-[10px] ${mode === "edit" ? "cursor-not-allowed border-slate-700/60 bg-slate-950/45 opacity-65" : ""}`}
          placeholder="Reporter"
        />
      </Field>

      <Field label="Issue">
        <textarea
          value={form.issueDescription}
          onChange={(event) => onChange({ ...form, issueDescription: event.target.value })}
          className="neon-input min-h-[72px] resize-none rounded-md px-2 py-1.5 text-[10px]"
          placeholder="Describe the incident"
        />
      </Field>
        </div>
      </section>

      <section className="rounded-md border border-neon-magenta/10 bg-dark-base/35 p-2.5">
        <FormSectionTitle icon="settings_input_component" title="SLA" />
        <div className="mt-2 space-y-2.5">
      <Field label="Equipment Type">
        <select value={form.equipmentType} onChange={(event) => updateEquipment(event.target.value)} className="neon-input rounded-md px-2 py-1.5 text-[10px]">
          <option value="">Select equipment...</option>
          {EQUIPMENT_SLA_RULES.map((rule) => (
            <option key={rule.equipmentType} value={rule.equipmentType}>
              {rule.equipmentType}
            </option>
          ))}
        </select>
        {form.equipmentType && (
          <div className="mt-1 text-[8px] text-slate-500">
            SLA {formatSlaDuration(getEquipmentSlaRule(form.equipmentType)?.slaDurationHours)}
            {" | "}
            Penalty {formatBaht(getEquipmentSlaRule(form.equipmentType)?.penaltyRateBaht)}
            /{getEquipmentSlaRule(form.equipmentType)?.penaltyUnit}
          </div>
        )}
      </Field>
      <Field label="Priority">
        <select
          value={form.priority}
          onChange={(event) =>
            onChange({
              ...form,
              priority: normalizePriorityForEquipment(form.equipmentType, event.target.value as IncidentPriority),
            })
          }
          className="neon-input rounded-md px-2 py-1.5 text-[10px]"
          disabled={Boolean(form.equipmentType) && priorityOptions.length === 1}
        >
          {priorityOptions.map((priority) => (
            <option key={priority} value={priority}>
              {priority.toUpperCase()}
            </option>
          ))}
        </select>
        {form.equipmentType && (
          <div className="mt-1 text-[8px] text-slate-500">Priority is constrained by the selected equipment SLA.</div>
        )}
      </Field>
        </div>
      </section>

      <section className="rounded-md border border-neon-yellow/10 bg-dark-base/35 p-2.5">
        <FormSectionTitle icon="engineering" title="Dispatch" />
        <div className="mt-2 space-y-2.5">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Field label="Assignee">
          <input
            value={form.assignee}
            onChange={(event) => onChange({ ...form, assignee: event.target.value })}
            className="neon-input rounded-md px-2 py-1.5 text-[10px]"
            placeholder="Team / technician"
          />
        </Field>
        <Field label="Status">
          <select
            value={form.repairStatus}
            onChange={(event) => onChange({ ...form, repairStatus: event.target.value })}
            className="neon-input rounded-md px-2 py-1.5 text-[10px]"
          >
            {REPAIR_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Field label="Reporter Phone">
          <input
            value={form.reporterPhone}
            onChange={(event) => onChange({ ...form, reporterPhone: formatIncidentPhone(event.target.value) })}
            className={`neon-input rounded-md px-2 py-1.5 text-[10px] ${form.reporterPhone && !reporterPhoneValid ? "border-neon-magenta/60" : ""}`}
            placeholder="081-xxx-xxxx"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={12}
            pattern={PHONE_PATTERN.source}
            aria-invalid={form.reporterPhone ? !reporterPhoneValid : undefined}
            title={invalidPhoneMessage("Reporter phone")}
            required
          />
          {form.reporterPhone && !reporterPhoneValid && (
            <div className="mt-1 text-[8px] font-bold text-neon-magenta">
              {invalidPhoneMessage("Reporter phone")}
            </div>
          )}
        </Field>
        <Field label="Contact Phone">
          <input
            value={form.phone}
            onChange={(event) => onChange({ ...form, phone: formatIncidentPhone(event.target.value) })}
            className={`neon-input rounded-md px-2 py-1.5 text-[10px] ${form.phone && !contactPhoneValid ? "border-neon-magenta/60" : ""}`}
            placeholder="081-xxx-xxxx"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={12}
            pattern={PHONE_PATTERN.source}
            aria-invalid={form.phone ? !contactPhoneValid : undefined}
            title={invalidPhoneMessage("Contact phone")}
            required
          />
          {form.phone && !contactPhoneValid && (
            <div className="mt-1 text-[8px] font-bold text-neon-magenta">
              {invalidPhoneMessage("Contact phone")}
            </div>
          )}
        </Field>
      </div>
        </div>
      </section>
    </div>
  );
}

function FormSectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
      <span className="material-symbols-outlined text-[13px] text-neon-cyan">{icon}</span>
      <span>{title}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}
