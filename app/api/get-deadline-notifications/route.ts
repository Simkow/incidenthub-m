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

    const hoursRaw = body?.hours;
    const hours =
      typeof hoursRaw === "number"
        ? hoursRaw
        : typeof hoursRaw === "string"
          ? Number(hoursRaw)
          : null;

    const daysRaw = body?.days;
    const daysFromBody =
      typeof daysRaw === "number"
        ? daysRaw
        : typeof daysRaw === "string"
          ? Number(daysRaw)
          : null;

    // due_date is DATE (no time). Map optional `hours`/`days` to a DATE window.
    // - if `hours` is provided: days = ceil(hours/24)
    // - else: days = `days` (default 1)
    const windowDays = (() => {
      if (hours !== null && Number.isFinite(hours)) {
        return Math.ceil(hours / 24);
      }
      if (daysFromBody !== null && Number.isFinite(daysFromBody)) {
        return Math.trunc(daysFromBody);
      }
      return 1;
    })();

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

    if (!Number.isFinite(windowDays) || windowDays < 1 || windowDays > 30) {
      return Response.json(
        { message: "days/hours window is invalid" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(limit) || limit <= 0 || limit > 50) {
      return Response.json({ message: "limit is invalid" }, { status: 400 });
    }

    const windowDaysInt = Math.trunc(windowDays);
    const limitInt = Math.trunc(limit);

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

    // due_date is DATE. Use date-only semantics: due between today and today + windowDays.
    const tasks = await sql`
      SELECT
        t.id,
        t.title,
        to_char(t.due_date::date, 'YYYY-MM-DD') AS due_date,
        t.priority
      FROM tasks t
      WHERE t.workspace_id = ${workspaceId}
        AND t.is_finished = false
        AND t.due_date IS NOT NULL
        AND (t.due_date::date) >= CURRENT_DATE
        AND (t.due_date::date) <= (CURRENT_DATE + (${windowDaysInt}::int))
      ORDER BY t.due_date ASC, t.id ASC
      LIMIT ${limitInt}
    `;

    const countRow = await sql`
      SELECT COUNT(*)::int AS count
      FROM tasks t
      WHERE t.workspace_id = ${workspaceId}
        AND t.is_finished = false
        AND t.due_date IS NOT NULL
        AND (t.due_date::date) >= CURRENT_DATE
        AND (t.due_date::date) <= (CURRENT_DATE + (${windowDaysInt}::int))
    `;

    const count = (countRow[0] as { count: number } | undefined)?.count ?? 0;

    return Response.json({ count, tasks: tasks ?? [] }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
