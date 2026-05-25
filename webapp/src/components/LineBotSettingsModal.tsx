"use client";

import React, { useEffect, useId, useState, useTransition } from "react";
import { useToast } from "@/components/Toast";

interface LineBotSettings {
  LINE_TOKEN: string;
  GROUP_ID: string;
  line_backup_token: string;
  line_backup_group_id: string;
  fallback_email_to: string;
}

interface LineBotSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptySettings: LineBotSettings = {
  LINE_TOKEN: "",
  GROUP_ID: "",
  line_backup_token: "",
  line_backup_group_id: "",
  fallback_email_to: "",
};

export default function LineBotSettingsModal({ isOpen, onClose }: LineBotSettingsModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [settings, setSettings] = useState<LineBotSettings>(emptySettings);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

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
    if (!isOpen) return;

    let isMounted = true;
    setError(null);

    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load settings");
        if (!isMounted) return;
        const lineToken = json.LINE_TOKEN || json.line_backup_token || "";
        const groupId = json.GROUP_ID || json.line_backup_group_id || "";
        setSettings({
          LINE_TOKEN: lineToken,
          GROUP_ID: groupId,
          line_backup_token: lineToken,
          line_backup_group_id: groupId,
          fallback_email_to: json.fallback_email_to || "",
        });
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load settings");
      }
    };

    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const updateSetting = (key: keyof LineBotSettings, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSaveSettings = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to save settings");
        showToast("LINE notification settings updated", "success");
        onClose();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update settings";
        setError(message);
        showToast(message, "error");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="relative z-[70]">
      <button
        type="button"
        aria-label="Close LINE bot settings"
        className="fixed inset-0 cursor-default bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />
      <div className="fixed inset-0 overflow-y-auto bg-grid">
        <div className="flex min-h-full items-center justify-center p-3 sm:p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="geo-corner relative w-full max-w-4xl overflow-hidden rounded-2xl border border-neon-cyan/20 bg-[#12121a]/95 shadow-[0_0_40px_rgba(0,240,255,0.08),0_28px_60px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(0,240,255,0.08)] backdrop-blur-[40px] transition duration-200 ease-out data-closed:scale-95 data-closed:opacity-0"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-neon-cyan via-neon-yellow to-transparent opacity-80" />
            <div className="absolute -right-28 -top-28 h-56 w-56 rounded-full bg-neon-yellow/10 blur-[90px]" />
            <div className="absolute -bottom-32 left-8 h-60 w-60 rounded-full bg-neon-cyan/10 blur-[110px]" />

            <form onSubmit={handleSaveSettings} className="relative p-6 sm:p-8">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neon-yellow/25 bg-neon-yellow/10 text-neon-yellow shadow-[0_0_18px_rgba(240,232,0,0.16)]">
                    <span className="material-symbols-outlined text-[28px]">settings</span>
                  </div>
                  <div className="min-w-0">
                    <h2
                      id={titleId}
                      className="text-xl font-extrabold tracking-wide text-white sm:text-2xl"
                      style={{
                        fontFamily: "var(--font-display)",
                        textShadow: "0 0 12px rgba(255,255,255,0.14)",
                      }}
                    >
                      LINE Notification Settings
                    </h2>
                    <p id={descriptionId} className="mt-1 text-sm text-slate-500">
                      Manage LINE incident notification token and target group from Supabase.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close LINE bot settings"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent text-slate-500 transition-all duration-200 hover:border-neon-cyan/25 hover:bg-neon-cyan/10 hover:text-neon-cyan"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {error && (
                <div className="mb-5 flex items-center gap-2 rounded-xl border border-neon-magenta/30 bg-neon-magenta/10 px-4 py-3 text-sm font-semibold text-pink-200">
                  <span className="material-symbols-outlined text-base text-neon-magenta">error</span>
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <SettingsField label="LINE_TOKEN">
                  <input
                    type="password"
                    value={settings.LINE_TOKEN}
                    onChange={(event) => updateSetting("LINE_TOKEN", event.target.value)}
                    className="neon-input min-h-14 px-4 text-base font-semibold sm:text-lg"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    autoComplete="off"
                  />
                </SettingsField>

                <SettingsField label="GROUP_ID">
                  <input
                    value={settings.GROUP_ID}
                    onChange={(event) => updateSetting("GROUP_ID", event.target.value)}
                    className="neon-input min-h-14 px-4 text-base font-semibold sm:text-lg"
                    placeholder="C1234567890abcdef..."
                    autoComplete="off"
                  />
                </SettingsField>

                <SettingsField label="Fallback Email Destination">
                  <input
                    type="email"
                    value={settings.fallback_email_to}
                    onChange={(event) => updateSetting("fallback_email_to", event.target.value)}
                    className="neon-input min-h-14 px-4 text-base font-semibold sm:text-lg"
                    placeholder="watchara.m@forth.co.th"
                    autoComplete="email"
                  />
                </SettingsField>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="mt-6 flex min-h-14 w-full items-center justify-center rounded-xl bg-neon-yellow px-5 py-3 text-sm font-black uppercase tracking-wider text-dark-base shadow-[0_0_20px_rgba(240,232,0,0.22)] transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(240,232,0,0.38)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
              >
                {isPending ? "Saving..." : "Save Settings"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-3 block text-[11px] font-black uppercase tracking-[0.32em] text-slate-500 sm:text-xs">
        {label}
      </span>
      {children}
    </label>
  );
}
