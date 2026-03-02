"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react"
type Props = {
  user: string;
  currentWorkspace: string;
};

type ChatMessage = {
  id: number;
  message: string;
  created_at: string;
  username: string | null;
};

function formatTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export default function Inbox({ user, currentWorkspace }: Props) {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteConfirmMessageId, setDeleteConfirmMessageId] = useState<
      number | null
    >(null);

    const formattedMessages = useMemo(() => {
      return [...messages]
        .sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          if (timeA !== timeB) {
            return timeB - timeA;
          }
          return b.id - a.id;
        })
        .map((item) => ({
          ...item,
          formattedDate: formatTimestamp(item.created_at),
        }));
    }, [messages]);

    async function getMessages() {
      if (!user || !currentWorkspace) return;
      setIsLoading(true);

      const params = new URLSearchParams({
        username: user,
        workspace: currentWorkspace,
      });

      const response = await fetch(`/api/chat?${params.toString()}`);
      if (!response.ok) {
        setIsLoading(false);
        console.log("Something went wrong");
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        messages?: ChatMessage[];
      } | null;

      setMessages(data?.messages ?? []);
      setIsLoading(false);
    }
    
    async function SubmitMessage(e: React.FormEvent) {
      e.preventDefault();

      if (!message.trim()) {
        return;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user,
          workspace: currentWorkspace,
          message,
        }),
      });

      if (!response.ok) {
        console.log("Something went wrong");
        return;
      }

      setMessage("");
      await getMessages();
    }

    async function deleteMessage(messageId: number) {
      if (!user || !currentWorkspace) return;

      const response = await fetch("/api/chat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          username: user,
          workspace: currentWorkspace,
        }),
      });

      if (!response.ok) {
        console.log("Something went wrong");
        return;
      }

      setMessages((prev) => prev.filter((item) => item.id !== messageId));
      setDeleteConfirmMessageId(null);
    }

    useEffect(() => {
    if (!user || !currentWorkspace) return;

    getMessages();
    const intervalId = window.setInterval(() => {
      void getMessages();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user, currentWorkspace]);

  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-[color:var(--ws-bg)] min-h-screen text-[color:var(--ws-fg)]">
        <div className="p-4">
          <div className="w-full overflow-hidden rounded-2xl border border-[color:var(--ws-border)] bg-[color:var(--ws-surface)] p-4 shadow-sm md:h-[800px]">
            <div className="flex h-full flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold heading">
                    Workspace Chat
                  </h1>
                  <p className="text-sm text-[color:var(--ws-fg-muted)]">
                    {user} · {currentWorkspace}
                  </p>
                </div>
                <div className="rounded-full border border-[color:var(--ws-border)] bg-[color:var(--ws-surface-2)] px-3 py-1 text-xs text-[color:var(--ws-fg-muted)]">
                  Inbox
                </div>
              </div>

              <div className="flex w-full flex-1 flex-col gap-4 overflow-y-auto pr-2">
                {formattedMessages.length === 0 ? (
                  <div className="w-full rounded-xl border border-dashed border-[color:var(--ws-border)] bg-[color:var(--ws-surface-2)] p-4 text-sm text-[color:var(--ws-fg-muted)]">
                    {isLoading ? "Loading messages..." : "No messages yet."}
                  </div>
                ) : (
                  formattedMessages.map((item) => (
                    <div
                      key={item.id}
                      className="relative w-full rounded-xl border border-[color:var(--ws-border)] bg-[color:var(--ws-surface-2)] p-4"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-3">
                          <div
                            className={`text-xs font-semibold ${
                              user === item.username
                                ? "text-[color:var(--ws-accent)]"
                                : "text-[color:var(--ws-fg-muted)]"
                            }`}
                          >
                            {item.username ?? "Unknown"}
                          </div>
                          {user === item.username ? (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirmMessageId((prev) =>
                                    prev === item.id ? null : item.id,
                                  )
                                }
                                className="text-[11px] cursor-pointer font-medium text-red-300 transition hover:text-red-400"
                              >
                                Delete
                              </button>
                              <div
                                className={`${
                                  deleteConfirmMessageId === item.id
                                    ? "flex"
                                    : "hidden"
                                } absolute right-0 top-5 z-10 w-44 max-w-[calc(100vw-2rem)] flex-col items-center justify-center gap-2 rounded-xl border border-[color:var(--ws-border)] bg-[color:var(--ws-surface)] p-3 text-center text-[11px] text-[color:var(--ws-fg-muted)] shadow-sm`}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <span>Delete this message?</span>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeleteConfirmMessageId(null)
                                    }
                                    className="rounded-lg border border-[color:var(--ws-border)] bg-[color:var(--ws-surface-2)] px-2 py-1 text-[11px] text-[color:var(--ws-fg-muted)] hover:bg-[color:var(--ws-hover)]"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteMessage(item.id)}
                                    className="cursor-pointer rounded-lg border border-red-300 bg-[color:var(--ws-surface-2)] px-2 py-1 text-[11px] text-red-300 hover:bg-[color:var(--ws-hover)] hover:text-red-400"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                        <div className="mt-2 whitespace-pre-wrap text-sm">
                          {item.message}
                        </div>
                        <div className="mt-2 text-[11px] text-[color:var(--ws-fg-muted)]">
                          {item.formattedDate}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-[color:var(--ws-border)] pt-4">
                <form
                  onSubmit={SubmitMessage}
                  className="flex w-full flex-col gap-3 md:flex-row md:items-end"
                >
                  <div className="w-full flex flex-col">
                    <label className="text-xs font-medium text-[color:var(--ws-fg-muted)]">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void SubmitMessage(e);
                        }
                      }}
                      className="mt-2 min-h-[90px] w-full resize-none rounded-xl border border-[color:var(--ws-border)] bg-[color:var(--ws-surface-2)] px-3 py-2 text-sm text-[color:var(--ws-fg)] outline-none placeholder:text-[color:var(--ws-fg-muted)]"
                      placeholder="Write a message..."
                    />
                    {/* <div className="mt-2 text-[11px] text-[color:var(--ws-fg-muted)]">
                      Tip: use @username to mention someone.
                    </div> */}
                  </div>
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="h-11 rounded-xl border border-[color:var(--ws-border)] bg-[color:var(--ws-accent)] px-5 text-sm font-semibold text-[color:var(--ws-accent-fg)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
