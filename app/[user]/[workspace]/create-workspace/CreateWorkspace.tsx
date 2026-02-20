"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

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
  const [error, setError] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const safeName = trimOrEmpty(name);

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
      className="w-full min-h-screen bg-[#121212] flex py-2"
    >
      <main className="w-full border-y border-l rounded-l-xl border-[#2e2e2e] bg-[#181818] items-center gap-8 text-white relative">
        <div className="h-full md:max-h-screen manrope text-white flex items-center justify-center">
          <div className="w-full max-w-xl p-8">
            <h1 className="text-2xl font-semibold text-center">
              Create workspace
            </h1>
            <p className="text-neutral-400 text-sm mt-2 text-center">
              Current workspace:{" "}
              <span className="text-neutral-200">{currentWorkspace}</span>
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="workspaceName"
                  className="text-neutral-400 text-sm"
                >
                  Workspace name
                </label>
                <input
                  id="workspaceName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-neutral-900 bg-neutral-300 border border-neutral-500 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-neutral-300 text-sm"
                  placeholder="Enter workspace name"
                  autoComplete="off"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="workspaceDescription"
                  className="text-neutral-400 text-sm"
                >
                  Description (optional)
                </label>
                <textarea
                  id="workspaceDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-neutral-900 bg-neutral-300 border border-neutral-500 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-neutral-300 text-sm min-h-24"
                  placeholder="What is this workspace for?"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="workspaceDueDate"
                  className="text-neutral-400 text-sm"
                >
                  Due date (optional)
                </label>
                <input
                  id="workspaceDueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="text-neutral-900 bg-neutral-300 border border-neutral-500 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-neutral-300 text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="workspaceUrl"
                  className="text-neutral-400 text-sm"
                >
                  Workspace URL
                </label>
                <input
                  id="workspaceUrl"
                  readOnly
                  type="text"
                  value={`/${user}/${safeName || "<workspace>"}`}
                  className="text-neutral-700 bg-neutral-300 border border-neutral-500 rounded-lg px-4 py-2 w-full text-sm"
                />
              </div>

              {error ? (
                <div className="text-red-400 text-sm">{error}</div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className={
                  "bg-black text-white rounded-lg px-6 py-3 transition cursor-pointer " +
                  (isSubmitting
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-neutral-800")
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
