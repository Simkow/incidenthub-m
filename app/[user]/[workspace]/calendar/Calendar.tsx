"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Plus from "../../../../public/assets/plus.png";
import Minus from "../../../../public/assets/minus.png";
import { useI18n } from "../../../i18n/I18nProvider";
import { messages } from "../../../i18n/messages";
import { dateInputToDateOnly, toDateInputValue } from "../tasks/dateTime";

type Props = {
  user: string;
  currentWorkspace: string;
};

type CalendarEvent = {
  id: number | string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  color?: string | null;
  status?: string | null;
  linked_task_id?: number | string | null;
  assignee_id?: number | string | null;
};

type EventFormState = {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  color: string;
  status: string;
  assignee: string;
};

const STATUS_VALUES = ["planned", "done", "cancelled"] as const;

const toDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const toTimeInputValue = (value: string) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";

  const isoMatch = /^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}))/.exec(raw);
  if (isoMatch?.[2]) return isoMatch[2];

  const timeOnly = /^(\d{2}:\d{2})/.exec(raw);
  if (timeOnly?.[1]) return timeOnly[1];

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const getMonthStart = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);
const getMonthEnd = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

const getCalendarStart = (date: Date) => {
  const start = getMonthStart(date);
  const weekday = (start.getDay() + 6) % 7; // Monday=0
  start.setDate(start.getDate() - weekday);
  return start;
};

const getCalendarEnd = (date: Date) => {
  const end = getMonthEnd(date);
  const weekday = (end.getDay() + 6) % 7; // Monday=0
  end.setDate(end.getDate() + (6 - weekday));
  return end;
};

const buildDateTime = (date: string, time: string, fallback: string) => {
  if (!date) return fallback;
  if (!time) return `${date}T00:00:00`;
  return `${date}T${time}:00`;
};

const buildAllDayRange = (date: string) => {
  if (!date) return { start: "", end: "" };
  return {
    start: `${date}T00:00:00`,
    end: `${date}T23:59:59`,
  };
};

export default function Calendar({ user, currentWorkspace }: Props) {
  const { t, locale } = useI18n();
  const calendarStrings = messages[locale]?.calendar ?? messages.en.calendar;
  const weekdayLabels = Array.isArray(calendarStrings.weekdays)
    ? calendarStrings.weekdays
    : messages.en.calendar.weekdays;
  const monthLabels = Array.isArray(calendarStrings.months)
    ? calendarStrings.months
    : messages.en.calendar.months;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [lastSyncedKey, setLastSyncedKey] = useState<string | null>(null);

  const defaultForm = useMemo<EventFormState>(
    () => ({
      title: "",
      description: "",
      date: toDateKey(new Date()),
      startTime: "09:00",
      endTime: "10:00",
      allDay: false,
      color: "#6b8cff",
      status: "planned",
      assignee: user ?? "",
    }),
    [user],
  );

  const [form, setForm] = useState<EventFormState>(defaultForm);

  useEffect(() => {
    setForm((prev) => ({ ...prev, assignee: user ?? prev.assignee }));
  }, [user]);

  const calendarStart = useMemo(
    () => getCalendarStart(anchorDate),
    [anchorDate],
  );
  const calendarEnd = useMemo(() => getCalendarEnd(anchorDate), [anchorDate]);

  const rangeFrom = useMemo(
    () => `${toDateKey(calendarStart)}T00:00:00`,
    [calendarStart],
  );

  const rangeTo = useMemo(
    () => `${toDateKey(calendarEnd)}T23:59:59`,
    [calendarEnd],
  );

  const fetchEvents = useCallback(async () => {
    if (!user || !currentWorkspace) return;

    try {
      const response = await fetch("/api/get-calendar-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user,
          workspace: currentWorkspace,
          from: rangeFrom,
          to: rangeTo,
        }),
      });

      if (!response.ok) {
        setError(t("calendar.networkError"));
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        events?: CalendarEvent[];
      } | null;
      setEvents(Array.isArray(data?.events) ? (data?.events ?? []) : []);
      setError(null);
    } catch (err) {
      console.error("Calendar fetch error", err);
      setError(t("calendar.networkError"));
    }
  }, [user, currentWorkspace, rangeFrom, rangeTo, t]);

  const syncTaskEvents = useCallback(async () => {
    if (!user || !currentWorkspace) return;

    try {
      await fetch("/api/sync-calendar-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, workspace: currentWorkspace }),
      });
    } catch (err) {
      console.error("Calendar sync error", err);
    }
  }, [user, currentWorkspace]);

  const handleAddEvent = useCallback(async () => {
    setMessage(null);
    setError(null);

    const dateOnly = dateInputToDateOnly(form.date);
    if (
      !form.title ||
      !dateOnly ||
      (!form.allDay && (!form.startTime || !form.endTime))
    ) {
      setError(t("calendar.fillAll"));
      return;
    }

    const { start, end } = form.allDay
      ? buildAllDayRange(dateOnly)
      : {
          start: buildDateTime(dateOnly, form.startTime, ""),
          end: buildDateTime(dateOnly, form.endTime, ""),
        };

    try {
      const response = await fetch("/api/add-calendar-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          start_at: start,
          end_at: end,
          all_day: form.allDay,
          color: form.color,
          status: form.status,
          assignee: form.assignee || user,
          workspace: currentWorkspace,
          created_by: user,
        }),
      });

      if (!response.ok) {
        const res = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(res?.message ?? t("calendar.fillAll"));
        return;
      }

      setMessage(t("calendar.addSuccess"));
      setForm(defaultForm);
      setIsAddOpen(false);
      void fetchEvents();
    } catch (err) {
      console.error("Calendar add error", err);
      setError(t("calendar.networkError"));
    }
  }, [form, user, currentWorkspace, fetchEvents, t, defaultForm]);

  const handleUpdateEvent = useCallback(async () => {
    if (!selectedEvent) return;

    setMessage(null);
    setError(null);

    const dateOnly = dateInputToDateOnly(form.date);
    const { start, end } = form.allDay
      ? buildAllDayRange(dateOnly)
      : {
          start: buildDateTime(
            dateOnly,
            form.startTime,
            selectedEvent.start_at,
          ),
          end: buildDateTime(dateOnly, form.endTime, selectedEvent.end_at),
        };

    try {
      const response = await fetch("/api/update-calendar-event", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEvent.id,
          title: form.title,
          description: form.description,
          start_at: start,
          end_at: end,
          all_day: form.allDay,
          color: form.color,
          status: form.status,
          assignee: form.assignee || user,
        }),
      });

      if (!response.ok) {
        const res = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(res?.message ?? t("calendar.fillAll"));
        return;
      }

      setMessage(t("calendar.updateSuccess"));
      setSelectedEvent(null);
      setForm(defaultForm);
      void fetchEvents();
    } catch (err) {
      console.error("Calendar update error", err);
      setError(t("calendar.networkError"));
    }
  }, [selectedEvent, form, user, fetchEvents, t, defaultForm]);

  const handleDeleteEvent = useCallback(async () => {
    if (!selectedEvent) return;
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/delete-calendar-event", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedEvent.id }),
      });

      if (!response.ok) {
        setError(t("calendar.networkError"));
        return;
      }

      setMessage(t("calendar.deleteSuccess"));
      setSelectedEvent(null);
      setForm(defaultForm);
      void fetchEvents();
    } catch (err) {
      console.error("Calendar delete error", err);
      setError(t("calendar.networkError"));
    }
  }, [selectedEvent, fetchEvents, t, defaultForm]);

  useEffect(() => {
    if (!user || !currentWorkspace) return;
    const syncKey = `${user}:${currentWorkspace}`;
    if (lastSyncedKey === syncKey) return;

    setLastSyncedKey(syncKey);
    void syncTaskEvents().then(fetchEvents);
  }, [user, currentWorkspace, lastSyncedKey, syncTaskEvents, fetchEvents]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const handler = () => void fetchEvents();
    window.addEventListener("calendar:refresh", handler);
    return () => window.removeEventListener("calendar:refresh", handler);
  }, [fetchEvents]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    events.forEach((event) => {
      const start = new Date(event.start_at);
      const end = new Date(event.end_at);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

      const cursor = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
      );
      const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      while (cursor <= last) {
        const key = toDateKey(cursor);
        const list = map.get(key) ?? [];
        list.push(event);
        map.set(key, list);
        cursor.setDate(cursor.getDate() + 1);
      }
    });

    for (const [key, list] of map.entries()) {
      list.sort((a, b) => a.start_at.localeCompare(b.start_at));
      map.set(key, list);
    }

    return map;
  }, [events]);

  const gridDays = useMemo(() => {
    const days: Date[] = [];
    const cursor = new Date(calendarStart);
    while (cursor <= calendarEnd) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [calendarStart, calendarEnd]);

  const monthLabel = useMemo(() => {
    const monthName = monthLabels[anchorDate.getMonth()] ?? "";
    return `${monthName} ${anchorDate.getFullYear()}`;
  }, [anchorDate, monthLabels]);

  const openEdit = (event: CalendarEvent) => {
    const startDateKey = toDateInputValue(event.start_at);
    const startTime = toTimeInputValue(event.start_at) || defaultForm.startTime;
    const endTime = toTimeInputValue(event.end_at) || defaultForm.endTime;

    setIsAddOpen(false);
    setSelectedEvent(event);
    setForm({
      title: event.title ?? "",
      description: event.description ?? "",
      date: startDateKey,
      startTime,
      endTime,
      allDay: Boolean(event.all_day),
      color: event.color ?? "#6b8cff",
      status: event.status ?? "planned",
      assignee: user ?? "",
    });
  };

  const startNewEvent = (dateKey?: string) => {
    const nextDate = dateKey ?? toDateKey(new Date());
    setSelectedEvent(null);
    setForm({ ...defaultForm, date: nextDate });
    setIsAddOpen(true);
  };

  const statusLabel = (value: string) => {
    switch (value) {
      case "done":
        return t("calendar.statusDone");
      case "cancelled":
        return t("calendar.statusCancelled");
      default:
        return t("calendar.statusPlanned");
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-(--ws-bg)"
    >
      <section className="py-2 w-full">
        <main className="w-full md:min-h-full border-y border-l rounded-l-xl border-(--ws-border) bg-(--ws-surface) flex flex-col gap-6 p-4">
          <header className="w-full rounded-xl border border-(--ws-border) flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-3 py-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsAddOpen((prev) => !prev)}
                className="px-2 py-1 rounded-lg border border-(--ws-border) hover:bg-(--ws-hover) flex items-center gap-2"
              >
                <Image
                  src={isAddOpen ? Minus : Plus}
                  alt="toggle"
                  className="ws-icon w-4 h-4"
                />
                {t("calendar.addToggle")}
              </button>
              <button
                onClick={() => setAnchorDate(new Date())}
                className="px-2 py-1 rounded-lg border border-(--ws-border) hover:bg-(--ws-hover)"
              >
                {t("calendar.today")}
              </button>
              <button
                onClick={() =>
                  setAnchorDate(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                  )
                }
                className="px-2 py-1 rounded-lg border border-(--ws-border) hover:bg-(--ws-hover)"
              >
                {t("calendar.prev")}
              </button>
              <button
                onClick={() =>
                  setAnchorDate(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                  )
                }
                className="px-2 py-1 rounded-lg border border-(--ws-border) hover:bg-(--ws-hover)"
              >
                {t("calendar.next")}
              </button>
            </div>

            <div className="text-sm font-semibold md:text-right">
              {monthLabel}
            </div>
          </header>

          <section className="hidden md:grid grid-cols-7 gap-2 text-xs text-(--ws-fg-muted)">
            {weekdayLabels.map((label) => (
              <div key={label} className="px-2 py-1 text-center">
                {label}
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2">
            {gridDays.map((day) => {
              const key = toDateKey(day);
              const dayEvents = eventsByDay.get(key) ?? [];
              const isCurrentMonth =
                day.getMonth() === anchorDate.getMonth() &&
                day.getFullYear() === anchorDate.getFullYear();
              const isToday = key === toDateKey(new Date());
              const visibleEvents = dayEvents.slice(0, 3);
              const moreCount = dayEvents.length - visibleEvents.length;

              return (
                <div
                  key={key}
                  className={`min-h-[120px] md:min-h-[140px] rounded-xl border border-(--ws-border) bg-(--ws-bg) p-2 flex flex-col gap-2 ${
                    isCurrentMonth ? "" : "opacity-50"
                  } ${isToday ? "ring-1 ring-(--ws-accent)" : ""}`}
                  onDoubleClick={() => startNewEvent(key)}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{day.getDate()}</span>
                    <button
                      onClick={() => startNewEvent(key)}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-(--ws-border) hover:bg-(--ws-hover)"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    {visibleEvents.length === 0 ? (
                      <span className="text-[10px] text-(--ws-fg-muted)">
                        {t("calendar.emptyDay")}
                      </span>
                    ) : (
                      visibleEvents.map((event) => (
                        <button
                          key={`${event.id}-${key}`}
                          onClick={() => openEdit(event)}
                          className="text-[10px] px-2 py-1 rounded-md text-left border border-(--ws-border) hover:bg-(--ws-hover)"
                          style={{
                            borderColor: event.color ?? undefined,
                            boxShadow: event.color
                              ? `inset 2px 0 0 ${event.color}`
                              : undefined,
                          }}
                        >
                          <div className="font-semibold truncate">
                            {event.title}
                          </div>
                          {!event.all_day && (
                            <div className="text-[9px] text-(--ws-fg-muted)">
                              {toTimeInputValue(event.start_at)} -{" "}
                              {toTimeInputValue(event.end_at)}
                            </div>
                          )}
                        </button>
                      ))
                    )}
                    {moreCount > 0 && (
                      <span className="text-[10px] text-(--ws-fg-muted)">
                        +{moreCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        </main>
      </section>

      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setIsAddOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="w-full max-w-3xl rounded-xl border border-(--ws-border) bg-(--ws-surface) p-4 grid gap-3"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">
                  {t("calendar.addTitle")}
                </div>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="text-xs px-2 py-1 rounded-lg border border-(--ws-border) hover:bg-(--ws-hover)"
                >
                  {t("calendar.cancel")}
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <label className="text-xs flex flex-col gap-1">
                  {t("calendar.titleLabel")}
                  <input
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder={t("calendar.titlePh")}
                    className="px-3 py-2 rounded-lg border border-(--ws-border) bg-(--ws-bg)"
                  />
                </label>
                <label className="text-xs flex flex-col gap-1 md:col-span-2">
                  {t("calendar.descriptionLabel")}
                  <input
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder={t("calendar.descriptionPh")}
                    className="px-3 py-2 rounded-lg border border-(--ws-border) bg-(--ws-bg)"
                  />
                </label>
              </div>

              <div className="grid md:grid-cols-5 gap-3">
                <label className="text-xs flex flex-col gap-1">
                  {t("calendar.dateLabel")}
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, date: e.target.value }))
                    }
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
                    className="px-3 py-2 rounded-lg border border-(--ws-border) bg-(--ws-bg)"
                  />
                </label>
                <label className="text-xs flex flex-col gap-1">
                  {t("calendar.startLabel")}
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    disabled={form.allDay}
                    className="px-3 py-2 rounded-lg border border-(--ws-border) bg-(--ws-bg)"
                  />
                </label>
                <label className="text-xs flex flex-col gap-1">
                  {t("calendar.endLabel")}
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, endTime: e.target.value }))
                    }
                    disabled={form.allDay}
                    className="px-3 py-2 rounded-lg border border-(--ws-border) bg-(--ws-bg)"
                  />
                </label>
                <label className="text-xs flex flex-col gap-1">
                  {t("calendar.colorLabel")}
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-(--ws-border) bg-(--ws-bg)"
                  />
                </label>
                <label className="text-xs flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    checked={form.allDay}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, allDay: e.target.checked }))
                    }
                    className="accent-(--ws-accent)"
                  />
                  {t("calendar.allDay")}
                </label>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <label className="text-xs flex flex-col gap-1">
                  {t("calendar.statusLabel")}
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="px-3 py-2 rounded-lg border border-(--ws-border) bg-(--ws-bg)"
                  >
                    {STATUS_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {statusLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs flex flex-col gap-1">
                  {t("calendar.assigneeLabel")}
                  <input
                    value={form.assignee}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, assignee: e.target.value }))
                    }
                    placeholder={t("calendar.assigneePh")}
                    className="px-3 py-2 rounded-lg border border-(--ws-border) bg-(--ws-bg)"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleAddEvent}
                  className="px-3 py-2 text-sm rounded-lg border border-(--ws-border) hover:bg-(--ws-hover)"
                >
                  {t("calendar.submit")}
                </button>
                {/* {message && <span className="text-xs text-(--ws-fg-muted)">{message}</span>} */}
                {/* {error && <span className="text-xs text-red-400">{error}</span>} */}
              </div>
            </motion.div>
          </motion.div>
        )}
        {selectedEvent && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="w-full max-w-xl rounded-xl border border-(--ws-border) bg-(--ws-surface) p-4 grid gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">
                  {t("calendar.editTitle")}
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-xs px-2 py-1 rounded-lg border border-(--ws-border) hover:bg-(--ws-hover)"
                >
                  {t("calendar.cancel")}
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <label className="text-xs flex flex-col gap-1">
                  {t("calendar.titleLabel")}
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="px-3 py-2 rounded-lg border border-(--ws-border) bg-(--ws-bg)"
                  />
                </label>
                <label className="text-xs flex flex-col gap-1 md:col-span-2">
                  {t("calendar.descriptionLabel")}
                  <input
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="px-3 py-2 rounded-lg border border-(--ws-border) bg-(--ws-bg)"
                  />
                </label>
              </div>

              <div className="grid md:grid-cols-5 gap-3">
                <label className="text-xs flex flex-col gap-1">
                  {t("calendar.dateLabel")}
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, date: e.target.value }))
                    }
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
                    className="px-3 py-2 rounded-lg border border-(--ws-border) bg-(--ws-bg)"
                  />
                </label>
                <label className="text-xs flex flex-col gap-1">
                  {t("calendar.startLabel")}
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    disabled={form.allDay}
                    className="px-3 py-2 rounded-lg border border-(--ws-border) bg-(--ws-bg)"
                  />
                </label>
                <label className="text-xs flex flex-col gap-1">
                  {t("calendar.endLabel")}
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, endTime: e.target.value }))
                    }
                    disabled={form.allDay}
                    className="px-3 py-2 rounded-lg border border-(--ws-border) bg-(--ws-bg)"
                  />
                </label>
                <label className="text-xs flex flex-col gap-1">
                  {t("calendar.colorLabel")}
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-(--ws-border) bg-(--ws-bg)"
                  />
                </label>
                <label className="text-xs flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    checked={form.allDay}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, allDay: e.target.checked }))
                    }
                    className="accent-(--ws-accent)"
                  />
                  {t("calendar.allDay")}
                </label>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <label className="text-xs flex flex-col gap-1">
                  {t("calendar.statusLabel")}
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="px-3 py-2 rounded-lg border border-(--ws-border) bg-(--ws-bg)"
                  >
                    {STATUS_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {statusLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs flex flex-col gap-1">
                  {t("calendar.assigneeLabel")}
                  <input
                    value={form.assignee}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, assignee: e.target.value }))
                    }
                    className="px-3 py-2 rounded-lg border border-(--ws-border) bg-(--ws-bg)"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleUpdateEvent}
                  className="px-3 py-2 rounded-lg text-sm border border-(--ws-border) hover:bg-(--ws-hover)"
                >
                  {t("calendar.update")}
                </button>
                <button
                  onClick={handleDeleteEvent}
                  className="px-3 py-2 rounded-lg text-sm border border-(--ws-border) hover:bg-(--ws-hover)"
                >
                  {t("calendar.delete")}
                </button>
                {/* {message && <span className="text-xs text-(--ws-fg-muted)">{message}</span>} */}
                {/* {error && <span className="text-xs text-red-400">{error}</span>} */}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
