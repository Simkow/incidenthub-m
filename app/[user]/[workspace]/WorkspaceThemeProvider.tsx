"use client";

import React from "react";
import {
  isWorkspaceThemeId,
  WORKSPACE_THEMES,
  type WorkspaceThemeId,
} from "./theme";

type WorkspaceThemeContextValue = {
  theme: WorkspaceThemeId;
  setTheme: (next: WorkspaceThemeId) => Promise<void>;
  themes: Array<{ id: WorkspaceThemeId; label: string }>;
};

const WorkspaceThemeContext =
  React.createContext<WorkspaceThemeContextValue | null>(null);

function storageKey(username: string, workspace: string) {
  return `ws-theme:${username}:${workspace}`;
}

export function useWorkspaceTheme() {
  const ctx = React.useContext(WorkspaceThemeContext);
  if (!ctx) {
    throw new Error(
      "useWorkspaceTheme must be used within WorkspaceThemeProvider",
    );
  }
  return ctx;
}

export function WorkspaceThemeProvider({
  username,
  workspace,
  children,
}: {
  username: string;
  workspace: string;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] =
    React.useState<WorkspaceThemeId>("default-dark");
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const key = storageKey(username, workspace);
    const local = window.localStorage.getItem(key);
    if (isWorkspaceThemeId(local)) {
      setThemeState(local);
    }

    const load = async () => {
      try {
        const res = await fetch("/api/workspace-theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, workspace }),
        });

        const data = (await res.json().catch(() => null)) as {
          theme?: unknown;
        } | null;

        if (!res.ok) return;

        if (isWorkspaceThemeId(data?.theme)) {
          setThemeState(data!.theme);
          window.localStorage.setItem(key, data!.theme);
        }
      } catch {
        // ignore: localStorage fallback covers offline
      } finally {
        setLoaded(true);
      }
    };

    void load();
  }, [username, workspace]);

  const setTheme = React.useCallback(
    async (next: WorkspaceThemeId) => {
      setThemeState(next);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey(username, workspace), next);
      }

      try {
        await fetch("/api/workspace-theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, workspace, theme: next }),
        });
      } catch {
        // ignore
      }
    },
    [username, workspace],
  );

  const value = React.useMemo<WorkspaceThemeContextValue>(
    () => ({ theme, setTheme, themes: WORKSPACE_THEMES }),
    [theme, setTheme],
  );

  return (
    <WorkspaceThemeContext.Provider value={value}>
      <div
        className="ws-theme min-h-screen"
        data-ws-theme={theme}
        data-ws-theme-loaded={loaded ? "1" : "0"}
      >
        {children}
      </div>
    </WorkspaceThemeContext.Provider>
  );
}
