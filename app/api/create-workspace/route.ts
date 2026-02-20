import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

function trimOrEmpty(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hasWhitespace(value: string) {
  return /\s/.test(value);
}

const WORKSPACE_SPACE_MESSAGE =
  "Workspace name cannot contain spaces. Example: \"my-workspace\" or \"my_workspace\".";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();

    const ownerRaw = (body as { owner?: unknown })?.owner;
    const workspaceRaw = (body as { workspace_name?: unknown })?.workspace_name;
    const descriptionRaw = (body as { description?: unknown })?.description;
    const dueDateRaw = (body as { due_date?: unknown })?.due_date;

    const owner = trimOrEmpty(ownerRaw);
    const workspace_name = trimOrEmpty(workspaceRaw);

    const descriptionText = trimOrEmpty(descriptionRaw);
    const description = descriptionText ? descriptionText : null;

    const dueDateText = trimOrEmpty(dueDateRaw);
    const due_date = dueDateText ? dueDateText : null;

    if (!owner || !workspace_name) {
      return Response.json(
        { message: "owner and workspace_name are required" },
        { status: 400 },
      );
    }

    if (hasWhitespace(workspace_name)) {
      return Response.json({ message: WORKSPACE_SPACE_MESSAGE }, { status: 400 });
    }

    if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
      return Response.json({ message: "due_date is invalid" }, { status: 400 });
    }

    const users = await sql`
      SELECT id FROM users WHERE name = ${owner} LIMIT 1
    `;

    if (!users.length) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const owner_id = (users[0] as { id: number }).id;

    const existing = await sql`
      SELECT 1
      FROM workspaces
      WHERE workspace_name = ${workspace_name} AND owner_id = ${owner_id}
      LIMIT 1
    `;

    if (existing.length) {
      return Response.json(
        { message: "Workspace already exists", workspace_name },
        { status: 409 },
      );
    }

    await sql`
      INSERT INTO workspaces (workspace_name, owner, owner_id, description, due_date)
      VALUES (${workspace_name}, ${owner}, ${owner_id}, ${description}, ${due_date})
    `;

    return Response.json(
      { message: "Workspace created", workspace_name },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating workspace:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
