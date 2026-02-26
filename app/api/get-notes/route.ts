import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

function trimOrEmpty(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      username?: unknown;
      workspace?: unknown;
    } | null;

    const username = trimOrEmpty(body?.username);
    const workspace = trimOrEmpty(body?.workspace);

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

    const wsRow = await sql`
      SELECT w.id
      FROM workspaces w
      LEFT JOIN workspace_members wm
        ON wm.workspace_id = w.id AND wm.user_id = ${userId}
      WHERE w.workspace_name = ${workspace}
        AND (w.owner_id = ${userId} OR wm.user_id IS NOT NULL)
      ORDER BY w.id ASC
      LIMIT 1
    `;

    const workspaceId = (wsRow[0] as { id: number } | undefined)?.id;
    if (!workspaceId) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    const notes = await sql`
      SELECT
        n.id,
        n.title,
        n.content,
        n.is_pinned,
        u.name AS owner
      FROM notes n
      JOIN users u ON u.id = n.owner_id
      WHERE n.workspace_id = ${workspaceId}
      ORDER BY n.is_pinned DESC, n.id DESC
    `;

    return Response.json({ notes: notes ?? [] }, { status: 200 });
  } catch (error) {
    console.error("get-notes error", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
