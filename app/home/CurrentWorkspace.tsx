"use client";

import { useEffect, useState } from "react";

function readWorkspaceFromLocalStorage(): string | null {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem("workspace");
  if (!stored) return null;

  try {
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed === "string") return parsed;

    if (parsed && typeof parsed === "object" && "workspace" in parsed) {
      const obj = parsed as { workspace?: unknown };
      const value =
        typeof obj.workspace === "string"
          ? obj.workspace
          : String(obj.workspace ?? "");
      window.localStorage.setItem("workspace", JSON.stringify(value));
      return value;
    }
  } catch {
    // stary format, np. {workspace:uno} bez cudzysłowów
    const match = stored.match(/^\s*\{workspace:([^}]+)\}\s*$/);
    if (match) {
      const value = match[1];
      window.localStorage.setItem("workspace", JSON.stringify(value));
      return value;
    }

    return stored.replace(/"/g, "");
  }

  return null;
}

export function useCurrentWorkspace(userName?: string | null) {
  const [workspace, setWorkspace] = useState<string | null>(() =>
    readWorkspaceFromLocalStorage(),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (workspace) return;
    if (!userName) return;

    // 2. fallback do backendu – pierwszy workspace z bazy
    (async () => {
      try {
        const res = await fetch("/api/get-workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: userName }),
        });
        if (!res.ok) return;

        const data = await res.json();
        const name = data.workspace as string | null;
        if (!name) return;

        setWorkspace(name);
        window.localStorage.setItem("workspace", JSON.stringify(name));
      } catch (err) {
        console.error("Failed to fetch first workspace", err);
      }
    })();
  }, [userName, workspace]);

  return workspace;
}
