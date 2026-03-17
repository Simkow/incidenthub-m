"use client";

import React from "react";
import { useI18n } from "../../../i18n/I18nProvider";
import { useWorkspaceTheme } from "../WorkspaceThemeProvider";
import { WorkspaceThemePicker } from "../../../components/WorkspaceThemePicker";
import { LocaleToggle } from "../../../i18n/LocaleToggle";

export function Settings() {
  const { theme, setTheme, themes } = useWorkspaceTheme();
  const { t } = useI18n();

  return (
    <div className="w-full min-h-screen bg-(--ws-bg) flex body-text">
      <section className="py-2 w-full">
        <main className="w-full min-h-[calc(100vh-16px)] border-y border-l rounded-l-xl border-(--ws-border) bg-(--ws-surface) p-4 md:p-6">
          <div className="mx-auto max-w-4xl flex flex-col gap-5">
            <header className="rounded-2xl border border-(--ws-border) bg-(--ws-surface-2) p-4 md:p-5">
              <h1 className="text-xl md:text-2xl heading">{t("settings.title")}</h1>
              <p className="mt-1 text-sm text-(--ws-fg-muted)">{t("settings.desc")}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <article className="rounded-2xl border border-(--ws-border) bg-(--ws-surface-2) p-4">
                <h2 className="text-sm font-semibold">{t("settings.themeLabel")}</h2>
                <div className="mt-3">
                  <WorkspaceThemePicker
                    value={theme}
                    onChange={setTheme}
                    themes={themes}
                  />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-(--ws-fg-muted)">{t("settings.current")}</span>
                  <span className="text-xs px-2 py-1 rounded-lg border border-(--ws-border)">{theme}</span>
                </div>
              </article>

              <article className="rounded-2xl border border-(--ws-border) bg-(--ws-surface-2) p-4">
                <h2 className="text-sm font-semibold">{t("settings.toggle")}</h2>
                <p className="mt-1 text-xs text-(--ws-fg-muted)">{t("settings.previewHint")}</p>
                <div className="mt-4 inline-block rounded-lg border border-(--ws-border) p-2 bg-(--ws-surface)">
                  <LocaleToggle />
                </div>
              </article>
            </div>
          </div>
        </main>
      </section>
    </div>
  );
}
