"use client";

import React from "react";
import { useI18n } from "../../../i18n/I18nProvider";
import { useWorkspaceTheme } from "../WorkspaceThemeProvider";
import { WorkspaceThemePicker } from "../../../components/WorkspaceThemePicker";

export function Settings() {
  const { theme, setTheme, themes } = useWorkspaceTheme();
  const { t } = useI18n();

  return (
    <div className="w-full min-h-screen bg-[color:var(--ws-bg)] flex body-text">
      <section className="py-2 w-full">
        <main className="w-full min-h-[calc(100vh-16px)] border-y border-l rounded-l-xl border-[color:var(--ws-border)] bg-[color:var(--ws-surface)] p-4">
          <h1 className="text-xl md:text-2xl heading">{t("settings.title")}</h1>
          <p className="mt-1 text-sm text-[color:var(--ws-fg-muted)]">
            {t("settings.desc")}
          </p>

          <div className="mt-6 max-w-md rounded-xl border border-[color:var(--ws-border)] p-4">
            <WorkspaceThemePicker
              value={theme}
              onChange={setTheme}
              themes={themes}
            />

            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-[color:var(--ws-fg-muted)]">
                {t("settings.current")}
              </span>
              <span className="text-xs px-2 py-1 rounded-lg border border-[color:var(--ws-border)]">
                {theme}
              </span>
            </div>
          </div>
        </main>
      </section>
    </div>
  );
}
