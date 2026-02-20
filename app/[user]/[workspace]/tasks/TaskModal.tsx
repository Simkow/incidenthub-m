"use client";

import * as Select from "@radix-ui/react-select";
import { AnimatePresence, motion } from "motion/react";

import { RoundedCheckbox } from "./RoundedCheckbox";
import type { Priority, Task } from "./types";

function isoToLocalInputValue(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function localInputValueToIso(localValue: string) {
  if (!localValue) return "";
  const d = new Date(localValue);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

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

export function TaskModal({ open, task, priorities, onClose, onUpdate }: Props) {
  return (
    <AnimatePresence>
      {open &&
        (() => {
          const selectPriorityValue =
            task && priorities.includes(task.priority as Priority)
              ? (task.priority as Priority)
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
                        onChange={(e) => onUpdate(task.id, "title", e.target.value)}
                        className="bg-transparent text-sm rounded-lg border border-[#2e2e2e] px-3 py-2 focus:outline-none focus:border-neutral-300"
                      />
                    </section>

                    <section className="md:col-span-2 flex flex-col gap-1">
                      <span className="text-xs text-neutral-400">Description</span>
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
                          <Select.Icon className="text-neutral-400">▾</Select.Icon>
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
                        type="datetime-local"
                        value={isoToLocalInputValue(task.due_date)}
                        onChange={(e) =>
                          onUpdate(
                            task.id,
                            "due_date",
                            localInputValueToIso(e.target.value),
                          )
                        }
                        className="bg-transparent text-sm rounded-lg border border-[#2e2e2e] px-3 py-2 focus:outline-none focus:border-neutral-300"
                      />
                    </section>

                    <section className="flex flex-col gap-1">
                      <span className="text-xs text-neutral-400">Assignee</span>
                      <input
                        value={String(task.assignee)}
                        onChange={(e) =>
                          onUpdate(task.id, "assignee", e.target.value)
                        }
                        className="bg-transparent text-sm rounded-lg border border-[#2e2e2e] px-3 py-2 focus:outline-none focus:border-neutral-300"
                      />
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
                        onCheckedChange={(next) =>
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
