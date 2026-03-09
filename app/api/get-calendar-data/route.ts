import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const body = (await req.json().catch(() => null)) as {
            username?: unknown;
            workspace?: unknown;
            from?: unknown;
            to?: unknown;
        } | null;

        const username = typeof body?.username === "string" ? body.username.trim() : "";
        const workspace = typeof body?.workspace === "string" ? body.workspace.trim() : "";
        const from = typeof body?.from === "string" ? body.from : "";
        const to = typeof body?.to === "string" ? body.to : "";

        if (!username || !workspace || !from || !to) {
            return Response.json({ message: "Some fields are empty" }, { status: 400 });
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

        const events = await sql`
            SELECT
                e.id,
                e.title,
                e.description,
                e.start_at,
                e.end_at,
                e.all_day,
                e.color,
                e.status,
                e.linked_task_id,
                e.assignee_id
            FROM calendar_events e
            WHERE e.workspace_id = ${workspaceId}
                AND e.start_at < ${to}
                AND e.end_at >= ${from}
            ORDER BY e.start_at ASC, e.id ASC
        `;

        return Response.json({ events: events ?? [] }, { status: 200 });
    } catch (error) {
        console.error(error);
        return Response.json({ message: "Internal server error" }, { status: 500 });
    }
}