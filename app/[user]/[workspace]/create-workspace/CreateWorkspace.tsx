"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { WorkspaceThemePicker } from "../../../components/WorkspaceThemePicker";
import { WORKSPACE_THEMES, type WorkspaceThemeId } from "../theme";

type Props = {
  user: string;
  currentWorkspace: string;
};

const WORKSPACE_SPACE_MESSAGE =
  'Workspace name cannot contain spaces. Example: "my-workspace" or "my_workspace".';

function trimOrEmpty(value: string) {
  return value.trim();
}

export const CreateWorkspace: React.FC<Props> = ({
  user,
  currentWorkspace,
}) => {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [theme, setTheme] = React.useState<WorkspaceThemeId>("default-dark");
  const [error, setError] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const safeName = trimOrEmpty(name);

  const inputClassName =
    "text-[color:var(--ws-fg)] bg-transparent border border-[color:var(--ws-border)] rounded-lg px-4 py-2 w-full focus:outline-none text-sm placeholder:text-[color:var(--ws-fg-muted)]";
  const textareaClassName = inputClassName + " min-h-24 resize-y";

  function themeStorageKey(username: string, workspace: string) {
    return `ws-theme:${username}:${workspace}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!safeName) {
      setError("Workspace name is required");
      return;
    }

    if (/\s/.test(safeName)) {
      setError(WORKSPACE_SPACE_MESSAGE);
      return;
    }

    if (!user) {
      setError("Missing user");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/create-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: user,
          workspace_name: safeName,
          description: description.trim() ? description.trim() : null,
          due_date: dueDate.trim() ? dueDate.trim() : null,
        }),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data as { message?: unknown })?.message &&
          typeof (data as { message?: unknown }).message === "string"
            ? ((data as { message: string }).message as string)
            : "Failed to create workspace";
        setError(message);
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("workspace", safeName);
        window.localStorage.setItem(themeStorageKey(user, safeName), theme);
      }

      try {
        await fetch("/api/workspace-theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user, workspace: safeName, theme }),
        });
      } catch {
        // ignore
      }

      router.push(`/${user}/${safeName}/tasks`);
    } catch (err) {
      console.error("Error creating workspace:", err);
      setError("Internal error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-[color:var(--ws-bg)] flex py-2 body-text"
    >
      <main className="w-full border-y border-l rounded-l-xl border-[color:var(--ws-border)] bg-[color:var(--ws-surface)] items-center gap-8 text-[color:var(--ws-fg)] relative">
        <div className="h-full md:max-h-screen manrope text-[color:var(--ws-fg)] flex items-center justify-center">
          <div className="w-full max-w-xl p-8">
            <h1 className="text-2xl font-semibold text-center heading">
              Create workspace
            </h1>
            <p className="text-[color:var(--ws-fg-muted)] text-sm mt-2 text-center">
              Current workspace:{" "}
              <span className="text-[color:var(--ws-fg)]">
                {currentWorkspace}
              </span>
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-6 flex flex-col gap-4 p-5 rounded-lg bg-[color:var(--ws-surface-2)] border border-[color:var(--ws-border)] relative"
            >
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="workspaceName"
                  className="text-[color:var(--ws-fg-muted)] text-sm heading"
                >
                  Workspace name
                </label>
                <input
                  id="workspaceName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClassName}
                  placeholder="Enter workspace name"
                  autoComplete="off"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="workspaceDescription"
                  className="text-[color:var(--ws-fg-muted)] text-sm heading"
                >
                  Description (optional)
                </label>
                <textarea
                  id="workspaceDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={textareaClassName}
                  placeholder="What is this workspace for?"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="workspaceDueDate"
                  className="text-[color:var(--ws-fg-muted)] text-sm heading"
                >
                  Due date (optional)
                </label>
                <input
                  id="workspaceDueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClassName}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="workspaceUrl"
                  className="text-[color:var(--ws-fg-muted)] text-sm heading"
                >
                  Workspace URL
                </label>
                <input
                  id="workspaceUrl"
                  readOnly
                  type="text"
                  value={`/${user}/${safeName || "<workspace>"}`}
                  className="text-[color:var(--ws-fg-muted)] bg-transparent border border-[color:var(--ws-border)] rounded-lg px-4 py-2 w-full text-sm"
                />
              </div>

              <WorkspaceThemePicker
                value={theme}
                onChange={setTheme}
                themes={WORKSPACE_THEMES}
              />

              {error ? (
                <div className="text-red-400 text-sm">{error}</div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className={
                  "bg-[color:var(--ws-accent)] text-[color:var(--ws-accent-fg)] rounded-lg px-6 py-3 transition font-medium " +
                  (isSubmitting
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:opacity-90 cursor-pointer")
                }
              >
                {isSubmitting ? "Creating..." : "Create workspace"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </motion.main>
  );
};
