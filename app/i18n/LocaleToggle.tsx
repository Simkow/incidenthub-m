"use client";

import React from "react";
import { useI18n } from "./I18nProvider";

export function LocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className={
        "inline-flex items-center rounded-xl border border-white/20 bg-black/20 overflow-hidden " +
        (className ?? "")
      }
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={
          "px-3 py-1 text-xs transition-all " +
          (locale === "en" ? "text-white bg-white/10" : "text-neutral-400")
        }
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("pl")}
        className={
          "px-3 py-1 text-xs transition-all border-l border-white/10 " +
          (locale === "pl" ? "text-white bg-white/10" : "text-neutral-400")
        }
      >
        PL
      </button>
    </div>
  );
}
