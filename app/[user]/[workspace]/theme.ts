export type WorkspaceThemeId =
  | "default-dark"
  | "blue-light"
  | "blue-dark"
  | "beige-light"
  | "beige-dark"
  | "orange-light"
  | "purple-dark";

export const WORKSPACE_THEMES: Array<{ id: WorkspaceThemeId; label: string }> = [
  { id: "default-dark", label: "Default (current)" },
  { id: "blue-light", label: "Blue (light)" },
  { id: "blue-dark", label: "Blue (dark)" },
  { id: "beige-light", label: "Beige (light)" },
  { id: "beige-dark", label: "Beige (dark)" },
  { id: "orange-light", label: "Orange (light)" },
  { id: "purple-dark", label: "Purple (dark)" },
];

export function isWorkspaceThemeId(value: unknown): value is WorkspaceThemeId {
  return (
    typeof value === "string" &&
    WORKSPACE_THEMES.some((t) => t.id === value)
  );
}
