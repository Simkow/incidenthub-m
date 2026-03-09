import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      username?: unknown;
      workspace?: unknown;
    } | null;

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
      const anyWs = await sql`
        SELECT 1
        FROM workspaces
        WHERE workspace_name = ${workspace}
        LIMIT 1
      `;

      return Response.json(
        { message: anyWs.length ? "Forbidden" : "Workspace not found" },
        { status: anyWs.length ? 403 : 404 },
      );
    }

    const inserted = await sql`
      INSERT INTO calendar_events (
        workspace_id,
        created_by,
        assignee_id,
        title,
        description,
        start_at,
        end_at,
        all_day,
        color,
        status,
        linked_task_id
      )
      SELECT
        t.workspace_id,
        COALESCE(t.created_by, t.assignee_id),
        t.assignee_id,
        t.title,
        t.description,
        t.due_date,
        t.due_date,
        ${true},
        ${null},
        ${"planned"},
        t.id
      FROM tasks t
      WHERE t.workspace_id = ${workspaceId}
        AND t.due_date IS NOT NULL
        AND (t.created_by IS NOT NULL OR t.assignee_id IS NOT NULL)
        AND NOT EXISTS (
          SELECT 1
          FROM calendar_events e
          WHERE e.linked_task_id = t.id
        )
      RETURNING id
    `;

    return Response.json(
      { message: "Calendar synced", inserted: inserted.length },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
