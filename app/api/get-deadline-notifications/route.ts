import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      username?: unknown;
      workspace?: unknown;
      hours?: unknown;
      days?: unknown;
      limit?: unknown;
    } | null;

    const username =
      typeof body?.username === "string" ? body.username.trim() : "";
    const workspace =
      typeof body?.workspace === "string" ? body.workspace.trim() : "";

    const daysRaw = body?.days;
    const days =
      typeof daysRaw === "number"
        ? daysRaw
        : typeof daysRaw === "string"
          ? Number(daysRaw)
          : 1;

    const limitRaw = body?.limit;
    const limit =
      typeof limitRaw === "number"
        ? limitRaw
        : typeof limitRaw === "string"
          ? Number(limitRaw)
          : 5;

    if (!username) {
      return Response.json({ message: "username is invalid" }, { status: 400 });
    }

    if (!workspace) {
      return Response.json({ message: "workspace is invalid" }, { status: 400 });
    }

    if (!Number.isFinite(days) || days < 1 || days > 30) {
      return Response.json({ message: "days is invalid" }, { status: 400 });
    }

    if (!Number.isFinite(limit) || limit <= 0 || limit > 50) {
      return Response.json({ message: "limit is invalid" }, { status: 400 });
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

    // Due in N days (date-only semantics). For "1 day left" use days=1 (due tomorrow).
    const tasks = await sql`
      SELECT t.id, t.title, t.due_date, t.priority
      FROM tasks t
      WHERE t.workspace_id = ${workspaceId}
        AND t.is_finished = false
        AND t.due_date IS NOT NULL
        AND (t.due_date::date) = (CURRENT_DATE + ${days})
      ORDER BY t.due_date ASC, t.id ASC
      LIMIT ${limit}
    `;

    const countRow = await sql`
      SELECT COUNT(*)::int AS count
      FROM tasks t
      WHERE t.workspace_id = ${workspaceId}
        AND t.is_finished = false
        AND t.due_date IS NOT NULL
        AND (t.due_date::date) = (CURRENT_DATE + ${days})
    `;

    const count = (countRow[0] as { count: number } | undefined)?.count ?? 0;

    return Response.json({ count, tasks: tasks ?? [] }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
