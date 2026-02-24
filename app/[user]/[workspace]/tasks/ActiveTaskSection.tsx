"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { TaskModal } from "./TaskModal";
import { AddTaskModal } from "./AddTaskModal";
import { RoundedCheckbox } from "./RoundedCheckbox";
import { useWsPortalContainer } from "./useWsPortalContainer";
import Image from "next/image";
import Plus from "../../../../public/assets/plus.png";
import { useParams } from "next/navigation";

import type { Priority, Task } from "./types";
import { dateInputToDateOnly, toDateInputValue } from "./dateTime";

type Props = {
  search?: string;
  scope?: "workspace" | "user";
};

export default function ActiveTaskSection({
  search = "",
  scope = "workspace",
}: Props) {
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
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<
    Task["id"] | null
  >(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [assigneeOptions, setAssigneeOptions] = useState<string[]>([]);
  const [assigneeLoading, setAssigneeLoading] = useState(false);

  const plusIcon = Plus;

  const priorityOptions = useMemo<Priority[]>(
    () => ["Light", "Medium", "High", "Urgent"],
    [],
  );

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
  }, [workspace]);

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
      const response = await fetch("/api/get-active-task", {
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
    const selectPriorityValue = priorityOptions.includes(
      task.priority as Priority,
    )
      ? (task.priority as Priority)
      : ("" as const);

    return (
      <section
        key={task.id}
        className="grid grid-cols-1 md:grid-cols-7 items-center gap-y-2 md:gap-y-0 md:gap-x-5 rounded-lg bg-[color:var(--ws-surface-2)] hover:bg-[color:var(--ws-hover)] px-3 py-2"
        role="button"
        tabIndex={0}
        onClick={() => setActiveTaskId(task.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setActiveTaskId(task.id);
        }}
      >
        <input
          value={task.title}
          onChange={(e) => updateTask(task.id, "title", e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="min-w-0 w-full bg-transparent text-sm text-[color:var(--ws-fg)] rounded-lg border border-[color:var(--ws-border)] px-2 py-1 focus:outline-none"
          placeholder="Title"
        />

        <input
          value={task.description}
          onChange={(e) => updateTask(task.id, "description", e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="min-w-0 w-full bg-transparent text-sm text-[color:var(--ws-fg-muted)] rounded-lg border border-[color:var(--ws-border)] px-2 py-1 focus:outline-none"
          placeholder="Description"
        />

        <div className="min-w-0 w-full" onClick={(e) => e.stopPropagation()}>
          <Select.Root
            value={selectPriorityValue}
            onValueChange={(value) => updateTask(task.id, "priority", value)}
          >
            <Select.Trigger className="text-[color:var(--ws-fg-muted)] text-sm rounded-lg border border-[color:var(--ws-border)] px-2 py-1 w-full flex items-center justify-between bg-transparent focus:outline-none hover:cursor-pointer">
              <Select.Value placeholder="Priority" />
              <Select.Icon className="text-[color:var(--ws-fg-muted)]">
                ▾
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal container={portalContainer ?? undefined}>
              <Select.Content
                position="popper"
                sideOffset={6}
                className="z-50 overflow-hidden rounded-md border border-[color:var(--ws-border)] bg-[color:var(--ws-surface)] hover:cursor-pointer"
              >
                <Select.Viewport className="p-1">
                  {priorityOptions.map((p) => (
                    <Select.Item
                      key={p}
                      value={p}
                      className="text-xs select-none rounded px-2 py-2 text-[color:var(--ws-fg)] outline-none data-[highlighted]:bg-[color:var(--ws-hover)] data-[state=checked]:bg-[color:var(--ws-hover)]"
                    >
                      <Select.ItemText>{p}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        <input
          type="date"
          value={toDateInputValue(task.due_date)}
          onChange={(e) =>
            updateTask(task.id, "due_date", dateInputToDateOnly(e.target.value))
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
          className="min-w-0 w-full bg-transparent text-sm text-[color:var(--ws-fg-muted)] rounded-lg border border-[color:var(--ws-border)] px-2 py-1 focus:outline-none"
        />

        <div className="min-w-0 w-full" onClick={(e) => e.stopPropagation()}>
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
            onValueChange={(value) => updateTask(task.id, "assignee", value)}
            disabled={assigneeLoading || assigneeOptions.length === 0}
          >
            <Select.Trigger className="text-[color:var(--ws-fg-muted)] text-sm rounded-lg border border-[color:var(--ws-border)] px-2 py-1 w-full flex items-center justify-between bg-transparent focus:outline-none hover:cursor-pointer disabled:opacity-60">
              <Select.Value
                placeholder={assigneeLoading ? "Loading..." : "Assignee"}
              />
              <Select.Icon className="text-[color:var(--ws-fg-muted)]">
                ▾
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal container={portalContainer ?? undefined}>
              <Select.Content
                position="popper"
                sideOffset={6}
                className="z-50 overflow-hidden rounded-md border border-[color:var(--ws-border)] bg-[color:var(--ws-surface)] hover:cursor-pointer"
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
                      className="text-xs select-none rounded px-2 py-2 text-[color:var(--ws-fg)] outline-none data-[highlighted]:bg-[color:var(--ws-hover)] data-[state=checked]:bg-[color:var(--ws-hover)]"
                    >
                      <Select.ItemText>{name}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        <div className="flex items-center justify-center">
          <RoundedCheckbox
            checked={task.is_finished}
            onCheckedChange={(next) => updateTask(task.id, "is_finished", next)}
            ariaLabel="Mark task as finished"
            stopPropagation
          />
        </div>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirmTaskId((prev) =>
                prev === task.id ? null : task.id,
              );
            }}
            className="text-xs px-2 py-1 rounded-lg border text-red-300 border-[color:var(--ws-border)] hover:bg-[color:var(--ws-hover)]"
          >
            Delete
          </button>

          <div
            className={`${deleteConfirmTaskId === task.id ? "flex" : "hidden"} w-64 max-w-[calc(100vw-2rem)] h-28 rounded-xl bg-[color:var(--ws-surface)] border border-[color:var(--ws-border)] absolute mt-40 left-1/2 -translate-x-1/2 flex-col items-center justify-center p-4`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span className="text-sm text-[color:var(--ws-fg-muted)] font-light text-center">
              Are you sure to <br /> delete this task?
            </span>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmTaskId(null);
                }}
                className="border border-[color:var(--ws-border)] text-sm text-[color:var(--ws-fg-muted)] py-1 px-3 rounded-lg bg-[color:var(--ws-surface-2)] hover:bg-[color:var(--ws-hover)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDelete(task.id);
                }}
                className="border border-red-300 text-sm text-red-300 py-1 px-3 rounded-lg bg-[color:var(--ws-surface-2)] hover:bg-[color:var(--ws-hover)] hover:text-red-400"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="relative w-full min-h-125 flex flex-col justify-start gap-2">
      <div className="hidden md:grid grid-cols-7 items-center gap-x-5 px-3 pt-2 text-xs font-medium text-[color:var(--ws-fg-muted)]">
        <span className="text-left">Title</span>
        <span className="text-left">Description</span>
        <span className="text-center">Priority</span>
        <span className="text-center">Due Date</span>
        <span className="text-center">Assignee</span>
        <span className="text-center">Finished</span>
        <span className="text-center">Delete</span>
      </div>

      <div className="mt-2 flex flex-col gap-3">
        {tasks.length < 1 ? (
          <div className="text-[color:var(--ws-fg-muted)] text-sm flex items-center gap-3 justify-center mt-3">
            <span className="text-base">Add first task</span>
            <button
              type="button"
              onClick={() => {
                setSubmitMessage(null);
                setSubmitError(null);
                setIsAddOpen(true);
              }}
              className="px-2 py-1 rounded-lg border border-[color:var(--ws-border)] hover:bg-[color:var(--ws-hover)] group hover:cursor-pointer"
            >
              <Image
                src={plusIcon}
                alt="icon"
                className="ws-icon w-4 h-4 group-hover:scale-115 transition-all"
              />
            </button>
            {submitMessage && (
              <span className="text-xs text-[color:var(--ws-fg-muted)]">
                {submitMessage}
              </span>
            )}
            {submitError && (
              <span className="text-xs text-red-400">{submitError}</span>
            )}

            <AddTaskModal
              open={isAddOpen}
              onClose={() => setIsAddOpen(false)}
              workspace={workspace}
              createdBy={username}
              onSuccessMessage={(m) => setSubmitMessage(m || null)}
              onErrorMessage={(m) => setSubmitError(m || null)}
            />
          </div>
        ) : filteredTasks.length < 1 ? (
          <div className="text-neutral-400 text-sm flex items-center justify-center mt-3">
            No results
          </div>
        ) : (
          ""
        )}
        {scope === "user"
          ? groupedTasks.map((group) => (
              <div key={group.key} className="flex flex-col gap-3">
                <div className="px-3 pt-3 text-xs text-neutral-400">
                  Workspace:{" "}
                  <span className="text-neutral-200">{group.label}</span>
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
    </div>
  );
}
