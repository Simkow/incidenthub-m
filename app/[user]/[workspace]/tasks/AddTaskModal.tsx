"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import * as Select from "@radix-ui/react-select";
import { useI18n } from "../../../i18n/I18nProvider";

type Priority = "Light" | "Medium" | "High" | "Urgent";

type Props = {
  open: boolean;
  onClose: () => void;
  workspace: string;
  createdBy?: string;
  onSuccessMessage?: (message: string) => void;
  onErrorMessage?: (message: string) => void;
  afterSuccess?: () => void;
};

export function AddTaskModal({
  open,
  onClose,
  workspace,
  createdBy,
  onSuccessMessage,
  onErrorMessage,
  afterSuccess,
}: Props) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState("");
  const [assigneeOptions, setAssigneeOptions] = useState<string[]>([]);
  const [assigneeLoading, setAssigneeLoading] = useState(false);
  const [priority, setPriority] = useState<Priority | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (!workspace) return;

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

        if (!assignee && users.length) {
          setAssignee(users[0] ?? "");
        }
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
  }, [open, workspace, assignee]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    onSuccessMessage?.("");
    onErrorMessage?.("");

    if (!title || !description || !priority || !dueDate || !assignee) {
      onErrorMessage?.(t("tasks.fillAll"));
      setError?.(t("tasks.fillAll"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/add-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          priority,
          description,
          due_date: dueDate,
          assignee,
          workspace,
          ...(createdBy ? { created_by: createdBy } : {}),
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!res.ok) {
        onErrorMessage?.(data?.message ?? t("tasks.addFailed"));
        return;
      }

      onSuccessMessage?.(data?.message ?? t("tasks.addSuccess"));
      setTitle("");
      setDescription("");
      setPriority("");
      setDueDate("");
      setAssignee("");

      onClose();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tasks:refresh"));
      }
      afterSuccess?.();
    } catch {
      onErrorMessage?.(t("tasks.networkError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/20 rounded-xl backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-[92vw] max-w-3xl rounded-xl bg-[#181818] border border-[#2e2e2e] p-3 flex flex-col gap-3"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm">{t("tasks.createTask")}</h2>
        <main className="w-full h-full border-t border-[#2e2e2e] flex flex-col py-2">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col md:flex-row gap-3">
              <section className="flex flex-col gap-1 w-full">
                <span>{t("tasks.title")}</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-white rounded-md border border-[#2e2e2e] p-2 w-full md:w-48 bg-transparent focus:outline-none focus:border-neutral-300"
                  placeholder={t("tasks.titlePh")}
                />
              </section>
              <section className="flex flex-col gap-1 w-full">
                <span>{t("tasks.priority")}</span>
                <Select.Root
                  value={priority}
                  onValueChange={(value) => setPriority(value as Priority)}
                >
                  <Select.Trigger className="text-white rounded-md border border-[#2e2e2e] px-2 py-2 w-full md:w-48 flex items-center justify-between bg-transparent focus:outline-none focus:border-neutral-300 hover:cursor-pointer">
                    <Select.Value placeholder={t("tasks.priorityPh")} />
                    <Select.Icon className="text-neutral-400">▾</Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      position="popper"
                      sideOffset={6}
                      className="z-50 overflow-hidden rounded-md border border-[#2e2e2e] bg-[#181818] hover:cursor-pointer"
                    >
                      <Select.Viewport className="p-1">
                        {(["Light", "Medium", "High", "Urgent"] as const).map(
                          (p) => (
                            <Select.Item
                              key={p}
                              value={p}
                              className="text-xs select-none rounded px-2 py-2 text-white outline-none data-highlighted:bg-white/10 data-state=checked:bg-white/10"
                            >
                              <Select.ItemText>{p}</Select.ItemText>
                            </Select.Item>
                          ),
                        )}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </section>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <section className="flex flex-col gap-1 w-full">
                <span>{t("tasks.description")}</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-white rounded-md border border-[#2e2e2e] p-2 w-full md:w-72 h-40 bg-transparent focus:outline-none focus:border-neutral-300"
                  placeholder={t("tasks.descriptionPh")}
                />
              </section>
              <section className="flex flex-col gap-1 w-full">
                <span>{t("tasks.dueDate")}</span>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  onClick={(e) =>
                    (
                      e.currentTarget as HTMLInputElement & {
                        showPicker?: () => void;
                      }
                    ).showPicker?.()
                  }
                  onFocus={(e) =>
                    (
                      e.currentTarget as HTMLInputElement & {
                        showPicker?: () => void;
                      }
                    ).showPicker?.()
                  }
                  className="text-white rounded-md border border-[#2e2e2e] p-2 w-full md:w-72 bg-transparent focus:outline-none focus:border-neutral-300"
                />
              </section>
            </div>
            <div className="flex gap-3">
              <section className="flex flex-col gap-1 w-full">
                <span>{t("tasks.assignee")}</span>
                <Select.Root
                  value={assignee}
                  onValueChange={(value) => setAssignee(value)}
                  disabled={assigneeLoading || assigneeOptions.length === 0}
                >
                  <Select.Trigger className="text-white rounded-md border border-[#2e2e2e] px-2 py-2 w-full md:w-72 flex items-center justify-between bg-transparent focus:outline-none focus:border-neutral-300 hover:cursor-pointer disabled:opacity-60">
                    <Select.Value
                      placeholder={
                        assigneeLoading
                          ? t("tasks.assigneeLoading")
                          : t("tasks.assigneePh")
                      }
                    />
                    <Select.Icon className="text-neutral-400">▾</Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      position="popper"
                      sideOffset={6}
                      className="z-50 overflow-hidden rounded-md border border-[#2e2e2e] bg-[#181818] hover:cursor-pointer"
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
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl border border-[#2e2e2e] p-2 w-full md:w-24 text-center hover:bg-[#2e2e2e] cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? t("tasks.sending") : t("tasks.submit")}
            </button>
            <span className="text-xs text-red-300">{error}</span>
          </form>
        </main>
      </div>
    </motion.div>
  );
}
