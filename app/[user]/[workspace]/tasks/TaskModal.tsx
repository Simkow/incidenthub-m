"use client";

import { useEffect, useMemo, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { AnimatePresence, motion } from "motion/react";
import type { Priority, Task } from "./types";
import { RoundedCheckbox } from "./RoundedCheckbox";
import { dateInputToDateOnly, toDateInputValue } from "./dateTime";

type Props = {
  open: boolean;
  task: Task | null;
  priorities: Priority[];
  onClose: () => void;
  onUpdate: <K extends keyof Task>(
    taskId: Task["id"],
    key: K,
    value: Task[K],
  ) => void;
};

export function TaskModal({
  open,
  task,
  priorities,
  onClose,
  onUpdate,
}: Props) {
  const workspaceForUsers = useMemo(() => {
    if (!task?.workspace_name) {
      if (typeof window === "undefined") return "";
      const stored = window.localStorage.getItem("workspace");
      return stored ? stored.replace(/"/g, "") : "";
    }
    return task.workspace_name;
  }, [task?.workspace_name]);

  const [assigneeOptions, setAssigneeOptions] = useState<string[]>([]);
  const [assigneeLoading, setAssigneeLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!workspaceForUsers) {
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
          body: JSON.stringify({ workspace: workspaceForUsers }),
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

        const current = task?.assignee ? String(task.assignee) : "";
        const options = [...users];
        if (current && !options.includes(current)) options.unshift(current);

        if (cancelled) return;
        setAssigneeOptions(options);
      } catch {
        if (cancelled) return;
        setAssigneeOptions(task?.assignee ? [String(task.assignee)] : []);
      } finally {
        if (cancelled) return;
        setAssigneeLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, workspaceForUsers, task?.assignee]);

  return (
    <AnimatePresence>
      {open &&
        (() => {
          const selectPriorityValue =
            task && priorities.includes(task.priority as Priority)
              ? (task.priority as Priority)
              : ("" as const);

          const selectAssigneeValue =
            task && assigneeOptions.includes(String(task.assignee))
              ? String(task.assignee)
              : ("" as const);

          return (
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
              }}
            >
              <motion.div
                key="modal"
                initial={{ opacity: 0, filter: "blur(10px)", scale: 0.98 }}
                animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                exit={{ opacity: 0, filter: "blur(10px)", scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="w-[92vw] max-w-3xl rounded-xl bg-[#181818] border border-[#2e2e2e] text-white"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e2e2e]">
                  <h2 className="text-sm">Task details</h2>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs px-2 py-1 rounded-lg border border-[#2e2e2e] hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>

                {task && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <section className="md:col-span-2 flex flex-col gap-1">
                      <span className="text-xs text-neutral-400">Title</span>
                      <input
                        value={task.title}
                        onChange={(e) =>
                          onUpdate(task.id, "title", e.target.value)
                        }
                        className="bg-transparent text-sm rounded-lg border border-[#2e2e2e] px-3 py-2 focus:outline-none focus:border-neutral-300"
                      />
                    </section>

                    <section className="md:col-span-2 flex flex-col gap-1">
                      <span className="text-xs text-neutral-400">
                        Description
                      </span>
                      <textarea
                        value={task.description}
                        onChange={(e) =>
                          onUpdate(task.id, "description", e.target.value)
                        }
                        className="bg-transparent text-sm rounded-lg border border-[#2e2e2e] px-3 py-2 h-32 resize-none focus:outline-none focus:border-neutral-300"
                      />
                    </section>

                    <section className="flex flex-col gap-1">
                      <span className="text-xs text-neutral-400">Priority</span>
                      <Select.Root
                        value={selectPriorityValue}
                        onValueChange={(value) =>
                          onUpdate(task.id, "priority", value)
                        }
                      >
                        <Select.Trigger className="text-neutral-200 text-sm rounded-lg border border-[#2e2e2e] px-3 py-2 w-full flex items-center justify-between bg-transparent focus:outline-none focus:border-neutral-300 hover:cursor-pointer">
                          <Select.Value placeholder="Priority" />
                          <Select.Icon className="text-neutral-400">
                            ▾
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content
                            position="popper"
                            sideOffset={6}
                            className="z-50 overflow-hidden rounded-md border border-[#2e2e2e] bg-[#181818]"
                          >
                            <Select.Viewport className="p-1">
                              {priorities.map((p) => (
                                <Select.Item
                                  key={p}
                                  value={p}
                                  className="text-xs select-none rounded px-2 py-2 text-white outline-none data-highlighted:bg-white/10 data-state=checked:bg-white/10"
                                >
                                  <Select.ItemText>{p}</Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </section>

                    <section className="flex flex-col gap-1">
                      <span className="text-xs text-neutral-400">Due date</span>
                      <input
                        type="date"
                        value={toDateInputValue(task.due_date)}
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
                        onChange={(e) =>
                          onUpdate(
                            task.id,
                            "due_date",
                            dateInputToDateOnly(e.target.value),
                          )
                        }
                        className="bg-transparent text-sm rounded-lg border border-[#2e2e2e] px-3 py-2 focus:outline-none focus:border-neutral-300"
                      />
                    </section>

                    <section className="flex flex-col gap-1">
                      <span className="text-xs text-neutral-400">Assignee</span>
                      <Select.Root
                        value={selectAssigneeValue}
                        onValueChange={(value) =>
                          onUpdate(task.id, "assignee", value)
                        }
                        disabled={
                          assigneeLoading || assigneeOptions.length === 0
                        }
                      >
                        <Select.Trigger className="text-neutral-200 text-sm rounded-lg border border-[#2e2e2e] px-3 py-2 w-full flex items-center justify-between bg-transparent focus:outline-none focus:border-neutral-300 hover:cursor-pointer disabled:opacity-60">
                          <Select.Value
                            placeholder={
                              assigneeLoading ? "Loading..." : "Assignee"
                            }
                          />
                          <Select.Icon className="text-neutral-400">
                            ▾
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content
                            position="popper"
                            sideOffset={6}
                            className="z-50 overflow-hidden rounded-md border border-[#2e2e2e] bg-[#181818]"
                          >
                            <Select.Viewport className="p-1">
                              {assigneeOptions.map((name) => (
                                <Select.Item
                                  key={name}
                                  value={name}
                                  className="text-xs select-none rounded px-2 py-2 text-white outline-none data-highlighted:bg-white/10 data-state=checked:bg-white/10"
                                >
                                  <Select.ItemText>{name}</Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </section>

                    <section className="md:col-span-2 flex items-center justify-between rounded-lg border border-[#2e2e2e] px-3 py-3">
                      <div>
                        <div className="text-sm">Finished</div>
                        <div className="text-xs text-neutral-400">
                          Mark task as finished
                        </div>
                      </div>
                      <RoundedCheckbox
                        checked={task.is_finished}
                        onCheckedChange={(next: boolean) =>
                          onUpdate(task.id, "is_finished", next)
                        }
                        ariaLabel="Mark task as finished"
                      />
                    </section>
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
    </AnimatePresence>
  );
}
