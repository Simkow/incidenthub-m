import { sql } from "../../lib/db";

type UpdateTaskBody = {
  id?: unknown;
  title?: unknown;
  priority?: unknown;
  description?: unknown;
  due_date?: unknown;
  assignee?: unknown;
  is_finished?: unknown;
};

export async function PATCH(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as UpdateTaskBody | null;

    const idRaw = body?.id;
    const taskId = typeof idRaw === "number" ? idRaw : Number(idRaw);

    if (!Number.isFinite(taskId) || taskId <= 0) {
      return Response.json({ message: "id is invalid" }, { status: 400 });
    }

    const title = typeof body?.title === "string" ? body.title : null;
    const description =
      typeof body?.description === "string" ? body.description : null;
    const priority = typeof body?.priority === "string" ? body.priority : null;
    const due_date = typeof body?.due_date === "string" ? body.due_date : null;

    const is_finished =
      typeof body?.is_finished === "boolean" ? body.is_finished : null;

    let assigneeName: string | null = null;
    let assigneeId: number | null = null;
    if (typeof body?.assignee === "string") {
      const nextAssignee = body.assignee.trim();
      if (!nextAssignee) {
        return Response.json(
          { message: "assignee is invalid" },
          { status: 400 },
        );
      }

      const idRow = await sql`
        SELECT id
        FROM users
        WHERE name = ${nextAssignee}
        LIMIT 1
      `;

      if (!idRow.length) {
        return Response.json(
          { message: "Assignee not found" },
          { status: 400 },
        );
      }

      assigneeName = nextAssignee;
      assigneeId = idRow[0].id as number;
    }

    await sql`
      UPDATE tasks
      SET
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        priority = COALESCE(${priority}, priority),
        due_date = COALESCE(${due_date}, due_date),
        is_finished = COALESCE(${is_finished}, is_finished),
        assignee = COALESCE(${assigneeName}, assignee),
        assignee_id = COALESCE(${assigneeId}, assignee_id)
      WHERE id = ${taskId}
    `;

    return Response.json({ message: "Task updated" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
