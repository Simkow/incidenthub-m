"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProjectIcon from "../../../../public/assets/project-icon.png";
import { useI18n } from "../../../i18n/I18nProvider";

type ProjectData = {
  workspace_name: string;
  description: string | null;
  due_date: string | null;
};

type WorkspaceRow = {
  id: number;
  workspace_name: string;
};

type TasksResponse = {
  tasks?: Array<{ id?: string | number }>;
};

export const Project: React.FC = () => {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [workspace, setWorkspace] = useState<string>("");
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);
  const [isWorkspaceOwner, setIsWorkspaceOwner] = useState<boolean>(false);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [draft, setDraft] = useState<ProjectData | null>(null);
  const [completionPct, setCompletionPct] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const saveTimeoutRef = useRef<number | null>(null);

  const isoToLocalInputValue = useCallback((iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }, []);

  const localInputValueToIso = useCallback((localValue: string) => {
    if (!localValue) return null;
    const d = new Date(localValue);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const usr = window.localStorage.getItem("users");
    const work = window.localStorage.getItem("workspace");

    const nextUser = usr ? usr.replace(/"/g, "") : "";
    const nextWorkspace = work ? work.replace(/"/g, "") : "";

    queueMicrotask(() => {
      setUsername(nextUser);
      setWorkspace(nextWorkspace);
    });
  }, []);

  const fetchProject = useCallback(async () => {
    if (!username || !workspace) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/get-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, workspace }),
      });

      if (!response.ok) {
        setProject(null);
        setError(t("project.failedLoad"));
        return;
      }

      const data = (await response.json()) as { project: ProjectData | null };
      const nextProject = data.project ?? null;
      setProject(nextProject);
      setDraft(nextProject);
    } catch (err) {
      console.error("Error fetching project", err);
      setProject(null);
      setDraft(null);
      setError(t("project.failedLoad"));
    } finally {
      setIsLoading(false);
    }
  }, [username, workspace, t]);

  const fetchWorkspaceId = useCallback(async () => {
    if (!username || !workspace) return;

    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: username }),
      });

      if (!res.ok) {
        setWorkspaceId(null);
        setIsWorkspaceOwner(false);
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        workspaces?: unknown;
        memberWorkspaces?: unknown;
      } | null;

      const ownedRows = Array.isArray(data?.workspaces)
        ? (data?.workspaces as unknown[])
            .map((w) => w as Partial<WorkspaceRow>)
            .filter(
              (w): w is WorkspaceRow =>
                typeof w.id === "number" &&
                typeof w.workspace_name === "string",
            )
        : [];

      const memberRows = Array.isArray(data?.memberWorkspaces)
        ? (data?.memberWorkspaces as unknown[])
            .map((w) => w as Partial<WorkspaceRow>)
            .filter(
              (w): w is WorkspaceRow =>
                typeof w.id === "number" &&
                typeof w.workspace_name === "string",
            )
        : [];

      const owned =
        ownedRows.find((w) => w.workspace_name === workspace) ?? null;
      if (owned) {
        setWorkspaceId(owned.id);
        setIsWorkspaceOwner(true);
        return;
      }

      const member =
        memberRows.find((w) => w.workspace_name === workspace) ?? null;
      if (member) {
        setWorkspaceId(null);
        setIsWorkspaceOwner(false);
        return;
      }

      setWorkspaceId(null);
      setIsWorkspaceOwner(false);
    } catch (err) {
      console.error("Error fetching workspace id", err);
      setWorkspaceId(null);
      setIsWorkspaceOwner(false);
    }
  }, [username, workspace]);

  const scheduleSave = useCallback(
    (nextDraft: ProjectData) => {
      if (!username || !workspaceId) return;

      const safeWorkspaceName = nextDraft.workspace_name.trim()
        ? nextDraft.workspace_name
        : "default title";

      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = window.setTimeout(async () => {
        try {
          const res = await fetch("/api/update-project", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: workspaceId,
              owner: username,
              workspace_name: safeWorkspaceName,
              description: nextDraft.description,
              due_date: nextDraft.due_date,
            }),
          });

          if (!res.ok) {
            const data = (await res.json().catch(() => null)) as {
              message?: string;
            } | null;
            console.error(
              "Failed to update project",
              data?.message ?? res.status,
            );
            return;
          }

          void fetchProject();
        } catch (err) {
          console.error("Error updating project", err);
        }
      }, 600);
    },
    [username, workspaceId, fetchProject],
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, []);

  const fetchCompletion = useCallback(async () => {
    if (!username || !workspace) return;

    try {
      const [activeRes, doneRes] = await Promise.all([
        fetch("/api/get-active-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, workspace }),
        }),
        fetch("/api/get-done-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, workspace }),
        }),
      ]);

      if (!activeRes.ok || !doneRes.ok) {
        setCompletionPct(0);
        return;
      }

      const active = (await activeRes.json()) as TasksResponse;
      const done = (await doneRes.json()) as TasksResponse;

      const activeCount = active.tasks?.length ?? 0;
      const doneCount = done.tasks?.length ?? 0;
      const total = activeCount + doneCount;
      const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
      setCompletionPct(pct);
    } catch (err) {
      console.error("Error fetching completion", err);
      setCompletionPct(0);
    }
  }, [username, workspace]);

  useEffect(() => {
    if (!username || !workspace) return;
    void fetchProject();
    void fetchCompletion();
    void fetchWorkspaceId();
  }, [username, workspace, fetchProject, fetchCompletion, fetchWorkspaceId]);

  const dueDateLabel = useMemo(() => {
    const raw = project?.due_date;
    if (!raw) return "—";
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return raw;

    const fmtLocale = locale === "pl" ? "pl-PL" : "en-US";
    return dt.toLocaleString(fmtLocale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: raw.includes("T") ? "2-digit" : undefined,
      minute: raw.includes("T") ? "2-digit" : undefined,
    });
  }, [project?.due_date, locale]);

  void dueDateLabel;

  const dueDateInputValue = useMemo(() => {
    return isoToLocalInputValue(draft?.due_date ?? null);
  }, [draft?.due_date, isoToLocalInputValue]);

  const clampedPct = useMemo(() => {
    if (completionPct < 0) return 0;
    if (completionPct > 100) return 100;
    return completionPct;
  }, [completionPct]);

  const handleDeleteWorkspace = useCallback(async () => {
    if (!username || !workspace) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/delete-workspace", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, workspace }),
      });

      const data = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!res.ok) {
        if (res.status === 403) {
          setDeleteError(t("project.onlyOwnerDelete"));
        } else {
          setDeleteError(data?.message ?? t("project.deleteFailed"));
        }
        return;
      }

      const nextRes = await fetch("/api/get-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const nextData = (await nextRes.json().catch(() => null)) as {
        workspace?: string | null;
      } | null;

      const nextWorkspace =
        typeof nextData?.workspace === "string" && nextData.workspace.trim()
          ? nextData.workspace
          : null;

      if (typeof window !== "undefined") {
        if (nextWorkspace) {
          window.localStorage.setItem("workspace", nextWorkspace);
        } else {
          window.localStorage.removeItem("workspace");
        }
      }

      if (nextWorkspace) {
        router.push(`/${username}/${nextWorkspace}/tasks`);
      } else {
        router.push("/first-workspace");
      }
    } catch (err) {
      console.error("Error deleting workspace", err);
      setDeleteError(t("project.internalError"));
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  }, [username, workspace, router, t]);

  return (
    <motion.main
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-[#121212] flex"
    >
      <section className="py-2 w-full">
        <main className="w-full md:min-h-full border-y border-l rounded-l-xl border-[#2e2e2e] bg-[#181818] flex flex-col items-center p-4 md:p-6 gap-6 text-white relative">
          <div className="pt-6 flex flex-col items-center gap-4 w-full max-w-3xl">
            <div className="flex items-center justify-center">
              <Image src={ProjectIcon} alt="Project" className="w-32" />
            </div>
            <div className="w-full flex flex-col gap-2">
              <div className="text-xs text-neutral-400 heading">
                {t("project.progressBar")}
              </div>
              <div className="w-full flex items-center gap-4">
                <div className="flex-1 h-2 rounded-full bg-[#2e2e2e] overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${clampedPct}%` }}
                  />
                </div>
                <div className="text-xs text-neutral-300 tabular-nums">
                  {clampedPct}%
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-3xl flex flex-col gap-5">
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs text-neutral-400 heading">
                {t("project.projectName")}
              </div>
              <div className="w-full max-w-sm rounded-xl border border-[#2e2e2e] bg-neutral-950/30 px-6 py-5 text-center">
                <input
                  value={draft?.workspace_name ?? ""}
                  spellCheck={false}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDraft((prev) => {
                      const base =
                        prev ??
                        ({
                          workspace_name: "",
                          description: null,
                          due_date: null,
                        } satisfies ProjectData);
                      const next = { ...base, workspace_name: value };
                      scheduleSave(next);
                      return next;
                    });
                  }}
                  placeholder={isLoading ? "Loading…" : ""}
                  className="w-full bg-transparent text-3xl font-semibold tracking-tight text-center outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-xs text-neutral-400 heading text-center">
                {t("project.description")}
              </div>
              <textarea
                value={draft?.description ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setDraft((prev) => {
                    const base =
                      prev ??
                      ({
                        workspace_name: "",
                        description: null,
                        due_date: null,
                      } satisfies ProjectData);
                    const next = { ...base, description: value };
                    scheduleSave(next);
                    return next;
                  });
                }}
                placeholder={
                  isLoading ? t("project.loading") : t("project.descriptionPh")
                }
                className="min-h-44 rounded-xl border border-[#2e2e2e] bg-neutral-950/30 px-5 py-4 text-sm text-neutral-200 whitespace-pre-wrap outline-none resize-none"
              />
            </div>

            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="text-xs text-neutral-400 heading">
                {t("project.dueDate")}
              </div>
              <div className="w-full max-w-xs rounded-xl border border-[#2e2e2e] bg-neutral-950/30 px-6 py-4 text-center text-sm tabular-nums">
                <input
                  type="datetime-local"
                  value={dueDateInputValue}
                  onClick={(e) => {
                    try {
                      (
                        e.currentTarget as HTMLInputElement & {
                          showPicker?: () => void;
                        }
                      ).showPicker?.();
                    } catch {
                      // ignore
                    }
                  }}
                  onChange={(e) => {
                    const iso = localInputValueToIso(e.target.value);
                    setDraft((prev) => {
                      const base =
                        prev ??
                        ({
                          workspace_name: "",
                          description: null,
                          due_date: null,
                        } satisfies ProjectData);
                      const next = { ...base, due_date: iso };
                      scheduleSave(next);
                      return next;
                    });
                  }}
                  className="w-full bg-transparent text-center outline-none"
                />
              </div>

              <div className="relative w-full max-w-xs flex flex-col items-center gap-2 pt-3">
                {isWorkspaceOwner ? (
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => {
                      setDeleteError(null);
                      setDeleteOpen((prev) => !prev);
                    }}
                    className="w-full rounded-xl border border-red-300/60 text-red-300 px-4 py-2 text-sm hover:bg-red-500/10 disabled:opacity-60"
                  >
                    {t("project.deleteWorkspace")}
                  </button>
                ) : (
                  <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-neutral-300 text-center">
                    {t("project.onlyOwnerDelete")}
                  </div>
                )}

                {isWorkspaceOwner && deleteOpen && (
                  <div
                    className="absolute top-full mt-2 w-full rounded-xl bg-neutral-950 border border-neutral-700 p-4 flex flex-col items-center gap-3 z-10"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-sm text-neutral-300 font-light text-center">
                      {t("project.deleteConfirm")}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => setDeleteOpen(false)}
                        className="border border-[#2e2e2e] text-sm text-neutral-300 py-1 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-60"
                      >
                        {t("project.cancel")}
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => void handleDeleteWorkspace()}
                        className="border border-red-300 text-sm text-red-300 py-1 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 hover:text-red-400 disabled:opacity-60"
                      >
                        {isDeleting
                          ? t("project.deleting")
                          : t("project.delete")}
                      </button>
                    </div>
                    {deleteError && (
                      <div className="text-xs text-red-300 text-center">
                        {deleteError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-300 border border-red-300/30 bg-red-950/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>
        </main>
      </section>
    </motion.main>
  );
};
