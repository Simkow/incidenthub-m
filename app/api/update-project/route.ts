import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

type UpdateProjectBody = {
  id?: unknown;
  workspace_name?: unknown;
  owner?: unknown;
  description?: unknown;
  due_date?: unknown;
};

export async function PATCH(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as UpdateProjectBody | null;

    const idRaw = body?.id;
    const workspaceId = typeof idRaw === "number" ? idRaw : Number(idRaw);

    const description = typeof body?.description === "string" ? body.description : null;
    const workspace_name =
      typeof body?.workspace_name === "string"
        ? body.workspace_name.trim()
          ? body.workspace_name
          : "default title"
        : null;
    const due_date = typeof body?.due_date === "string" ? body.due_date : null;
    const owner = typeof body?.owner === "string" ? body.owner : null;

    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      return Response.json({ message: "workspace id not found" }, { status: 400 });
    }

      const idRow = await sql`
        SELECT id
        FROM users
        WHERE name = ${owner}
        LIMIT 1
      `;

      if (!idRow.length) {
        return Response.json({ message: "Owner not found" }, { status: 400 });
      }

      const ownerId = (idRow[0] as { id: number } | undefined)?.id as
        | number
        | undefined;

      void ownerId;

    await sql`
      UPDATE workspaces
      SET
        workspace_name = COALESCE(${workspace_name}, workspace_name),
        description = COALESCE(${description}, description),
        due_date = COALESCE(${due_date}, due_date)
      WHERE id = ${workspaceId}
    `;

    return Response.json({ message: "Task updated" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
