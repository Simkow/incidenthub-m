"use client";

import Link from "next/link";
import Image from "next/image";
import Arrow from "../../public/assets/down-arrow.png";
import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { useI18n } from "../i18n/I18nProvider";

export const FirstWorkspace: React.FC = () => {
  const { t } = useI18n();

  const [userName] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const storedUser = window.localStorage.getItem("users");
    if (!storedUser) return "";
    try {
      const parsed = JSON.parse(storedUser) as unknown;
      return (typeof parsed === "string" ? parsed : storedUser)
        .replace(/"/g, "")
        .trim();
    } catch {
      return storedUser.replace(/"/g, "").trim();
    }
  });
  const [userEmail] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const storedMail = window.localStorage.getItem("userEmail");
    if (!storedMail) return "";
    try {
      const parsed = JSON.parse(storedMail) as unknown;
      return (typeof parsed === "string" ? parsed : storedMail)
        .replace(/"/g, "")
        .trim();
    } catch {
      return storedMail.replace(/"/g, "").trim();
    }
  });
  const [isClicked, setIsClicked] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState("");

  const [pendingInvites, setPendingInvites] = useState<
    Array<{ id: number; workspace: string; inviter: string }>
  >([]);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [respondingInviteId, setRespondingInviteId] = useState<number | null>(
    null,
  );

  const trimmedProjectName = projectName.trim();

  const fetchInvites = useCallback(async () => {
    if (!userName) return;
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem("authToken");
    const tokenPresent = !!(token ? token.replace(/"/g, "") : "");
    if (!tokenPresent) {
      setPendingInvites([]);
      return;
    }

    try {
      const res = await fetch("/api/get-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userName }),
      });

      const data = (await res.json().catch(() => null)) as {
        invitations?: unknown;
      } | null;

      const invites = Array.isArray(data?.invitations)
        ? (data?.invitations as Array<{
            id?: unknown;
            workspace?: unknown;
            inviter?: unknown;
          }>)
            .map((i) => ({
              id: typeof i.id === "number" ? i.id : Number(i.id),
              workspace: typeof i.workspace === "string" ? i.workspace : "",
              inviter: typeof i.inviter === "string" ? i.inviter : "",
            }))
            .filter((i) => Number.isFinite(i.id) && i.workspace && i.inviter)
        : [];

      setPendingInvites(invites);
    } catch (err) {
      console.error("Failed to fetch invitations", err);
      setPendingInvites([]);
    }
  }, [userName]);

  const respondInvite = useCallback(
    async (invitationId: number, action: "accept" | "reject", workspace: string) => {
      if (!userName) return;

      setInviteMessage(null);
      setInviteError(null);
      setRespondingInviteId(invitationId);

      try {
        const res = await fetch("/api/respond-invitation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: userName, invitationId, action }),
        });

        const data = (await res.json().catch(() => null)) as {
          message?: unknown;
        } | null;

        const msg = typeof data?.message === "string" ? data.message : "";
        if (!res.ok) {
          setInviteError(msg || "Failed");
          return;
        }

        setInviteMessage(msg || "OK");
        await fetchInvites();

        if (action === "accept") {
          window.localStorage.setItem("workspace", JSON.stringify(workspace));
          window.location.href = `/${userName}/${workspace}/tasks`;
        }
      } catch (err) {
        console.error("Failed to respond invitation", err);
        setInviteError("Network error");
      } finally {
        setRespondingInviteId(null);
      }
    },
    [fetchInvites, userName],
  );

  useEffect(() => {
    void fetchInvites();
  }, [fetchInvites]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");

      const normalizedUserName = userName.trim();
      const normalizedUserEmail = userEmail.trim();

      if (!trimmedProjectName || !normalizedUserName) {
        console.error("Missing project name");
        setError(t("firstWorkspace.missingProjectName"));
        return;
      }

      if (
        normalizedUserName.toLowerCase() === "undefined" ||
        normalizedUserName.toLowerCase() === "null"
      ) {
        setError(t("firstWorkspace.sessionExpired"));
        return;
      }

      if (/\s/.test(trimmedProjectName)) {
        setError(t("firstWorkspace.workspaceSpaceMessage"));
        return;
      }

      const response = await fetch("/api/first-workspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspace: trimmedProjectName,
          username: normalizedUserName,
          email: normalizedUserEmail,
        }),
      });

      if (response.ok) {
        console.log("Workspace created successfully");
        localStorage.setItem("workspace", JSON.stringify(trimmedProjectName));
        window.location.href = `/${normalizedUserName}/${trimmedProjectName}/tasks`;
      }
      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        const message =
          (data as { message?: unknown })?.message &&
          typeof (data as { message?: unknown }).message === "string"
            ? ((data as { message: string }).message as string)
            : t("firstWorkspace.failedCreate");
        console.error(message);
        setError(message);
      }
    } catch (error) {
      console.error("Error adding workspace:", error);
      setError(t("firstWorkspace.internalError"));
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-center relative bg-[#121212] manrope px-4 md:px-0">
      <Link
        href={"/"}
        className="text-neutral-400 absolute left-4 md:left-8 top-5 flex gap-2 items-center hover:text-neutral-200 transition-all text-sm"
      >
        <Image
          src={Arrow}
          alt="arrow"
          className="w-3 h-3 rotate-90"
          width={12}
          height={12}
        />
        {t("firstWorkspace.back")}
      </Link>
      <span className="flex flex-col items-start absolute right-4 md:right-8 top-5 gap-1 text-neutral-400 text-sm max-w-[60vw] md:max-w-none">
        {t("firstWorkspace.loggedInAs")}{" "}
        <span className="text-neutral-200">{userEmail}</span>
      </span>
      <main>
        <section className="w-full h-full flex flex-col justify-center items-center gap-6">
          {pendingInvites.length ? (
            <div className="w-[92vw] max-w-md rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <h2 className="text-sm text-neutral-300">
                {t("sidebar.invitations")}
              </h2>
              <div className="mt-3 flex flex-col gap-2">
                {pendingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] text-white/80"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="text-white/90">{inv.workspace}</span>
                        <span className="text-white/50"> · {inv.inviter}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={respondingInviteId === inv.id}
                        onClick={() =>
                          void respondInvite(inv.id, "accept", inv.workspace)
                        }
                        className="rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-2 py-1 text-[11px] text-white disabled:opacity-60"
                      >
                        {t("sidebar.accept")}
                      </button>
                      <button
                        type="button"
                        disabled={respondingInviteId === inv.id}
                        onClick={() =>
                          void respondInvite(inv.id, "reject", inv.workspace)
                        }
                        className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 text-[11px] text-white/80 disabled:opacity-60"
                      >
                        {t("sidebar.reject")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {inviteMessage ? (
                <div className="mt-2 text-[11px] text-emerald-300">
                  {inviteMessage}
                </div>
              ) : null}
              {inviteError ? (
                <div className="mt-2 text-[11px] text-red-300">
                  {inviteError}
                </div>
              ) : null}
            </div>
          ) : null}

          <h1 className="text-3xl font-bold text-white">
            {t("firstWorkspace.title")}
          </h1>
          <p className="text-neutral-400 text-center w-full max-w-xl px-2 md:px-0">
            {t("firstWorkspace.desc")}
          </p>
          <button
            onClick={() => setIsClicked(true)}
            className="bg-black text-white rounded-lg px-6 py-3 hover:bg-neutral-800 transition cursor-pointer"
          >
            {t("firstWorkspace.cta")}
          </button>
          {isClicked && (
            <motion.form
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-4 w-[92vw] max-w-md mt-4"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="projectName"
                  className="text-neutral-200 font-medium"
                >
                  {t("firstWorkspace.projectName")}
                </label>
                <input
                  type="text"
                  id="projectName"
                  name="projectName"
                  className="text-neutral-700 bg-neutral-200 border border-neutral-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-neutral-300 text-sm"
                  placeholder={t("firstWorkspace.projectNamePh")}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
                <label
                  htmlFor="workspaceUrl"
                  className="text-neutral-200 font-medium mt-2"
                >
                  {t("firstWorkspace.workspaceUrl")}
                </label>
                <input
                  readOnly
                  type="text"
                  id="workspaceUrl"
                  value={`http://localhost:5173/${userName}/${trimmedProjectName || "<workspace>"}`}
                  name="workspaceUrl"
                  className="text-neutral-700 bg-neutral-200 border border-neutral-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-neutral-300 text-sm"
                  placeholder={t("firstWorkspace.workspaceUrlPh")}
                />
              </div>
              <span className="text-red-400 text-sm">{error}</span>
              <button
                type="submit"
                className="bg-black text-white rounded-lg px-6 py-3 hover:bg-neutral-800 transition cursor-pointer"
              >
                {t("firstWorkspace.createWorkspace")}
              </button>
            </motion.form>
          )}
        </section>
      </main>
    </div>
  );
};
