"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { motion } from "motion/react";
import TaskSection from "./TaskSection";
import ActiveTaskSection from "./ActiveTaskSection";
import DoneTaskSection from "./DoneTaskSection";
import { AddTaskModal } from "./AddTaskModal";
import { useParams, useRouter } from "next/navigation";
import Plus from "../../../../public/assets/plus.png";
import Minus from "../../../../public/assets/minus.png";
import Image from "next/image";
import type { Task } from "./types";
import { ProjectCompletionModal } from "./ProjectCompletionBanner";
import { useI18n } from "../../../i18n/I18nProvider";

type DeadlineTask = {
  id: string | number;
  title: string;
  due_date: string;
  priority?: string;
};

export const TaskDashboard: React.FC = () => {
  const { t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [user, setUser] = useState("");
  const [taskView, setTaskView] = useState("All");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completionDismissed, setCompletionDismissed] = useState(false);
  const [deadlineCount, setDeadlineCount] = useState(0);
  const [deadlineTasks, setDeadlineTasks] = useState<DeadlineTask[]>([]);
  const plusIcon = Plus;
  const minusIcon = Minus;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const usr = window.localStorage.getItem("users");
    console.log("localStorage users:", usr);

    if (usr) {
      const nextUser = usr.replace(/"/g, "");
      queueMicrotask(() => setUser(nextUser));
    }
  }, []);

  const created_by = user;

  const currentWorkspace = useMemo(() => {
    const raw = (params as Record<string, string | string[] | undefined>)[
      "workspace"
    ];
    return Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  }, [params]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  function closeModal() {
    setOpen(false);
  }

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    if (!currentWorkspace) return;

    try {
      const response = await fetch("/api/get-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, workspace: currentWorkspace }),
      });
      const data = (await response.json()) as { tasks?: Task[] };
      setTasks(data.tasks ?? []);
    } catch (error) {
      console.error("Error fetching tasks", error);
    }
  }, [user, currentWorkspace]);

  const fetchDeadlineNotifications = useCallback(async () => {
    if (!user) return;
    if (!currentWorkspace) return;

    try {
      const res = await fetch("/api/get-deadline-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user,
          workspace: currentWorkspace,
          days: 1,
          limit: 3,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        count?: unknown;
        tasks?: unknown;
      } | null;

      const count =
        typeof data?.count === "number"
          ? data.count
          : typeof data?.count === "string"
            ? Number(data.count)
            : 0;

      const dueSoon = Array.isArray(data?.tasks)
        ? (data?.tasks as Array<Partial<DeadlineTask>>)
            .map((task) => ({
              id: typeof task.id === "number" ? task.id : String(task.id ?? ""),
              title: typeof task.title === "string" ? task.title : "",
              due_date: typeof task.due_date === "string" ? task.due_date : "",
              priority:
                typeof task.priority === "string" ? task.priority : undefined,
            }))
            .filter((task) => task.id && task.title && task.due_date)
        : [];

      setDeadlineCount(Number.isFinite(count) ? count : dueSoon.length);
      setDeadlineTasks(dueSoon);
    } catch (e) {
      console.error("Failed to fetch deadline notifications", e);
      setDeadlineCount(0);
      setDeadlineTasks([]);
    }
  }, [user, currentWorkspace]);

  useEffect(() => {
    if (!user || !currentWorkspace) return;
    queueMicrotask(() => {
      void fetchTasks();
      void fetchDeadlineNotifications();
    });
  }, [user, currentWorkspace, fetchTasks, fetchDeadlineNotifications]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = () => {
      void fetchTasks();
      void fetchDeadlineNotifications();
    };

    window.addEventListener("tasks:refresh", handler);
    return () => window.removeEventListener("tasks:refresh", handler);
  }, [fetchTasks, fetchDeadlineNotifications]);

  const doneTasksCount = useMemo(
    () => tasks.filter((t) => t.is_finished).length,
    [tasks],
  );
  const allTasksCount = tasks.length;
  const progressPercent =
    allTasksCount === 0
      ? 0
      : Math.round((doneTasksCount / allTasksCount) * 100);

  const completionOpen =
    allTasksCount > 0 && progressPercent === 100 && !completionDismissed;

  const showDeadlineToast = deadlineCount > 0;
  const nextDeadlineTask = deadlineTasks[0] ?? null;

  useEffect(() => {
    if (allTasksCount > 0 && progressPercent === 100) return;
    if (!completionDismissed) return;
    queueMicrotask(() => setCompletionDismissed(false));
  }, [progressPercent, allTasksCount, completionDismissed]);

  return (
    <motion.main
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-[color:var(--ws-bg)] flex"
    >
      <ProjectCompletionModal
        open={completionOpen}
        allTasksCount={allTasksCount}
        onClose={() => {
          setCompletionDismissed(true);
        }}
      />
      <section className="py-2 w-full">
        <main className="w-full md:min-h-full border-y border-l rounded-l-xl border-[color:var(--ws-border)] bg-[color:var(--ws-surface)] flex flex-col items-center p-4 gap-8 relative">
          <AddTaskModal
            open={open}
            onClose={closeModal}
            workspace={currentWorkspace}
            createdBy={created_by}
            onSuccessMessage={(m) => setSubmitMessage(m || null)}
            onErrorMessage={(m) => setSubmitError(m || null)}
            afterSuccess={() => {
              router.refresh();
            }}
          />
          {/* top bar */}
          <section className="w-full rounded-xl border border-[color:var(--ws-border)] flex flex-wrap items-center px-3 py-2 body-text text-xs gap-2">
            <button
              onClick={() => setOpen(!open)}
              className="px-2 py-1 rounded-lg border border-[color:var(--ws-border)] hover:bg-[color:var(--ws-hover)] group hover:cursor-pointer"
            >
              {!open ? (
                <Image
                  src={plusIcon}
                  alt="icon"
                  className="ws-icon w-4 h-4 group-hover:scale-115 transition-all"
                />
              ) : (
                <Image
                  src={minusIcon}
                  alt="icon"
                  className="ws-icon w-4 h-4 group-hover:scale-115 transition-all"
                />
              )}
            </button>

            {submitMessage && (
              <div className="text-xs text-[color:var(--ws-fg-muted)]">
                {submitMessage}
              </div>
            )}

            {submitError && (
              <div className="text-xs text-red-400">{submitError}</div>
            )}

            <button
              onClick={() => setTaskView("All")}
              className="px-2 py-1 rounded-lg border border-[color:var(--ws-border)] hover:bg-[color:var(--ws-hover)]"
            >
              {t("tasks.allTasks")}
            </button>
            <button
              onClick={() => setTaskView("Active")}
              className="px-2 py-1 rounded-lg border border-[color:var(--ws-border)] hover:bg-[color:var(--ws-hover)]"
            >
              {t("tasks.active")}
            </button>
            <button
              onClick={() => setTaskView("Done")}
              className="px-2 py-1 rounded-lg border border-[color:var(--ws-border)] hover:bg-[color:var(--ws-hover)]"
            >
              {t("tasks.done")}
            </button>

            <input
              type="text"
              value={search}
              onChange={handleChange}
              placeholder={t("tasks.searchPh")}
              className="w-full md:w-72 px-2 py-1 rounded-lg border border-[color:var(--ws-border)] bg-transparent focus:outline-none"
            />
          </section>

          {/* main */}
          <section className="w-full flex flex-col gap-1">
            <p className="heading">{t("tasks.progress")}</p>
            <div className="w-full rounded-xl border border-[color:var(--ws-border)] px-3 py-2 flex items-center gap-3 mb-5">
              <span className="text-xs text-[color:var(--ws-fg-muted)] whitespace-nowrap">
                {allTasksCount} : {doneTasksCount}
              </span>
              <div
                className="flex-1 h-2 rounded-full bg-[color:var(--ws-surface-2)] border border-[color:var(--ws-border)] overflow-hidden"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full transition-all duration-500 ${
                    progressPercent === 100
                      ? "bg-emerald-600"
                      : progressPercent >= 66
                        ? "bg-emerald-400"
                        : progressPercent >= 33
                          ? "bg-emerald-200"
                          : "bg-emerald-100"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-[color:var(--ws-fg-muted)] w-12 text-right">
                {progressPercent}%
              </span>
            </div>

            <h2 className="heading text-lg">{t("tasks.tasksHeading")}</h2>
            <main className="border-t border-[color:var(--ws-border)] w-full">
              {taskView === "All" ? (
                <TaskSection search={search} />
              ) : taskView === "Active" ? (
                <ActiveTaskSection search={search} />
              ) : (
                <DoneTaskSection search={search} />
              )}
            </main>
          </section>
        </main>
      </section>

      {showDeadlineToast && (
        <motion.div
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.5 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-[color:var(--ws-border)] bg-[color:var(--ws-surface)] px-4 py-3 text-sm"
        >
          <div className="font-medium">{t("tasks.deadlineToastTitle")}</div>
          <div className="text-[color:var(--ws-fg-muted)]">
            {t("tasks.deadlineToastBody", { count: deadlineCount })}
          </div>
          {nextDeadlineTask && (
            <div className="mt-1 text-[color:var(--ws-fg-muted)] opacity-80 truncate">
              {t("tasks.deadlineToastNext", { title: nextDeadlineTask.title })}
            </div>
          )}
        </motion.div>
      )}
    </motion.main>
  );
};
