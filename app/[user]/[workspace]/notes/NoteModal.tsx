"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useI18n } from "../../../i18n/I18nProvider";
import type { Note } from "./types";
import { RoundedCheckbox } from "../tasks/RoundedCheckbox";
import Enhance from "../../../../public/assets/enhance.png";
import Image from "next/image";

type Props = {
  open: boolean;
  note: Note | null;
  username: string;
  onClose: () => void;
  afterChange?: () => void;
  onSuccessMessage?: (message: string) => void;
  onErrorMessage?: (message: string) => void;
};

export function NoteModal({
  open,
  note,
  username,
  onClose,
  afterChange,
  onSuccessMessage,
  onErrorMessage,
}: Props) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    if (!note) return;
    setTitle(note.title);
    setContent(note.content);
    setIsPinned(!!note.is_pinned);
    setDeleteConfirm(false);
  }, [note]);

  async function save() {
    if (!note) return;

    onSuccessMessage?.("");
    onErrorMessage?.("");

    if (!title.trim()) {
      onErrorMessage?.(t("notes.titleRequired"));
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/update-note", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: note.id,
          username,
          title: title.trim(),
          content,
          is_pinned: isPinned,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        message?: unknown;
      } | null;

      const message = typeof data?.message === "string" ? data.message : "";

      if (!res.ok) {
        onErrorMessage?.(message || t("notes.updateFailed"));
        return;
      }

      onSuccessMessage?.(message || t("notes.updateSuccess"));
      afterChange?.();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("notes:refresh"));
      }
      onClose();
    } catch {
      onErrorMessage?.(t("notes.networkError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function remove() {
    if (!note) return;

    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    onSuccessMessage?.("");
    onErrorMessage?.("");

    try {
      const res = await fetch("/api/delete-note", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: note.id, username }),
      });

      const data = (await res.json().catch(() => null)) as {
        message?: unknown;
      } | null;

      const message = typeof data?.message === "string" ? data.message : "";

      if (!res.ok) {
        onErrorMessage?.(message || t("notes.deleteFailed"));
        return;
      }

      onSuccessMessage?.(message || t("notes.deleteSuccess"));
      afterChange?.();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("notes:refresh"));
      }
      onClose();
    } catch {
      onErrorMessage?.(t("notes.networkError"));
    }
  }

  async function enhanceContent() {
    const currentContent = content.trim();
    if (!currentContent) {
      alert(t("notes.enhanceContentEmpty"));
      return;
    }

    setIsEnhancing(true);
    try {
      const res = await fetch("/api/enhance-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: currentContent }),
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
        enhancedNote?: unknown;
      } | null;

      if (typeof data?.enhancedNote === "string") {
        setContent(data.enhancedNote);
      } else {
        throw new Error("Response does not contain a valid enhancedNote");
      }
    } catch (error) {
      console.error("Failed to enhance note:", error);
      alert(
        t("notes.enhanceContentFailed", {
          message: error instanceof Error ? error.message : "Unknown error",
        }),
      );
    } finally {
      setIsEnhancing(false);
    }
  }

  return (
    <AnimatePresence>
      {open && note ? (
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
            className="w-[92vw] max-w-4xl rounded-xl bg-(--ws-surface) border border-(--ws-border) text-(--ws-fg)"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-(--ws-border)">
              <h2 className="text-sm">{t("notes.details")}</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-xs px-2 py-1 rounded-lg border border-(--ws-border) hover:bg-(--ws-hover)"
              >
                {t("notes.close")}
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 gap-4">
              <section className="flex flex-col gap-1">
                <span className="text-xs text-(--ws-fg-muted)">
                  {t("notes.title")}
                </span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-transparent text-sm rounded-lg border border-(--ws-border) px-3 py-2 focus:outline-none"
                />
              </section>

              <section className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-(--ws-fg-muted)">
                    {t("notes.content")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void enhanceContent();
                    }}
                    disabled={isEnhancing}
                    className="group inline-flex items-center gap-2 rounded-lg border border-(--ws-border) px-2.5 py-1 text-xs text-(--ws-fg-muted) hover:bg-(--ws-hover) disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Image
                      src={Enhance}
                      alt="Enhance"
                      className="ws-icon h-3.5 w-3.5 group-hover:scale-110 transition-transform"
                    />
                    {isEnhancing
                      ? t("notes.enhancingContent")
                      : t("notes.enhanceContent")}
                  </button>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isEnhancing}
                  className="bg-transparent text-sm rounded-lg border border-(--ws-border) px-3 py-2 h-72 resize-none focus:outline-none"
                />
              </section>

              <section className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-xs text-(--ws-fg-muted) select-none">
                  <RoundedCheckbox
                    checked={isPinned}
                    onCheckedChange={setIsPinned}
                    ariaLabel={t("notes.pinned")}
                  />
                  <span>{t("notes.pinned")}</span>
                </div>
                <span className="ml-auto font-bold text-xs text-(--ws-fg-muted) truncate">
                  {note.owner}
                </span>
              </section>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={remove}
                  className="text-xs px-3 py-2 rounded-lg border border-(--ws-border) hover:bg-(--ws-hover)"
                >
                  {deleteConfirm ? t("notes.confirmDelete") : t("notes.delete")}
                </button>
                {deleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(false)}
                    className="text-xs px-3 py-2 rounded-lg border border-(--ws-border) hover:bg-(--ws-hover)"
                  >
                    {t("notes.cancel")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={save}
                  disabled={isSaving}
                  className="text-xs px-3 py-2 rounded-lg border border-(--ws-border) hover:bg-(--ws-hover) disabled:opacity-60"
                >
                  {isSaving ? t("notes.saving") : t("notes.save")}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
