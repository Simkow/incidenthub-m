import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

type UpdateCalendarBody = {
    id?: unknown;
    title?: unknown;
    description?: unknown;
    start_at?: unknown;
    end_at?: unknown;
    all_day?: unknown;
    color?: unknown;
    status?: unknown;
    linked_task_id?: unknown;
    assignee?: unknown;
};

export async function PATCH(req: Request) {
    try {
        const body = (await req.json().catch(() => null)) as
            | UpdateCalendarBody
            | null;

        const idRaw = body?.id;
        const eventId = typeof idRaw === "number" ? idRaw : Number(idRaw);

        if (!Number.isFinite(eventId) || eventId <= 0) {
            return Response.json({ message: "id is invalid" }, { status: 400 });
        }

        const title = typeof body?.title === "string" ? body.title.trim() : null;
        const description =
            typeof body?.description === "string" ? body.description.trim() : null;
        const start_at = typeof body?.start_at === "string" ? body.start_at : null;
        const end_at = typeof body?.end_at === "string" ? body.end_at : null;
        const all_day =
            typeof body?.all_day === "boolean" ? body.all_day : null;
        const color = typeof body?.color === "string" ? body.color.trim() : null;
        const status =
            typeof body?.status === "string" ? body.status.trim() : null;

        let assigneeId: number | null = null;
        if (typeof body?.assignee === "string") {
            const nextAssignee = body.assignee.trim();
            if (!nextAssignee) {
                return Response.json({ message: "assignee is invalid" }, { status: 400 });
            }

            const assigneeRow = await sql`
                SELECT id
                FROM users
                WHERE name = ${nextAssignee}
                LIMIT 1
            `;

            if (!assigneeRow.length) {
                return Response.json({ message: "Assignee not found" }, { status: 400 });
            }

            assigneeId = (assigneeRow[0] as { id: number }).id;
        }

        let linkedTaskId: number | null = null;
        let linkedTaskProvided = false;
        if (Object.prototype.hasOwnProperty.call(body ?? {}, "linked_task_id")) {
            linkedTaskProvided = true;
            const raw = body?.linked_task_id;
            if (raw === null || raw === "") {
                linkedTaskId = null;
            } else if (typeof raw === "number" && Number.isFinite(raw)) {
                linkedTaskId = raw;
            } else if (typeof raw === "string" && raw.trim()) {
                const parsed = Number(raw);
                if (Number.isFinite(parsed)) {
                    linkedTaskId = parsed;
                } else {
                    return Response.json(
                        { message: "linked_task_id is invalid" },
                        { status: 400 },
                    );
                }
            } else {
                return Response.json(
                    { message: "linked_task_id is invalid" },
                    { status: 400 },
                );
            }
        }

        await sql`
            UPDATE calendar_events
            SET
                title = COALESCE(${title}, title),
                description = COALESCE(${description}, description),
                start_at = COALESCE(${start_at}, start_at),
                end_at = COALESCE(${end_at}, end_at),
                all_day = COALESCE(${all_day}, all_day),
                color = COALESCE(${color}, color),
                status = COALESCE(${status}, status),
                assignee_id = COALESCE(${assigneeId}, assignee_id),
                linked_task_id = CASE
                    WHEN ${linkedTaskProvided} THEN ${linkedTaskId}
                    ELSE linked_task_id
                END,
                updated_at = NOW()
            WHERE id = ${eventId}
        `;

        return Response.json({ message: "Event updated" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return Response.json({ message: "Internal server error" }, { status: 500 });
    }
}