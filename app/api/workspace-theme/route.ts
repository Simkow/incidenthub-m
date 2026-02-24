import { sql } from "../../lib/db";
import { isWorkspaceThemeId, type WorkspaceThemeId } from "../../[user]/[workspace]/theme";

export const dynamic = "force-dynamic";

function trimOrEmpty(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {

    const body: unknown = await req.json();
    const username = trimOrEmpty((body as { username?: unknown })?.username);
    const workspace = trimOrEmpty((body as { workspace?: unknown })?.workspace);
    const themeRaw = (body as { theme?: unknown })?.theme;

    if (!username || !workspace) {
      return Response.json(
        { message: "username and workspace are required", theme: null },
        { status: 400 },
      );
    }

    const users = await sql`
      SELECT id FROM users WHERE name = ${username} LIMIT 1
    `;

    if (!users.length) {
      return Response.json({ theme: null }, { status: 200 });
    }

    const userId = (users[0] as { id: number }).id;

    const workspaces = await sql`
      SELECT w.id
      FROM workspaces w
      LEFT JOIN workspace_members wm
        ON wm.workspace_id = w.id AND wm.user_id = ${userId}
      WHERE w.workspace_name = ${workspace}
        AND (w.owner_id = ${userId} OR wm.user_id IS NOT NULL)
      ORDER BY w.id ASC
      LIMIT 1
    `;

    const workspaceId = (workspaces[0] as { id: number } | undefined)?.id;
    if (!workspaceId) {
      return Response.json({ theme: null }, { status: 200 });
    }

    // Setter
    if (typeof themeRaw !== "undefined") {
      if (!isWorkspaceThemeId(themeRaw)) {
        return Response.json(
          { message: "Invalid theme", theme: null },
          { status: 400 },
        );
      }

      const theme = themeRaw as WorkspaceThemeId;

      await sql`
        INSERT INTO workspace_user_preferences (workspace_id, user_id, theme)
        VALUES (${workspaceId}, ${userId}, ${theme})
        ON CONFLICT (workspace_id, user_id)
        DO UPDATE SET theme = EXCLUDED.theme, updated_at = NOW()
      `;

      return Response.json({ theme }, { status: 200 });
    }

    // Getter
    const prefs = await sql`
      SELECT theme
      FROM workspace_user_preferences
      WHERE workspace_id = ${workspaceId} AND user_id = ${userId}
      LIMIT 1
    `;

    const theme = (prefs[0] as { theme: string } | undefined)?.theme;
    return Response.json(
      { theme: isWorkspaceThemeId(theme) ? theme : null },
      { status: 200 },
    );
  } catch (error) {
    console.error("workspace-theme error", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
