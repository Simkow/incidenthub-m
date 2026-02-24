"use client";

import { motion } from "motion/react";
import ProfileIcon from "../../../../public/assets/profile.png";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "../../../i18n/I18nProvider";

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
      className="w-full min-h-screen bg-[#121212] flex"
    >
      <section className="py-2 w-full">
        <main className="w-full md:min-h-full border-y border-l rounded-l-xl border-[#2e2e2e] bg-[#181818] flex flex-col items-center p-4 gap-8 text-white relative">
          <div className="w-full md:min-h-screen text-white body-text flex flex-col gap-2 items-center justify-center">
            <Image
              src={ProfileIcon}
              alt={t("profile.alt.profileIcon")}
              className="w-28 h-28"
            />
            <span className="text-neutral-200 heading text-xl">
              {t("profile.title")}
            </span>
            <div className="text-sm text-neutral-500 body-text mb-3">
              {workspace ? `${t("profile.workspaceLabel")}: ${workspace}` : ""}
            </div>
            <section className="grid-cols-2 space-x-10 grid justify-center text-sm p-4 rounded-lg bg-neutral-950/40 border border-neutral-700">
              <div className="flex flex-col items-start gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-200 font-medium">
                    {t("profile.accountOverviewTitle")}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-400 text-xs">
                      {t("profile.usernameLabel")}
                    </span>
                    <span className="text-neutral-200">
                      {userData ? userData.name : ""}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-400 text-xs">
                      {t("profile.emailLabel")}
                    </span>
                    <span className="text-neutral-200">
                      {userData?.email ?? ""}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-400 text-xs">
                      {t("profile.userIdLabel")}
                    </span>
                    <span className="text-neutral-200">
                      {userData ? `#${userData.id}` : ""}
                    </span>
                  </div>
                </div>

                {loading && (
                  <div className="text-xs text-neutral-500">
                    {t("profile.loading")}
                  </div>
                )}
                {error && <div className="text-xs text-red-400">{error}</div>}
              </div>
              <div className="flex flex-col items-start gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-200 font-medium">
                    {t("profile.accountSettingsTitle")}
                  </span>
                  <span className="text-xs text-neutral-400 w-64">
                    {t("profile.accountSettingsDesc")}
                  </span>
                </div>

                <div className="w-64 rounded-lg border border-[#2e2e2e] p-3">
                  <div className="text-xs text-neutral-300">
                    {t("profile.notesTitle")}
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">
                    {t("profile.notesRedirect")}
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">
                    {t("profile.notesConsistency")}
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <span className="text-neutral-400 text-xs">
                    {t("profile.usernameLabel")}
                  </span>
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="border w-64 border-neutral-700 rounded-lg px-2 py-1 bg-transparent"
                    placeholder={t("profile.usernamePlaceholder")}
                  />
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <span className="text-neutral-400 text-xs">
                    {t("profile.emailLabel")}
                  </span>
                  <input
                    type="email"
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value)}
                    className="border w-64 border-neutral-700 rounded-lg px-2 py-1 bg-transparent"
                    placeholder={t("profile.emailPlaceholder")}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !userData}
                    className="px-3 py-1 rounded-lg border border-[#2e2e2e] hover:bg-[#2e2e2e] disabled:opacity-60"
                  >
                    {saving ? t("profile.saving") : t("profile.save")}
                  </button>
                  {saveMessage && (
                    <span className="text-xs text-emerald-400">
                      {saveMessage}
                    </span>
                  )}
                  {saveError && (
                    <span className="text-xs text-red-400">{saveError}</span>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </section>
    </motion.main>
  );
}
