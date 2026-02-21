import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

type DeleteWorkspaceBody = {
  username?: unknown;
  workspace?: unknown;
};

export async function DELETE(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | DeleteWorkspaceBody
      | null;

    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const workspace = typeof body?.workspace === "string" ? body.workspace.trim() : "";

    if (!username || !workspace) {
      return Response.json(
        { message: "username and workspace are required" },
        { status: 400 },
      );
    }

    const userRow = await sql`
      SELECT id
      FROM users
      WHERE name = ${username}
      LIMIT 1
    `;

    const userId = (userRow[0] as { id: number } | undefined)?.id;
    if (!userId) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    // Resolve the workspace either by ownership or membership (names are not globally unique).
    const wsRow = await sql`
      SELECT w.id, w.owner_id
      FROM workspaces w
      LEFT JOIN workspace_members wm
        ON wm.workspace_id = w.id
       AND wm.user_id = ${userId}
      WHERE w.workspace_name = ${workspace}
        AND (w.owner_id = ${userId} OR wm.user_id = ${userId})
      ORDER BY (w.owner_id = ${userId}) DESC, w.id ASC
      LIMIT 1
    `;

    const ws = (wsRow[0] as { id: number; owner_id: number } | undefined) ?? null;
    if (!ws?.id) {
      return Response.json({ message: "Workspace not found" }, { status: 404 });
    }

    if (ws.owner_id !== userId) {
      return Response.json(
        { message: "Only the workspace owner can delete this workspace" },
        { status: 403 },
      );
    }

    await sql`
      DELETE FROM tasks
      WHERE workspace_id = ${ws.id}
    `;

    await sql`
      DELETE FROM workspace_members
      WHERE workspace_id = ${ws.id}
    `;

    await sql`
      DELETE FROM workspaces
      WHERE id = ${ws.id}
    `;

    return Response.json({ message: "Workspace deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
