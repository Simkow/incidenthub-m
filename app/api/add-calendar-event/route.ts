import { sql } from "../../lib/db";

export async function POST(req: Request) {
    try {
        const {
            title,
            description,
            start_at,
            end_at,
            all_day,
            color,
            status,
            linked_task_id,
            assignee,
            workspace,
            created_by,
        } = await req.json();

        if (!title || !start_at || !end_at || !assignee || !workspace || !created_by) {
            return Response.json(
                { message: "Please fill in all required fields" },
                { status: 400 },
            );
        }

        const assigneeRow = await sql`
            SELECT id
            FROM users
            WHERE name = ${String(assignee).trim()}
            LIMIT 1
        `;

        if (!assigneeRow.length) {
            return Response.json({ message: "Assignee not found" }, { status: 400 });
        }

        const assigneeId = (assigneeRow[0] as { id: number }).id;

        const creatorRow = await sql`
            SELECT id
            FROM users
            WHERE name = ${String(created_by).trim()}
            LIMIT 1
        `;

        if (!creatorRow.length) {
            return Response.json({ message: "Creator not found" }, { status: 400 });
        }

        const creatorId = (creatorRow[0] as { id: number }).id;

        const workspaceName = String(workspace ?? "").trim();
        if (!workspaceName) {
            return Response.json(
                { message: "workspace is required" },
                { status: 400 },
            );
        }

        const wsRow = await sql`
            SELECT w.id
            FROM workspaces w
            LEFT JOIN workspace_members wm
                ON wm.workspace_id = w.id AND wm.user_id = ${creatorId}
            WHERE w.workspace_name = ${workspaceName}
                AND (w.owner_id = ${creatorId} OR wm.user_id IS NOT NULL)
            ORDER BY w.id ASC
            LIMIT 1
        `;

        if (!wsRow.length) {
            return Response.json({ message: "Forbidden" }, { status: 403 });
        }

        const workspaceId = (wsRow[0] as { id: number }).id;

        const allDay = typeof all_day === "boolean" ? all_day : false;
        const safeStatus = typeof status === "string" && status.trim()
            ? status.trim()
            : "planned";
        const safeColor = typeof color === "string" && color.trim()
            ? color.trim()
            : null;
        const safeDescription = typeof description === "string" && description.trim()
            ? description.trim()
            : null;
        const linkedTaskId =
            typeof linked_task_id === "number" && Number.isFinite(linked_task_id)
                ? linked_task_id
                : null;

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
            VALUES (
                ${workspaceId},
                ${creatorId},
                ${assigneeId},
                ${String(title).trim()},
                ${safeDescription},
                ${start_at},
                ${end_at},
                ${allDay},
                ${safeColor},
                ${safeStatus},
                ${linkedTaskId}
            )
            RETURNING id
        `;

        const id = (inserted[0] as { id: number } | undefined)?.id ?? null;

        return Response.json(
            { message: "Event added successfully", id },
            { status: 201 },
        );
    } catch (error) {
        console.error(error);
        return Response.json({ message: "Internal server error" }, { status: 500 });
    }
}