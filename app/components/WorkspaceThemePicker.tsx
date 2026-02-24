"use client";

import React from "react";
import { useI18n } from "../i18n/I18nProvider";
import {
  isWorkspaceThemeId,
  WORKSPACE_THEMES,
  type WorkspaceThemeId,
} from "../[user]/[workspace]/theme";

type ThemeOption = { id: WorkspaceThemeId; label?: string };

type Props = {
  value: WorkspaceThemeId;
  onChange: (next: WorkspaceThemeId) => void | Promise<void>;
  themes?: ThemeOption[];
  showPreview?: boolean;
  className?: string;
  label?: string;
  previewLabel?: string;
};

function themeLabel(
  id: WorkspaceThemeId,
  localeLabel: string | undefined,
  fallbackLabel: string | undefined,
) {
  const maybeKey = `workspaceThemes.${id}`;
  const safeLocaleLabel =
    localeLabel && localeLabel !== maybeKey ? localeLabel : "";
  return safeLocaleLabel || fallbackLabel || id;
}

export function WorkspaceThemePicker({
  value,
  onChange,
  themes = WORKSPACE_THEMES,
  showPreview = true,
  className,
  label,
  previewLabel,
}: Props) {
  const { t } = useI18n();

  const labelText = label ?? t("settings.themeLabel");
  const previewText = previewLabel ?? t("settings.preview");

  return (
    <div className={className}>
      <label className="block text-sm mb-2">{labelText}</label>
      <select
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          if (isWorkspaceThemeId(next)) {
            void onChange(next);
          }
        }}
        className={
          "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none bg-[color:var(--ws-surface,#181818)] " +
          "border-[color:var(--ws-border,#2e2e2e)] text-[color:var(--ws-fg,#ffffff)]"
        }
      >
        {themes.map((theme) => (
          <option
            key={theme.id}
            value={theme.id}
            className="bg-[color:var(--ws-surface,#181818)] text-[color:var(--ws-fg,#ffffff)]"
          >
            {themeLabel(
              theme.id,
              t(`workspaceThemes.${theme.id}`),
              theme.label,
            )}
          </option>
        ))}
      </select>

      {showPreview ? (
        <div className="mt-4">
          <div className="text-xs text-[color:var(--ws-fg-muted,rgba(255,255,255,0.78))]">
            {previewText}
          </div>
          <div
            className="ws-theme mt-2 rounded-xl border border-[color:var(--ws-border)] bg-[color:var(--ws-bg)] p-3"
            data-ws-theme={value}
          >
            <div className="rounded-lg border border-[color:var(--ws-border)] bg-[color:var(--ws-surface)] p-3">
              <div className="text-sm font-medium">Aa</div>
              <div className="mt-1 text-xs text-[color:var(--ws-fg-muted)]">
                {t("settings.previewHint")}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs rounded-lg px-2 py-1 border border-[color:var(--ws-border)] hover:bg-[color:var(--ws-hover)]"
                >
                  {t("settings.previewSecondary")}
                </button>
                <button
                  type="button"
                  className="text-xs rounded-lg px-2 py-1 bg-[color:var(--ws-accent)] text-[color:var(--ws-accent-fg)] border border-[color:var(--ws-accent)]"
                >
                  {t("settings.previewPrimary")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
