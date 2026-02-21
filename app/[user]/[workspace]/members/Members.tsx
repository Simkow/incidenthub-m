"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { motion } from "motion/react";
import { useParams } from "next/navigation";
import { useI18n } from "../../../i18n/I18nProvider";

type ApiMessage = { message?: unknown } | null;

type Invitation = {
  id: number;
  invitee: string;
  status: string;
};

export const Members: React.FC = () => {
  const { t } = useI18n();
  const params = useParams();

  const userFromRoute = useMemo(() => {
    const raw = (params as Record<string, string | string[] | undefined>)[
      "user"
    ];
    return Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  }, [params]);

  const workspaceFromRoute = useMemo(() => {
    const raw = (params as Record<string, string | string[] | undefined>)[
      "workspace"
    ];
    return Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  }, [params]);

  const [workspace, setWorkspace] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState("");

  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem("workspace");
    const storedWorkspace = stored ? stored.replace(/"/g, "") : "";

    const nextWorkspace = workspaceFromRoute || storedWorkspace;
    setWorkspace(nextWorkspace);
  }, [workspaceFromRoute]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const usr = window.localStorage.getItem("users");
    const nextUser = usr ? usr.replace(/"/g, "") : "";
    queueMicrotask(() => setCurrentUser(nextUser));
  }, []);

  const refreshMembers = useCallback(async (nextWorkspace: string) => {
    if (!nextWorkspace) return;

    setMembersLoading(true);
    try {
      const res = await fetch("/api/get-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace: nextWorkspace }),
      });

      const data = (await res.json().catch(() => null)) as {
        users?: unknown;
      } | null;

      const users = Array.isArray(data?.users)
        ? (data.users as unknown[])
            .filter((u): u is string => typeof u === "string")
            .map((u) => u.trim())
            .filter(Boolean)
        : [];

      setMembers(users);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!workspace) return;
    void refreshMembers(workspace);
  }, [workspace, refreshMembers]);

  const refreshInvitations = useCallback(
    async (nextWorkspace: string) => {
      if (!nextWorkspace) return;
      if (!currentUser) return;

      setInvitationsLoading(true);
      try {
        const res = await fetch("/api/get-workspace-invitations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: currentUser,
            workspace: nextWorkspace,
          }),
        });

        if (!res.ok) {
          setInvitations([]);
          return;
        }

        const data = (await res.json().catch(() => null)) as {
          invitations?: unknown;
        } | null;

        const inv = Array.isArray(data?.invitations)
          ? (
              data?.invitations as Array<{
                id?: unknown;
                invitee?: unknown;
                status?: unknown;
              }>
            )
              .map((r) => ({
                id: typeof r.id === "number" ? r.id : Number(r.id),
                invitee: typeof r.invitee === "string" ? r.invitee : "",
                status: typeof r.status === "string" ? r.status : "",
              }))
              .filter((r) => Number.isFinite(r.id) && r.invitee && r.status)
          : [];

        setInvitations(inv);
      } catch {
        setInvitations([]);
      } finally {
        setInvitationsLoading(false);
      }
    },
    [currentUser],
  );

  useEffect(() => {
    if (!workspace) return;
    if (!currentUser) return;
    void refreshInvitations(workspace);
  }, [workspace, currentUser, refreshInvitations]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setErrorMessage(t("members.missingUsername"));
      return;
    }
    if (!workspace) {
      setErrorMessage(t("members.missingWorkspace"));
      return;
    }

    if (!currentUser) {
      setErrorMessage(t("firstWorkspace.sessionExpired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/invite-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviter: currentUser,
          username: trimmedUsername,
          workspace,
        }),
      });

      const data = (await res.json().catch(() => null)) as ApiMessage;
      const msg = typeof data?.message === "string" ? data.message : "";

      if (!res.ok) {
        setErrorMessage(msg || t("members.inviteFailed"));
        return;
      }

      setSuccessMessage(msg || t("members.inviteSuccess"));
      setUsername("");
      await refreshInvitations(workspace);
    } catch {
      setErrorMessage(t("members.networkError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleRemove = useCallback(
    async (memberName: string) => {
      setSuccessMessage("");
      setErrorMessage("");

      if (!workspace) {
        setErrorMessage(t("members.missingWorkspace"));
        return;
      }

      setRemovingUser(memberName);
      try {
        const res = await fetch("/api/delete-member", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: memberName, workspace }),
        });

        const data = (await res.json().catch(() => null)) as ApiMessage;
        const msg = typeof data?.message === "string" ? data.message : "";

        if (!res.ok) {
          setErrorMessage(msg || t("members.removeFailed"));
          return;
        }

        setSuccessMessage(msg || t("members.removeSuccess"));
        await refreshMembers(workspace);
      } catch {
        setErrorMessage(t("members.networkError"));
      } finally {
        setRemovingUser(null);
      }
    },
    [refreshMembers, t, workspace],
  );

  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-[#121212] flex body-text"
    >
      <section className="py-2 w-full">
        <main className="w-full min-h-[calc(100vh-16px)] border-y border-l rounded-l-xl border-[#2e2e2e] bg-[#181818] p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold text-white heading">
                {t("members.title")}
              </h1>
              <p className="text-xs text-white/60">
                {t("members.workspaceLabel")}:{" "}
                <span className="text-white/80">{workspace}</span>
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-[#2e2e2e] pt-4">
            <h2 className="text-xs font-semibold text-white/80">
              {t("members.addTitle")}
            </h2>
            <form
              className="mt-2 flex flex-col sm:flex-row gap-2"
              onSubmit={handleSubmit}
            >
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("members.usernamePh")}
                className="w-full sm:flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-white/20"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-2 text-xs text-white disabled:opacity-60"
              >
                {isSubmitting ? t("members.addingBtn") : t("members.addBtn")}
              </button>
            </form>

            {(successMessage || errorMessage) && (
              <div className="mt-2">
                {successMessage ? (
                  <p className="text-xs text-emerald-300">{successMessage}</p>
                ) : null}
                {errorMessage ? (
                  <p className="text-xs text-red-300">{errorMessage}</p>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-[#2e2e2e] pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-white/80">
                {t("members.invitationsTitle")}
              </h2>
              <button
                type="button"
                onClick={() => void refreshInvitations(workspace)}
                disabled={!workspace || invitationsLoading}
                className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 text-[11px] text-white/80 disabled:opacity-60"
              >
                {invitationsLoading
                  ? t("members.refreshingBtn")
                  : t("members.refreshBtn")}
              </button>
            </div>

            <div className="mt-2">
              {invitationsLoading ? (
                <p className="text-xs text-white/60">{t("members.loading")}</p>
              ) : invitations.length ? (
                <ul className="flex flex-col gap-2">
                  {invitations.map((inv) => {
                    const statusLabel =
                      inv.status === "accepted"
                        ? t("members.accepted")
                        : inv.status === "rejected"
                          ? t("members.rejected")
                          : t("members.pending");

                    const statusColor =
                      inv.status === "accepted"
                        ? "text-emerald-300"
                        : inv.status === "rejected"
                          ? "text-red-300"
                          : "text-white/60";

                    return (
                      <li
                        key={inv.id}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white flex items-center justify-between gap-3"
                      >
                        <span className="truncate">{inv.invitee}</span>
                        <span className={"text-[11px] " + statusColor}>
                          {statusLabel}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-white/60">—</p>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-[#2e2e2e] pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-white/80">
                {t("members.listTitle")}
              </h2>
              <button
                type="button"
                onClick={() => void refreshMembers(workspace)}
                disabled={!workspace || membersLoading}
                className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 text-[11px] text-white/80 disabled:opacity-60"
              >
                {membersLoading
                  ? t("members.refreshingBtn")
                  : t("members.refreshBtn")}
              </button>
            </div>

            <div className="mt-2">
              {membersLoading ? (
                <p className="text-xs text-white/60">{t("members.loading")}</p>
              ) : members.length ? (
                <ul className="flex flex-col gap-2">
                  {members.map((m) => (
                    <li
                      key={m}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white flex items-center justify-between gap-3"
                    >
                      <span className="truncate">{m}</span>
                      {m && m !== userFromRoute ? (
                        <button
                          type="button"
                          onClick={() => void handleRemove(m)}
                          disabled={removingUser === m}
                          className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 text-[11px] text-white/80 disabled:opacity-60"
                        >
                          {removingUser === m
                            ? t("members.removingBtn")
                            : t("members.removeBtn")}
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-white/60">{t("members.empty")}</p>
              )}
            </div>
          </div>
        </main>
      </section>
    </motion.div>
  );
};
