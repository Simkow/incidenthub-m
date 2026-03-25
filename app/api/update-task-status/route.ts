import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

type UpdateTaskStatusBody = {
  id?: unknown;
  status_id?: unknown;
};

export async function PATCH(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as UpdateTaskStatusBody | null;

    const taskIdRaw = body?.id;
    const statusIdRaw = body?.status_id;

    const taskId = typeof taskIdRaw === "number" ? taskIdRaw : Number(taskIdRaw);
    const statusId = typeof statusIdRaw === "number" ? statusIdRaw : Number(statusIdRaw);

    if (!Number.isFinite(taskId) || taskId <= 0) {
      return Response.json({ message: "id is invalid" }, { status: 400 });
    }

    if (!Number.isFinite(statusId) || statusId <= 0) {
      return Response.json({ message: "status_id is invalid" }, { status: 400 });
    }

    // 1) Sprawdź czy status istnieje w tabeli statuses
    const statusRow = await sql`
      SELECT id, name
      FROM task_statuses
      WHERE id = ${statusId}
      LIMIT 1
    `;

    if (!statusRow.length) {
      return Response.json({ message: "Status not found" }, { status: 400 });
    }

    const status = statusRow[0] as { id: number; name: string };
    const isDone = status.name === "done";

    // 2) Zmień status w tasku
    const updatedTask = await sql`
      UPDATE tasks
      SET
        status_id = ${status.id},
        is_finished = ${isDone}
      WHERE id = ${taskId}
      RETURNING id
    `;

    if (!updatedTask.length) {
      return Response.json({ message: "Task not found" }, { status: 404 });
    }

    // 3) Opcjonalnie: zsynchronizuj status wydarzenia kalendarza
    await sql`
      UPDATE calendar_events
      SET
        status = CASE
          WHEN ${status.name} = 'done' THEN 'done'
          WHEN ${status.name} = 'in_progress' THEN 'in_progress'
          ELSE 'planned'
        END,
        updated_at = NOW()
      WHERE linked_task_id = ${taskId}
    `;

    return Response.json({ message: "Task status updated" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}