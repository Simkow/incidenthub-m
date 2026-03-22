"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { TaskModal } from "./TaskModal";
import { RoundedCheckbox } from "./RoundedCheckbox";
import { useParams } from "next/navigation";
import { useWsPortalContainer } from "./useWsPortalContainer";
import { useI18n } from "../../../i18n/I18nProvider";
import { motion } from "motion/react";

import type { Priority, Task } from "./types";
import { dateInputToDateOnly, toDateInputValue } from "./dateTime";

type Props = {
  search?: string;
  scope?: "workspace" | "user";
};

export default function DoneTaskSection({
  search = "",
  scope = "workspace",
}: Props) {
  const { t } = useI18n();
  const params = useParams();
  const portalContainer = useWsPortalContainer();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [username, setUsername] = useState("");
  const workspace = useMemo(() => {
    const raw = (params as Record<string, string | string[] | undefined>)[
      "workspace"
    ];
    return Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  }, [params]);
  const [activeTaskId, setActiveTaskId] = useState<Task["id"] | null>(null);
  const [openActionMenuTaskId, setOpenActionMenuTaskId] = useState<
    Task["id"] | null
  >(null);
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<
    Task["id"] | null
  >(null);

  const [assigneeOptions, setAssigneeOptions] = useState<string[]>([]);
  const [assigneeLoading, setAssigneeLoading] = useState(false);
  const [assigneeRefreshNonce, setAssigneeRefreshNonce] = useState(0);

  const priorityOptions = useMemo<Priority[]>(
    () => ["Light", "Medium", "High", "Urgent"],
    [],
  );

  useEffect(() => {
    if (activeTaskId !== null) {
      window.scrollTo({ top: 72, behavior: "smooth" });
    }
  }, [activeTaskId]);

  useEffect(() => {
    if (openActionMenuTaskId === null) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const clickedInMenu = !!target.closest("[data-task-action-menu]");
      const clickedMenuTrigger = !!target.closest("[data-task-action-trigger]");

      if (!clickedInMenu && !clickedMenuTrigger) {
        setOpenActionMenuTaskId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [openActionMenuTaskId]);

  const saveTimeoutsRef = useRef(new Map<Task["id"], number>());

  const scheduleSave = useCallback((task: Task) => {
    const prev = saveTimeoutsRef.current.get(task.id);
    if (prev) window.clearTimeout(prev);

    const timeoutId = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/update-task", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            due_date: task.due_date,
            assignee: task.assignee,
            is_finished: task.is_finished,
          }),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            message?: string;
          } | null;
          console.error("Failed to update task", data?.message ?? res.status);
        } else if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("tasks:refresh"));
        }
      } catch (error) {
        console.error("Error updating task", error);
      }
    }, 600);

    saveTimeoutsRef.current.set(task.id, timeoutId);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setAssigneeRefreshNonce((n) => n + 1);
    window.addEventListener("workspace-users:refresh", handler);
    return () => window.removeEventListener("workspace-users:refresh", handler);
  }, []);

  useEffect(() => {
    if (!workspace) {
      setAssigneeOptions([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setAssigneeLoading(true);
      try {
        const res = await fetch("/api/get-workspace-users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspace }),
        });

        const data = (await res.json().catch(() => null)) as {
          users?: unknown;
        } | null;

        const users = Array.isArray(data?.users)
          ? (data?.users as unknown[])
              .filter((u): u is string => typeof u === "string")
              .map((u) => u.trim())
              .filter(Boolean)
          : [];

        if (cancelled) return;
        setAssigneeOptions(users);
      } catch {
        if (cancelled) return;
        setAssigneeOptions([]);
      } finally {
        if (cancelled) return;
        setAssigneeLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workspace, assigneeRefreshNonce]);

  useEffect(() => {
    const timeouts = saveTimeoutsRef.current;
    return () => {
      for (const id of timeouts.values()) {
        window.clearTimeout(id);
      }
      timeouts.clear();
    };
  }, []);

  const updateTask = <K extends keyof Task>(
    taskId: Task["id"],
    key: K,
    value: Task[K],
  ) => {
    setTasks((prev) => {
      let updated: Task | null = null;
      const next = prev.map((t) => {
        if (t.id !== taskId) return t;
        updated = { ...t, [key]: value };
        return updated;
      });

      if (updated) scheduleSave(updated);
      return next;
    });
  };

  const handleDelete = async (taskId: Task["id"]) => {
    const snapshot = tasks;

    setTasks(snapshot.filter((t) => t.id !== taskId));
    if (activeTaskId === taskId) setActiveTaskId(null);
    if (deleteConfirmTaskId === taskId) setDeleteConfirmTaskId(null);

    try {
      const res = await fetch("/api/delete-task", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });

      if (!res.ok) {
        setTasks(snapshot);
        return;
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tasks:refresh"));
      }
    } catch (error) {
      console.error("Error deleting task", error);
      setTasks(snapshot);
    }
  };

  const activeTask =
    activeTaskId === null
      ? null
      : (tasks.find((t) => t.id === activeTaskId) ?? null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const usr = window.localStorage.getItem("users");
    if (usr) {
      const nextUser = usr.replace(/"/g, "");
      queueMicrotask(() => setUsername(nextUser));
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!username) return;
    if (scope === "workspace" && !workspace) return;

    try {
      const response = await fetch("/api/get-done-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          scope === "workspace" ? { username, workspace } : { username },
        ),
      });
      const data = (await response.json()) as { tasks?: Task[] };
      setTasks(data.tasks ?? []);
    } catch (error) {
      console.error("Error fetching tasks", error);
    }
  }, [username, workspace, scope]);

  useEffect(() => {
    if (!username) return;
    if (scope === "workspace" && !workspace) return;
    queueMicrotask(() => {
      void fetchTasks();
    });
  }, [username, workspace, fetchTasks, scope]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = () => {
      void fetchTasks();
    };

    window.addEventListener("tasks:refresh", handler);
    return () => window.removeEventListener("tasks:refresh", handler);
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;

    return tasks.filter((t) => {
      const haystack =
        `${t.title} ${t.description} ${t.assignee}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [tasks, search]);

  const groupedTasks = useMemo(() => {
    if (scope !== "user")
      return [] as Array<{ key: string; label: string; tasks: Task[] }>;

    const groups = new Map<
      string,
      { key: string; label: string; tasks: Task[] }
    >();
    for (const task of filteredTasks) {
      const labelRaw = (task as Task & { workspace_name?: unknown })
        .workspace_name;
      const label =
        typeof labelRaw === "string" && labelRaw.trim()
          ? labelRaw
          : "No workspace";
      const key = label;

      const existing = groups.get(key);
      if (existing) {
        existing.tasks.push(task);
      } else {
        groups.set(key, { key, label, tasks: [task] });
      }
    }

    return Array.from(groups.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );
  }, [filteredTasks, scope]);

  const renderTaskRow = (task: Task) => {
    const isActionMenuOpen = openActionMenuTaskId === task.id;
    const priorityLabel = task.priority || "Light";
    const priorityTone =
      priorityLabel === "Urgent"
        ? "border-red-400/40 bg-red-500/10 text-(--ws-fg-muted)"
        : priorityLabel === "High"
          ? "border-amber-400/40 bg-amber-500/10 text-(--ws-fg-muted)"
          : priorityLabel === "Medium"
            ? "border-sky-400/40 bg-sky-500/10 text-(--ws-fg-muted)"
            : "border-emerald-400/40 bg-emerald-500/10 text-(--ws-fg-muted)";

    return (
      <motion.section
        initial={{ opacity: 0, filter: "blur(10px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.4 }}
        key={task.id}
        className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] body-text items-center gap-3 rounded-xl border border-(--ws-border) bg-(--ws-surface-2) hover:bg-(--ws-hover) px-4 py-3 cursor-pointer transition-colors"
        role="button"
        tabIndex={0}
        aria-label={`${t("tasks.openDetails")} - ${task.title}`}
        onClick={() => setActiveTaskId(task.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setActiveTaskId(task.id);
        }}
      >
        <div className="min-w-0 w-full flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div
              className="min-w-0 w-full max-w-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                value={task.title}
                onChange={(e) => updateTask(task.id, "title", e.target.value)}
                className="min-w-0 w-full bg-transparent text-sm text-(--ws-fg) rounded-lg border border-(--ws-border) px-2.5 py-1.5 focus:outline-none"
                placeholder={t("tasks.title")}
              />
            </div>

            <span
              className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium ${priorityTone}`}
              aria-label={`${t("tasks.priority")}: ${priorityLabel}`}
            >
              {priorityLabel}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTaskId(task.id);
              }}
              className="shrink-0 rounded-lg border border-(--ws-border) px-2 py-1 text-xs text-(--ws-fg-muted) hover:bg-(--ws-hover)"
            >
              {t("tasks.openDetails")}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
              <input
                type="date"
                value={toDateInputValue(task.due_date)}
                onChange={(e) =>
                  updateTask(
                    task.id,
                    "due_date",
                    dateInputToDateOnly(e.target.value),
                  )
                }
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    (
                      e.currentTarget as HTMLInputElement & {
                        showPicker?: () => void;
                      }
                    ).showPicker?.();
                  } catch {
                    // ignore: some browsers require strict user-gesture activation
                  }
                }}
                className="min-w-0 w-full bg-transparent text-sm text-(--ws-fg-muted) rounded-lg border border-(--ws-border) px-2.5 py-1.5 focus:outline-none no-date-icon"
              />
            </div>

            <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
              <Select.Root
                value={(() => {
                  const current = String(task.assignee ?? "");
                  const options = assigneeOptions.includes(current)
                    ? assigneeOptions
                    : current
                      ? [current, ...assigneeOptions]
                      : assigneeOptions;
                  return options.includes(current) ? current : ("" as const);
                })()}
                onValueChange={(value) =>
                  updateTask(task.id, "assignee", value)
                }
                disabled={assigneeLoading || assigneeOptions.length === 0}
              >
                <Select.Trigger className="min-w-0 w-full bg-transparent text-sm text-(--ws-fg-muted) rounded-lg border border-(--ws-border) px-2.5 py-1.5 flex items-center justify-between focus:outline-none disabled:opacity-60">
                  <Select.Value
                    placeholder={
                      assigneeLoading
                        ? t("tasks.assigneeLoading")
                        : t("tasks.assignee")
                    }
                  />
                  <Select.Icon className="text-(--ws-fg-muted)">v</Select.Icon>
                </Select.Trigger>
                <Select.Portal container={portalContainer ?? undefined}>
                  <Select.Content
                    position="popper"
                    sideOffset={6}
                    className="z-50 overflow-hidden rounded-md border border-(--ws-border) bg-(--ws-surface)"
                  >
                    <Select.Viewport className="p-1">
                      {(() => {
                        const current = String(task.assignee ?? "");
                        const merged = assigneeOptions.includes(current)
                          ? assigneeOptions
                          : current
                            ? [current, ...assigneeOptions]
                            : assigneeOptions;
                        return merged;
                      })().map((name) => (
                        <Select.Item
                          key={name}
                          value={name}
                          className="text-xs select-none rounded px-2 py-2 text-(--ws-fg) outline-none data-highlighted:bg-(--ws-hover) data-[state=checked]:bg-(--ws-hover)"
                        >
                          <Select.ItemText>{name}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>

          <div className="text-[11px] text-(--ws-fg-muted)">
            {t("tasks.openDetailsHint")}
          </div>
        </div>

        <div
          className="relative flex items-center gap-2 md:self-stretch md:justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 rounded-lg border border-(--ws-border) bg-(--ws-surface) px-2 py-1">
            <RoundedCheckbox
              checked={task.is_finished}
              onCheckedChange={(next) =>
                updateTask(task.id, "is_finished", next)
              }
              ariaLabel="Mark task as finished"
              stopPropagation
              className="scale-125"
            />
            <span className="text-xs text-(--ws-fg-muted)">
              {task.is_finished ? t("tasks.done") : t("tasks.active")}
            </span>
          </div>

          <button
            type="button"
            aria-label="Open task actions"
            data-task-action-trigger
            onClick={(e) => {
              e.stopPropagation();
              setOpenActionMenuTaskId((prev) =>
                prev === task.id ? null : task.id,
              );
            }}
            className="h-8 w-8 rounded-lg border border-(--ws-border) text-(--ws-fg-muted) hover:bg-(--ws-hover) text-sm"
          >
            ...
          </button>

          {isActionMenuOpen ? (
            <div
              data-task-action-menu
              className="absolute right-0 top-10 z-20 w-32 rounded-lg border border-(--ws-border) bg-(--ws-surface) p-1 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenActionMenuTaskId(null);
                  setActiveTaskId(task.id);
                }}
                className="w-full rounded-md px-2 py-1.5 text-left text-xs text-(--ws-fg-muted) hover:bg-(--ws-hover)"
              >
                {t("tasks.edit")}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenActionMenuTaskId(null);
                  setDeleteConfirmTaskId((prev) =>
                    prev === task.id ? null : task.id,
                  );
                }}
                className="w-full rounded-md px-2 py-1.5 text-left text-xs text-red-300 hover:bg-(--ws-hover)"
              >
                {t("tasks.delete")}
              </button>
            </div>
          ) : null}

          <div
            className={`${deleteConfirmTaskId === task.id ? "flex" : "hidden"} w-44 max-w-[calc(100vw-2rem)] h-28 rounded-xl bg-(--ws-surface) border border-(--ws-border) absolute flex-col items-center justify-center p-4 backdrop-blur-sm`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span className="text-xs text-(--ws-fg-muted) font-light text-center">
              {t("tasks.deleteConfirm")}
            </span>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmTaskId(null);
                }}
                className="border border-(--ws-border) text-xs text-(--ws-fg-muted) py-1 px-3 rounded-lg bg-(--ws-surface-2) hover:bg-(--ws-hover)"
              >
                {t("tasks.cancel")}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDelete(task.id);
                }}
                className="border border-red-300 text-xs text-red-300 py-1 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 hover:text-red-400"
              >
                {t("tasks.delete")}
              </button>
            </div>
          </div>
        </div>
      </motion.section>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.4 }}
      className="relative w-full min-h-125 flex flex-col justify-start gap-2"
    >
      <div className="mt-2 flex flex-col gap-3">
        {tasks.length < 1 ? (
          <div className="text-(--ws-fg-muted) text-sm flex items-center justify-center mt-3">
            No done tasks
          </div>
        ) : filteredTasks.length < 1 ? (
          <div className="text-(--ws-fg-muted) text-sm flex items-center justify-center mt-3">
            No results
          </div>
        ) : (
          ""
        )}

        {scope === "user"
          ? groupedTasks.map((group) => (
              <div key={group.key} className="flex flex-col gap-3">
                <div className="px-3 pt-3 text-xs text-(--ws-fg-muted)">
                  Workspace: <span className="opacity-90">{group.label}</span>
                </div>
                {group.tasks.map(renderTaskRow)}
              </div>
            ))
          : filteredTasks.map(renderTaskRow)}
      </div>

      <TaskModal
        open={activeTaskId !== null}
        task={activeTask}
        priorities={priorityOptions}
        onClose={() => setActiveTaskId(null)}
        onUpdate={updateTask}
      />
    </motion.div>
  );
}
