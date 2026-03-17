"use client";

import { motion } from "motion/react";
import ProfileIcon from "../../../../public/assets/profile.png";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "../../../i18n/I18nProvider";
import { useWorkspaceTheme } from "../WorkspaceThemeProvider";
import { WorkspaceThemePicker } from "../../../components/WorkspaceThemePicker";
import { LocaleToggle } from "../../../i18n/LocaleToggle";

type Props = {
  user: string;
  workspace: string;
};

type UserData = {
  id: number;
  name: string;
  email: string | null;
};

const NO_SPACES = /^\S+$/;

export default function Profile({ user, workspace }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const { theme, setTheme, themes } = useWorkspaceTheme();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/get-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user }),
        });

        const data = (await response.json().catch(() => null)) as
          | (Partial<UserData> & { message?: string })
          | null;

        if (!response.ok) {
          if (cancelled) return;
          setUserData(null);
          setError(data?.message ?? t("profile.errors.fetchUserFailed"));
          return;
        }

        if (cancelled) return;

        if (typeof data?.id === "number" && typeof data?.name === "string") {
          setUserData({
            id: data.id,
            name: data.name,
            email: typeof data.email === "string" ? data.email : null,
          });
        } else {
          setUserData(null);
          setError(t("profile.errors.invalidUserPayload"));
        }
      } catch {
        if (cancelled) return;
        setUserData(null);
        setError(t("profile.errors.network"));
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, t]);

  useEffect(() => {
    if (!userData) return;
    setDraftName(userData.name);
    setDraftEmail(userData.email ?? "");
  }, [userData]);

  async function handleSave() {
    if (!userData) return;

    setSaveMessage(null);
    setSaveError(null);

    const nextName = draftName.trim();
    const nextEmail = draftEmail.trim();

    if (!nextName || !nextEmail) {
      setSaveError(t("profile.errors.required"));
      return;
    }

    if (!NO_SPACES.test(nextName)) {
      setSaveError(t("profile.errors.usernameNoSpaces"));
      return;
    }

    if (!NO_SPACES.test(nextEmail)) {
      setSaveError(t("profile.errors.emailNoSpaces"));
      return;
    }

    if (nextName === userData.name && nextEmail === (userData.email ?? "")) {
      setSaveMessage(t("profile.noChanges"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/update-user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_name: user,
          next_name: nextName,
          next_email: nextEmail,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | (Partial<UserData> & { message?: string })
        | null;

      if (!res.ok) {
        setSaveError(data?.message ?? t("profile.errors.updateFailed"));
        return;
      }

      if (typeof data?.id !== "number" || typeof data?.name !== "string") {
        setSaveError(t("profile.errors.invalidUpdateResponse"));
        return;
      }

      const updated: UserData = {
        id: data.id,
        name: data.name,
        email: typeof data.email === "string" ? data.email : null,
      };

      setUserData(updated);
      setSaveMessage(t("profile.saved"));

      if (typeof window !== "undefined") {
        window.localStorage.setItem("users", JSON.stringify(updated.name));
      }

      if (updated.name !== user) {
        router.push(
          `/${encodeURIComponent(updated.name)}/${encodeURIComponent(workspace)}/profile`,
        );
        router.refresh();
      } else {
        router.refresh();
      }
    } catch {
      setSaveError(t("profile.errors.network"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.main
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen md:h-screen bg-(--ws-bg) flex"
    >
      <section className="py-2 w-full">
        <main className="w-full md:min-h-full border-y border-l rounded-l-xl border-(--ws-border) bg-(--ws-surface) p-4 md:p-6 text-(--ws-fg)">
          <div className="mx-auto w-full max-w-5xl flex flex-col gap-6">
            <header className="rounded-2xl border border-(--ws-border) bg-(--ws-surface-2) p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
              <Image
                src={ProfileIcon}
                alt={t("profile.alt.profileIcon")}
                className="ws-icon w-20 h-20"
              />
              <div className="min-w-0">
                <h1 className="heading text-xl md:text-2xl">
                  {t("profile.title")}
                </h1>
                <p className="text-sm text-(--ws-fg-muted)">
                  {workspace
                    ? `${t("profile.workspaceLabel")}: ${workspace}`
                    : ""}
                </p>
              </div>
            </header>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <article className="rounded-2xl border border-(--ws-border) bg-(--ws-surface-2) p-4 lg:col-span-1">
                <h2 className="text-sm font-semibold">
                  {t("profile.accountOverviewTitle")}
                </h2>
                <div className="mt-4 flex flex-col gap-3 text-sm">
                  <div>
                    <div className="text-xs text-(--ws-fg-muted)">
                      {t("profile.usernameLabel")}
                    </div>
                    <div>{userData ? userData.name : ""}</div>
                  </div>
                  <div>
                    <div className="text-xs text-(--ws-fg-muted)">
                      {t("profile.emailLabel")}
                    </div>
                    <div>{userData?.email ?? ""}</div>
                  </div>
                  <div>
                    <div className="text-xs text-(--ws-fg-muted)">
                      {t("profile.userIdLabel")}
                    </div>
                    <div>{userData ? `#${userData.id}` : ""}</div>
                  </div>
                </div>
                {loading ? (
                  <div className="mt-3 text-xs text-(--ws-fg-muted)">
                    {t("profile.loading")}
                  </div>
                ) : null}
                {error ? (
                  <div className="mt-2 text-xs text-red-400">{error}</div>
                ) : null}
              </article>

              <article className="rounded-2xl border border-(--ws-border) bg-(--ws-surface-2) p-4 lg:col-span-2">
                <h2 className="text-sm font-semibold">
                  {t("profile.accountSettingsTitle")}
                </h2>
                <p className="mt-1 text-xs text-(--ws-fg-muted)">
                  {t("profile.accountSettingsDesc")}
                </p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-(--ws-fg-muted)">
                      {t("profile.usernameLabel")}
                    </span>
                    <input
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      className="border w-full border-(--ws-border) text-(--ws-fg) placeholder:text-(--ws-fg-muted) rounded-lg px-3 py-2 bg-transparent focus:outline-none"
                      placeholder={t("profile.usernamePlaceholder")}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-(--ws-fg-muted)">
                      {t("profile.emailLabel")}
                    </span>
                    <input
                      type="email"
                      value={draftEmail}
                      onChange={(e) => setDraftEmail(e.target.value)}
                      className="border w-full border-(--ws-border) text-(--ws-fg) placeholder:text-(--ws-fg-muted) rounded-lg px-3 py-2 bg-transparent focus:outline-none"
                      placeholder={t("profile.emailPlaceholder")}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !userData}
                    className="px-3 py-2 rounded-lg border border-(--ws-border) hover:bg-(--ws-hover) disabled:opacity-60 text-sm"
                  >
                    {saving ? t("profile.saving") : t("profile.save")}
                  </button>
                  {saveMessage ? (
                    <span className="text-xs text-emerald-400">
                      {saveMessage}
                    </span>
                  ) : null}
                  {saveError ? (
                    <span className="text-xs text-red-400">{saveError}</span>
                  ) : null}
                </div>

                <div className="mt-4 rounded-lg border border-(--ws-border) p-3">
                  <div className="text-xs text-(--ws-fg)">
                    {t("profile.notesTitle")}
                  </div>
                  <div className="mt-1 text-xs text-(--ws-fg-muted)">
                    {t("profile.notesRedirect")}
                  </div>
                  <div className="mt-1 text-xs text-(--ws-fg-muted)">
                    {t("profile.notesConsistency")}
                  </div>
                </div>
              </article>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <article className="rounded-2xl border border-(--ws-border) bg-(--ws-surface-2) p-4">
                <h2 className="text-sm font-semibold">{t("settings.title")}</h2>
                <p className="mt-1 text-xs text-(--ws-fg-muted)">
                  {t("settings.desc")}
                </p>

                <div className="mt-4">
                  <WorkspaceThemePicker
                    value={theme}
                    onChange={setTheme}
                    themes={themes}
                  />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-(--ws-fg-muted)">
                    {t("settings.current")}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-lg border border-(--ws-border)">
                    {theme}
                  </span>
                </div>
              </article>

              <article className="rounded-2xl border border-(--ws-border) bg-(--ws-surface-2) p-4">
                <h2 className="text-sm font-semibold">
                  {t("settings.toggle")}
                </h2>
                <p className="mt-1 text-xs text-(--ws-fg-muted)">
                  {t("settings.previewHint")}
                </p>
                <div className="mt-4 inline-block rounded-lg border border-(--ws-border) p-2 bg-(--ws-surface)">
                  <LocaleToggle />
                </div>
              </article>
            </section>
          </div>
        </main>
      </section>
    </motion.main>
  );
}
