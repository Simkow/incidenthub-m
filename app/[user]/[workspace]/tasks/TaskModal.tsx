"use client";

import { useEffect, useMemo, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { AnimatePresence, motion } from "motion/react";
import type { Priority, Task } from "./types";
import { RoundedCheckbox } from "./RoundedCheckbox";
import { dateInputToDateOnly, toDateInputValue } from "./dateTime";
import { useWsPortalContainer } from "./useWsPortalContainer";
import { useI18n } from "../../../i18n/I18nProvider";
import Enhance from "../../../../public/assets/enhance.png";
import Image from "next/image";
import {
  DEFAULT_TASK_STATUS_OPTIONS,
  DONE_STATUS_ID,
  TODO_STATUS_ID,
  formatTaskStatusName,
  statusNameToDone,
} from "./statusOptions";

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
  onStatusChange: (taskId: Task["id"], statusId: number) => Promise<void>;
};

export function TaskModal({
  open,
  task,
  priorities,
  onClose,
  onUpdate,
  onStatusChange,
}: Props) {
  const { t } = useI18n();
  const portalContainer = useWsPortalContainer();
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
  const [assigneeRefreshNonce, setAssigneeRefreshNonce] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setAssigneeRefreshNonce((n) => n + 1);
    window.addEventListener("workspace-users:refresh", handler);
    return () => window.removeEventListener("workspace-users:refresh", handler);
  }, []);

  const statusOptions = DEFAULT_TASK_STATUS_OPTIONS;

  const submitStatusChange = async (statusId: number) => {
    if (!task) return;

    try {
      await onStatusChange(task.id, statusId);
    } catch (error) {
      console.error("Failed to update task status:", error);
      alert(
        t("tasks.updateStatusFailed", {
          message: error instanceof Error ? error.message : "Unknown error",
        }),
      );
    }
  };

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
  }, [open, workspaceForUsers, task?.assignee, assigneeRefreshNonce]);

  const enhanceDescription = async () => {
    if (!task) return;

    const currentDescription = String(task.description ?? "").trim();
    if (!currentDescription) {
      alert(t("tasks.enhanceDescriptionEmpty"));
      return;
    }

    try {
      setIsEnhancing(true);

      const res = await fetch("/api/enhance-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: currentDescription,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          message?: unknown;
        } | null;
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : `Request failed with status ${res.status}`,
        );
      }

      const data = (await res.json().catch(() => null)) as {
        enhancedDescription?: unknown;
      } | null;

      if (typeof data?.enhancedDescription === "string") {
        onUpdate(task.id, "description", data.enhancedDescription);
      } else {
        throw new Error(
          "Response does not contain a valid enhancedDescription",
        );
      }
    } catch (error) {
      console.error("Failed to enhance description:", error);
      alert(
        t("tasks.enhanceDescriptionFailed", {
          message: error instanceof Error ? error.message : "Unknown error",
        }),
      );
    } finally {
      setIsEnhancing(false);
    }
  };

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

          const currentStatusId =
            typeof task?.status_id === "number"
              ? task.status_id
              : task?.is_finished
                ? DONE_STATUS_ID
                : TODO_STATUS_ID;

          return (
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-start max-md:pt-20 md:pt-4 justify-center bg-black/20 backdrop-blur-sm"
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
                className="w-[92vw] max-w-3xl rounded-xl bg-(--ws-surface) border border-(--ws-border)"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-(--ws-border)">
                  <h2 className="text-sm">{t("tasks.openDetails")}</h2>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs px-2 py-1 rounded-lg border border-(--ws-border) hover:bg-(--ws-hover)"
                  >
                    {t("tasks.cancel")}
                  </button>
                </div>

                {task && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <section className="md:col-span-2 flex flex-col gap-1">
                      <span className="text-xs text-(--ws-fg-muted)">
                        {t("tasks.title")}
                      </span>
                      <input
                        value={task.title}
                        onChange={(e) =>
                          onUpdate(task.id, "title", e.target.value)
                        }
                        className="bg-transparent text-sm rounded-lg border border-(--ws-border) px-3 py-2 focus:outline-none"
                      />
                    </section>

                    <section className="md:col-span-2 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-(--ws-fg-muted)">
                          {t("tasks.description")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            void enhanceDescription();
                          }}
                          disabled={isEnhancing}
                          className="group inline-flex items-center gap-2 rounded-lg border border-(--ws-border) px-2.5 py-1 text-xs text-(--ws-fg-muted) hover:bg-(--ws-hover) disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Image
                            src={Enhance}
                            alt="Enhance"
                            className={`ws-icon h-3.5 w-3.5 group-hover:scale-110 transition-transform ${isEnhancing ? "animate-pulse" : ""}`}
                          />
                          {isEnhancing
                            ? t("tasks.enhancingDescription")
                            : t("tasks.enhanceDescription")}
                        </button>
                      </div>
                      <textarea
                        value={task.description}
                        onChange={(e) =>
                          onUpdate(task.id, "description", e.target.value)
                        }
                        disabled={isEnhancing}
                        className="bg-transparent text-sm rounded-lg border border-(--ws-border) px-3 py-2 h-32 resize-none focus:outline-none"
                      />
                    </section>

                    <section className="flex flex-col gap-1">
                      <span className="text-xs text-(--ws-fg-muted)">
                        {t("tasks.priority")}
                      </span>
                      <Select.Root
                        value={selectPriorityValue}
                        onValueChange={(value) =>
                          onUpdate(task.id, "priority", value)
                        }
                      >
                        <Select.Trigger className="text-(--ws-fg) text-sm rounded-lg border border-(--ws-border) px-3 py-2 w-full flex items-center justify-between bg-transparent focus:outline-none hover:cursor-pointer">
                          <Select.Value placeholder={t("tasks.priority")} />
                          <Select.Icon className="text-(--ws-fg-muted)">
                            v
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal container={portalContainer ?? undefined}>
                          <Select.Content
                            position="popper"
                            sideOffset={6}
                            className="z-50 overflow-hidden rounded-md border border-(--ws-border) bg-(--ws-surface)"
                          >
                            <Select.Viewport className="p-1">
                              {priorities.map((p) => (
                                <Select.Item
                                  key={p}
                                  value={p}
                                  className="text-xs select-none rounded px-2 py-2 text-(--ws-fg) outline-none data-highlighted:bg-(--ws-hover) data-[state=checked]:bg-(--ws-hover)"
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
                      <span className="text-xs text-(--ws-fg-muted)">
                        {t("tasks.dueDate")}
                      </span>
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
                        className="bg-transparent text-sm rounded-lg border border-(--ws-border) px-3 py-2 focus:outline-none no-date-icon"
                      />
                    </section>

                    <section className="flex flex-col gap-1">
                      <span className="text-xs text-(--ws-fg-muted)">
                        {t("tasks.assignee")}
                      </span>
                      <Select.Root
                        value={selectAssigneeValue}
                        onValueChange={(value) =>
                          onUpdate(task.id, "assignee", value)
                        }
                        disabled={
                          assigneeLoading || assigneeOptions.length === 0
                        }
                      >
                        <Select.Trigger className="text-(--ws-fg) text-sm rounded-lg border border-(--ws-border) px-3 py-2 w-full flex items-center justify-between bg-transparent focus:outline-none hover:cursor-pointer disabled:opacity-60">
                          <Select.Value
                            placeholder={
                              assigneeLoading
                                ? t("tasks.assigneeLoading")
                                : t("tasks.assignee")
                            }
                          />
                          <Select.Icon className="text-(--ws-fg-muted)">
                            v
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal container={portalContainer ?? undefined}>
                          <Select.Content
                            position="popper"
                            sideOffset={6}
                            className="z-50 overflow-hidden rounded-md border border-(--ws-border) bg-(--ws-surface)"
                          >
                            <Select.Viewport className="p-1">
                              {assigneeOptions.map((name) => (
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
                    </section>

                    <section className="flex flex-col gap-1">
                      <span className="text-xs text-(--ws-fg-muted)">
                        {t("tasks.status")}
                      </span>
                      <Select.Root
                        value={String(currentStatusId)}
                        onValueChange={(value) => {
                          const nextStatusId = Number(value);
                          if (!Number.isFinite(nextStatusId)) return;
                          void submitStatusChange(nextStatusId);
                        }}
                      >
                        <Select.Trigger className="text-(--ws-fg) text-sm rounded-lg border border-(--ws-border) px-3 py-2 w-full flex items-center justify-between bg-transparent focus:outline-none hover:cursor-pointer">
                          <Select.Value placeholder={t("tasks.status")} />
                          <Select.Icon className="text-(--ws-fg-muted)">
                            v
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal container={portalContainer ?? undefined}>
                          <Select.Content
                            position="popper"
                            sideOffset={6}
                            className="z-50 overflow-hidden rounded-md border border-(--ws-border) bg-(--ws-surface)"
                          >
                            <Select.Viewport className="p-1">
                              {statusOptions.map((status) => (
                                <Select.Item
                                  key={status.id}
                                  value={String(status.id)}
                                  className="text-xs select-none rounded px-2 py-2 text-(--ws-fg) outline-none data-highlighted:bg-(--ws-hover) data-[state=checked]:bg-(--ws-hover)"
                                >
                                  <Select.ItemText>
                                    {formatTaskStatusName(status.name)}
                                  </Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </section>

                    <section className="md:col-span-2 flex items-center justify-between rounded-lg border border-(--ws-border) px-3 py-3">
                      <div>
                        <div className="text-sm">{t("tasks.finished")}</div>
                        <div className="text-xs text-(--ws-fg-muted)">
                          {t("tasks.openDetailsHint")}
                        </div>
                      </div>
                      <RoundedCheckbox
                        checked={task.is_finished}
                        onCheckedChange={(next: boolean) => {
                          const nextStatus = next
                            ? DONE_STATUS_ID
                            : (() => {
                                const statusName =
                                  typeof task.status_name === "string"
                                    ? task.status_name
                                    : "";
                                if (
                                  statusName &&
                                  !statusNameToDone(statusName)
                                ) {
                                  return currentStatusId;
                                }
                                return TODO_STATUS_ID;
                              })();
                          void submitStatusChange(nextStatus);
                        }}
                        ariaLabel={t("tasks.finished")}
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
