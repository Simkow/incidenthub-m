"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "motion/react";
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

function getInboxReadStorageKey(username: string, workspace: string) {
  return `inbox:lastRead:${username}:${workspace}`;
}

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
  const [openActionMessageId, setOpenActionMessageId] = useState<number | null>(
    null,
  );
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [deleteConfirmMessageId, setDeleteConfirmMessageId] = useState<
    number | null
  >(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);

  const markInboxAsRead = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!user || !currentWorkspace) return;

    const key = getInboxReadStorageKey(user, currentWorkspace);
    window.localStorage.setItem(key, new Date().toISOString());
    window.dispatchEvent(new Event("inbox:read-updated"));
  }, [currentWorkspace, user]);

  const formattedMessages = useMemo(() => {
    return [...messages]
      .sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        if (timeA !== timeB) {
          return timeA - timeB;
        }
        return a.id - b.id;
      })
      .map((item) => ({
        ...item,
        formattedDate: formatTimestamp(item.created_at),
      }));
  }, [messages]);

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;

    if (!container || !shouldStickToBottomRef.current) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [formattedMessages]);

  function handleMessagesScroll() {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    shouldStickToBottomRef.current = distanceFromBottom < 48;
  }

  function handleMessagesWheel(e: React.WheelEvent<HTMLDivElement>) {
    const container = messagesContainerRef.current;
    if (!container) return;

    const canScroll = container.scrollHeight > container.clientHeight;
    if (!canScroll) return;

    container.scrollTop += e.deltaY;
    e.preventDefault();
  }

  useEffect(() => {
    if (openActionMessageId === null) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const inMenu = !!target.closest("[data-chat-action-menu]");
      const inTrigger = !!target.closest("[data-chat-action-trigger]");
      if (!inMenu && !inTrigger) {
        setOpenActionMessageId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [openActionMessageId]);

  const getMessages = useCallback(async () => {
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
    markInboxAsRead();
    setIsLoading(false);
  }, [currentWorkspace, markInboxAsRead, user]);

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
    setOpenActionMessageId(null);
  }

  function startEditingMessage(item: ChatMessage) {
    setOpenActionMessageId(null);
    setDeleteConfirmMessageId(null);
    setEditingMessageId(item.id);
    setEditingMessageText(item.message);
  }

  function cancelEditingMessage() {
    setEditingMessageId(null);
    setEditingMessageText("");
  }

  async function saveEditedMessage(messageId: number) {
    if (!user || !currentWorkspace) return;
    const trimmed = editingMessageText.trim();
    if (!trimmed) return;

    const response = await fetch("/api/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId,
        username: user,
        workspace: currentWorkspace,
        message: trimmed,
      }),
    });

    if (!response.ok) {
      console.log("Something went wrong");
      return;
    }

    setMessages((prev) =>
      prev.map((item) =>
        item.id === messageId ? { ...item, message: trimmed } : item,
      ),
    );
    cancelEditingMessage();
  }

  useEffect(() => {
    if (!user || !currentWorkspace) return;

    markInboxAsRead();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void getMessages();
    const intervalId = window.setInterval(() => {
      if (editingMessageId !== null) return;
      void getMessages();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentWorkspace, editingMessageId, getMessages, markInboxAsRead, user]);

  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-[color:var(--ws-bg)] h-dvh overflow-hidden text-[color:var(--ws-fg)]">
        <div className="h-full p-4">
          <div className="w-full h-full overflow-hidden rounded-2xl border border-[color:var(--ws-border)] bg-[color:var(--ws-surface)] p-4 shadow-sm">
            <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-4">
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

              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                onWheel={handleMessagesWheel}
                className="w-full min-h-0 overflow-y-auto overscroll-contain pr-2"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {formattedMessages.length === 0 ? (
                  <div className="w-full rounded-xl border border-dashed border-[color:var(--ws-border)] bg-[color:var(--ws-surface-2)] p-4 text-sm text-[color:var(--ws-fg-muted)]">
                    {isLoading ? "Loading messages..." : "No messages yet."}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 pb-1">
                    {formattedMessages.map((item) => (
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
                                  data-chat-action-trigger
                                  onClick={() =>
                                    setOpenActionMessageId((prev) =>
                                      prev === item.id ? null : item.id,
                                    )
                                  }
                                  className="h-7 w-7 rounded-lg border border-[color:var(--ws-border)] text-[11px] text-[color:var(--ws-fg-muted)] hover:bg-[color:var(--ws-hover)]"
                                >
                                  ...
                                </button>

                                {openActionMessageId === item.id ? (
                                  <div
                                    data-chat-action-menu
                                    className="absolute right-0 top-8 z-10 flex w-28 flex-col gap-1 rounded-xl border border-[color:var(--ws-border)] bg-[color:var(--ws-surface)] p-1 shadow-sm"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => startEditingMessage(item)}
                                      className="rounded-lg px-2 py-1 text-left text-[11px] text-[color:var(--ws-fg-muted)] hover:bg-[color:var(--ws-hover)]"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMessageId(null);
                                        setDeleteConfirmMessageId((prev) =>
                                          prev === item.id ? null : item.id,
                                        );
                                      }}
                                      className="rounded-lg px-2 py-1 text-left text-[11px] text-red-300 hover:bg-[color:var(--ws-hover)]"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ) : null}

                                <div
                                  className={`${
                                    deleteConfirmMessageId === item.id
                                      ? "flex"
                                      : "hidden"
                                  } absolute right-0 top-8 z-10 w-44 max-w-[calc(100vw-2rem)] flex-col items-center justify-center gap-2 rounded-xl border border-[color:var(--ws-border)] bg-[color:var(--ws-surface)] p-3 text-center text-[11px] text-[color:var(--ws-fg-muted)] shadow-sm`}
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

                          {editingMessageId === item.id ? (
                            <div className="mt-2 flex flex-col gap-2">
                              <textarea
                                value={editingMessageText}
                                onChange={(e) =>
                                  setEditingMessageText(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    (e.ctrlKey || e.metaKey)
                                  ) {
                                    e.preventDefault();
                                    void saveEditedMessage(item.id);
                                  }
                                }}
                                className="min-h-[70px] w-full resize-y rounded-xl border border-[color:var(--ws-border)] bg-[color:var(--ws-surface)] px-3 py-2 text-sm text-[color:var(--ws-fg)] outline-none"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={cancelEditingMessage}
                                  className="rounded-lg border border-[color:var(--ws-border)] px-2 py-1 text-[11px] text-[color:var(--ws-fg-muted)] hover:bg-[color:var(--ws-hover)]"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void saveEditedMessage(item.id)
                                  }
                                  disabled={!editingMessageText.trim()}
                                  className="rounded-lg border border-[color:var(--ws-border)] bg-[color:var(--ws-accent)] px-2 py-1 text-[11px] text-[color:var(--ws-accent-fg)] disabled:opacity-60"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 whitespace-pre-wrap text-sm">
                              {item.message}
                            </div>
                          )}

                          <div className="mt-2 text-[11px] text-[color:var(--ws-fg-muted)]">
                            {item.formattedDate}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                      className="mt-2 min-h-[40px] w-full resize-none rounded-xl border border-[color:var(--ws-border)] bg-[color:var(--ws-surface-2)] px-3 py-2 text-sm text-[color:var(--ws-fg)] outline-none placeholder:text-[color:var(--ws-fg-muted)]"
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
