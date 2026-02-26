"use client";

import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { useI18n } from "../../../i18n/I18nProvider";
import { RoundedCheckbox } from "../tasks/RoundedCheckbox";

type Props = {
  open: boolean;
  onClose: () => void;
  user: string;
  workspace: string;
  onSuccessMessage?: (message: string) => void;
  onErrorMessage?: (message: string) => void;
};

export function AddNoteModal({
  open,
  onClose,
  user,
  workspace,
  onSuccessMessage,
  onErrorMessage,
}: Props) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    onSuccessMessage?.("");
    onErrorMessage?.("");

    if (!title.trim()) {
      onErrorMessage?.(t("notes.titleRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/add-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ws: workspace,
          owner: user,
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
        onErrorMessage?.(message || t("notes.addFailed"));
        return;
      }

      onSuccessMessage?.(message || t("notes.addSuccess"));
      setTitle("");
      setContent("");
      setIsPinned(false);
      onClose();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("notes:refresh"));
      }
    } catch {
      onErrorMessage?.(t("notes.networkError"));
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
        className="w-[92vw] max-w-3xl rounded-xl bg-[color:var(--ws-surface)] border border-[color:var(--ws-border)] p-3 flex flex-col gap-3 text-[color:var(--ws-fg)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm">{t("notes.createNote")}</h2>
        <main className="w-full h-full border-t border-[color:var(--ws-border)] flex flex-col py-2">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col md:flex-row gap-3">
              <section className="flex flex-col gap-1 w-full">
                <span className="text-xs">{t("notes.title")}</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-[color:var(--ws-fg)] rounded-md border border-[color:var(--ws-border)] p-2 w-full md:w-72 bg-transparent focus:outline-none"
                  placeholder={t("notes.titlePh")}
                />
              </section>
              <section className="flex items-end gap-2 w-full">
                <div className="flex items-center gap-2 text-xs text-[color:var(--ws-fg-muted)] select-none">
                  <RoundedCheckbox
                    checked={isPinned}
                    onCheckedChange={setIsPinned}
                    ariaLabel={t("notes.pinned")}
                  />
                  <span>{t("notes.pinned")}</span>
                </div>
              </section>
            </div>

            <section className="flex flex-col gap-1 w-full">
              <span className="text-xs">{t("notes.content")}</span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="text-[color:var(--ws-fg)] rounded-md border border-[color:var(--ws-border)] p-2 w-full h-40 bg-transparent focus:outline-none resize-none"
                placeholder={t("notes.contentPh")}
              />
            </section>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="text-xs px-3 py-2 rounded-lg border border-[color:var(--ws-border)] hover:bg-[color:var(--ws-hover)]"
              >
                {t("notes.close")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="text-xs px-3 py-2 rounded-lg border border-[color:var(--ws-border)] hover:bg-[color:var(--ws-hover)] disabled:opacity-60"
              >
                {isSubmitting ? t("notes.saving") : t("notes.save")}
              </button>
            </div>
          </form>
        </main>
      </div>
    </motion.div>
  );
}
