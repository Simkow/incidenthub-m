import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const {
      title,
      priority,
      description,
      due_date,
      assignee,
      workspace,
      created_by,
    } = await req.json();

    if (!title || !priority || !description || !due_date || !assignee) {
      return Response.json(
        { message: "Please fill in all required fields" },
        { status: 400 },
      );
    }

    const idRow = await sql`SELECT id FROM users WHERE name = ${assignee} LIMIT 1`;

    if (!idRow.length) {
      return Response.json({ message: "Assignee not found" }, { status: 400 });
    }
    const id = (idRow[0] as { id: number }).id;

    let createdById: number | null = null;
    if (typeof created_by === "number" && Number.isFinite(created_by)) {
      createdById = created_by;
    } else if (typeof created_by === "string" && created_by.trim()) {
      const createdRow = await sql`
        SELECT id
        FROM users
        WHERE name = ${created_by.trim()}
        LIMIT 1
      `;

      if (!createdRow.length) {
        return Response.json(
          { message: "Creator not found" },
          { status: 400 },
        );
      }

      createdById = (createdRow[0] as { id: number }).id;
    }

    const workspaceName = String(workspace ?? "").trim();
    let workspaceId: number | null = null;

    if (workspaceName) {
      const wsRow = await sql`
        SELECT id
        FROM workspaces
        WHERE workspace_name = ${workspaceName}
        LIMIT 1
      `;

      if (!wsRow.length) {
        return Response.json(
          { message: "Workspace not found" },
          { status: 400 },
        );
      }

      workspaceId = (wsRow[0] as { id: number }).id;
    }

    if (workspaceId !== null) {
      if (createdById !== null) {
        await sql`
          INSERT INTO tasks (title, description, priority, due_date, assignee_id, workspace_id, created_by, assignee)
          VALUES (${title}, ${description}, ${priority}, ${due_date}, ${id}, ${workspaceId}, ${createdById}, ${assignee})
        `;
      } else {
        await sql`
          INSERT INTO tasks (title, description, priority, due_date, assignee_id, workspace_id, assignee)
          VALUES (${title}, ${description}, ${priority}, ${due_date}, ${id}, ${workspaceId}, ${assignee})
        `;
      }
    } else {
      if (createdById !== null) {
        await sql`
          INSERT INTO tasks (title, description, priority, due_date, assignee_id, created_by, assignee)
          VALUES (${title}, ${description}, ${priority}, ${due_date}, ${id}, ${createdById}, ${assignee})
        `;
      } else {
        await sql`
          INSERT INTO tasks (title, description, priority, due_date, assignee_id, assignee)
          VALUES (${title}, ${description}, ${priority}, ${due_date}, ${id}, ${assignee})
        `;
      }
    }

    return Response.json({ message: "Task added successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
