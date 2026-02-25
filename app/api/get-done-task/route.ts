import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      username?: unknown;
      workspace?: unknown;
    } | null;

    const username =
      typeof body?.username === "string" ? body.username.trim() : "";
    const workspace =
      typeof body?.workspace === "string" ? body.workspace.trim() : "";

    if (!username) {
      return Response.json({ message: "username is invalid" }, { status: 400 });
    }

    const userRow =
      await sql`SELECT id FROM users WHERE name = ${username} LIMIT 1`;
    const userId = (userRow[0] as { id: number } | undefined)?.id;

    if (!userId) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    if (workspace) {
      const wsRow = await sql`
        SELECT id
        FROM workspaces
        WHERE workspace_name = ${workspace}
        LIMIT 1
      `;

      const workspaceId = (wsRow[0] as { id: number } | undefined)?.id;
      if (!workspaceId) {
        return Response.json({ message: "Workspace not found" }, { status: 404 });
      }

      const access = await sql`
        SELECT 1
        FROM workspaces w
        WHERE w.id = ${workspaceId}
          AND (
            w.owner = ${username}
            OR EXISTS (
              SELECT 1
              FROM workspace_members wm
              WHERE wm.workspace_id = w.id
                AND wm.user_id = ${userId}
            )
          )
        LIMIT 1
      `;

      if (access.length === 0) {
        return Response.json({ message: "Forbidden" }, { status: 403 });
      }

      const data = await sql`
        SELECT
          t.id,
          t.title,
          t.priority,
          t.description,
          to_char(t.due_date::date, 'YYYY-MM-DD') AS due_date,
          t.assignee,
          t.assignee_id,
          t.is_finished,
          t.workspace_id,
          w.workspace_name
        FROM tasks t
        LEFT JOIN workspaces w ON t.workspace_id = w.id
        WHERE t.workspace_id = ${workspaceId} AND t.is_finished = true
      `;

      return Response.json({ tasks: data ?? [] }, { status: 200 });
    }

    const data = await sql`
      SELECT
        t.id,
        t.title,
        t.priority,
        t.description,
        to_char(t.due_date::date, 'YYYY-MM-DD') AS due_date,
        t.assignee,
        t.assignee_id,
        t.is_finished,
        t.workspace_id,
        w.workspace_name
      FROM tasks t
      LEFT JOIN workspaces w ON t.workspace_id = w.id
      WHERE t.assignee_id = ${userId} AND t.is_finished = true
    `;

    return Response.json({ tasks: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
