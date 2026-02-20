import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

const WORKSPACE_SPACE_MESSAGE =
  "Workspace name cannot contain spaces. Example: \"my-workspace\" or \"my_workspace\".";

export async function POST(req: Request) {
  try {
    const { workspace, username, email } = await req.json();

    const workspaceName = typeof workspace === "string" ? workspace.trim() : "";
    const owner = typeof username === "string" ? username.trim() : "";
    const ownerEmail = typeof email === "string" ? email.trim() : "";

    if (!workspaceName || (!owner && !ownerEmail)) {
      return Response.json(
        { message: "All fields needed" },
        { status: 400 },
      );
    }

    if (/\s/.test(workspaceName)) {
      return Response.json({ message: WORKSPACE_SPACE_MESSAGE }, { status: 400 });
    }

    let idRow: unknown[] = [];

    if (ownerEmail) {
      idRow = await sql`
        SELECT id FROM users WHERE email = ${ownerEmail} LIMIT 1
      `;
    }

    if (!idRow.length && owner) {
      idRow = await sql`SELECT id FROM users WHERE name = ${owner} LIMIT 1`;
    }

    if (!idRow.length && owner) {
      idRow = await sql`
        SELECT id FROM users WHERE LOWER(name) = LOWER(${owner}) LIMIT 1
      `;
    }

    if (!idRow.length) {
      console.warn("first-workspace: user not found", {
        owner,
        ownerEmail,
      });
      return Response.json(
        { message: "User not found. Please log in again." },
        { status: 404 },
      );
    }

    const id = (idRow[0] as { id: number }).id;

    await sql`
      INSERT INTO workspaces (workspace_name, owner, owner_id)
      VALUES (${workspaceName}, ${owner}, ${id})
    `;

    return Response.json(
      { message: "Workspace created", workspace: workspaceName },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
