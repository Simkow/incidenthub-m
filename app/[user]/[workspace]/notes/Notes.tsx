"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import Plus from "../../../../public/assets/plus.png";
import Minus from "../../../../public/assets/minus.png";
import { useI18n } from "../../../i18n/I18nProvider";
import { AddNoteModal } from "./AddNoteModal";
import { NoteModal } from "./NoteModal";
import type { Note } from "./types";

type Props = {
  user: string;
  workspace: string;
};

export default function Notes({ user, workspace }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<Note["id"] | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeNote = useMemo(
    () => (activeNoteId ? notes.find((n) => n.id === activeNoteId) ?? null : null),
    [activeNoteId, notes],
  );

  const fetchNotes = useCallback(async () => {
    if (!user || !workspace) return;

    try {
      const response = await fetch("/api/get-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, workspace }),
      });

      const data = (await response.json().catch(() => null)) as {
        notes?: unknown;
      } | null;

      const parsed = Array.isArray(data?.notes)
        ? (data?.notes as Array<Partial<Note>>)
            .map((n) => ({
              id: typeof n.id === "number" ? n.id : Number(n.id),
              title: typeof n.title === "string" ? n.title : "",
              content: typeof n.content === "string" ? n.content : "",
              is_pinned: typeof n.is_pinned === "boolean" ? n.is_pinned : !!n.is_pinned,
              owner: typeof n.owner === "string" ? n.owner : "",
            }))
            .filter((n) => Number.isFinite(n.id) && n.id > 0 && n.title)
        : [];

      setNotes(parsed);
    } catch (error) {
      console.error("Error fetching notes", error);
      setNotes([]);
    }
  }, [user, workspace]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchNotes();
    });
  }, [fetchNotes]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      void fetchNotes();
    };
    window.addEventListener("notes:refresh", handler);
    return () => window.removeEventListener("notes:refresh", handler);
  }, [fetchNotes]);

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      const hay = `${n.title} ${n.content}`.toLowerCase();
      return hay.includes(q);
    });
  }, [notes, search]);

  return (
    <motion.main
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-(--ws-bg) flex"
    >
      <section className="py-2 w-full">
        <main className="w-full md:min-h-full border-y border-l rounded-l-xl border-(--ws-border) bg-(--ws-surface) flex flex-col items-center p-4 gap-8 text-(--ws-fg) relative">
          <AddNoteModal
            open={open}
            onClose={() => setOpen(false)}
            user={user}
            workspace={workspace}
            onSuccessMessage={(m) => setSubmitMessage(m || null)}
            onErrorMessage={(m) => setSubmitError(m || null)}
          />

          <NoteModal
            open={activeNoteId !== null}
            note={activeNote}
            username={user}
            onClose={() => setActiveNoteId(null)}
            afterChange={() => {
              void fetchNotes();
            }}
            onSuccessMessage={(m) => setSubmitMessage(m || null)}
            onErrorMessage={(m) => setSubmitError(m || null)}
          />

          {/* top bar */}
          <section className="w-full rounded-xl border border-(--ws-border) flex flex-wrap items-center px-3 py-2 body-text text-xs gap-2">
            <button
              onClick={() => setOpen((v) => !v)}
              className="px-2 py-1 rounded-lg border border-(--ws-border) hover:bg-(--ws-hover) group hover:cursor-pointer"
            >
              {!open ? (
                <Image
                  src={Plus}
                  alt="icon"
                  className="ws-icon w-4 h-4 group-hover:scale-115 transition-all"
                />
              ) : (
                <Image
                  src={Minus}
                  alt="icon"
                  className="ws-icon w-4 h-4 group-hover:scale-115 transition-all"
                />
              )}
            </button>

            {submitMessage ? (
              <div className="text-xs text-(--ws-fg-muted)">
                {submitMessage}
              </div>
            ) : null}

            {submitError ? (
              <div className="text-xs text-red-400">{submitError}</div>
            ) : null}

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("notes.searchPh")}
              className="ml-auto min-w-55 flex-1 md:flex-none md:w-80 bg-transparent rounded-lg border border-(--ws-border) px-3 py-2 focus:outline-none"
            />
          </section>

          {/* list */}
          <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredNotes.length === 0 ? (
              <div className="text-xs text-(--ws-fg-muted) px-1">
                {t("notes.empty")}
              </div>
            ) : (
              filteredNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setActiveNoteId(note.id)}
                  className="text-left flex flex-col justify-between rounded-xl border border-(--ws-border) bg-(--ws-surface-2) hover:bg-(--ws-hover) transition-colors p-3"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold truncate">
                          {note.title}
                        </h3>
                        {note.is_pinned ? (
                          <span className="text-[11px] flex items-center px-2 py-0.5 rounded-full border border-(--ws-border) text-(--ws-fg-muted)">
                            {t("notes.pinned")}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-(--ws-fg-muted) whitespace-pre-wrap max-h-20 overflow-hidden">
                        {note.content || " "}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] font-bold text-(--ws-fg-muted) truncate">
                    {note.owner}
                  </div>
                </button>
              ))
            )}
          </section>
        </main>
      </section>
    </motion.main>
  );
}