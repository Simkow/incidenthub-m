import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

type DeleteWorkspaceBody = {
  username?: unknown;
  workspace?: unknown;
};

export async function DELETE(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | DeleteWorkspaceBody
      | null;

    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const workspace = typeof body?.workspace === "string" ? body.workspace.trim() : "";

    if (!username || !workspace) {
      return Response.json(
        { message: "username and workspace are required" },
        { status: 400 },
      );
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
      SELECT id
      FROM workspaces
      WHERE workspace_name = ${workspace} AND owner_id = ${userId}
      LIMIT 1
    `;

    const workspaceId = (wsRow[0] as { id: number } | undefined)?.id;
    if (!workspaceId) {
      return Response.json({ message: "Workspace not found" }, { status: 404 });
    }

    await sql`
      DELETE FROM tasks
      WHERE workspace_id = ${workspaceId}
    `;

    await sql`
      DELETE FROM workspaces
      WHERE id = ${workspaceId}
    `;

    return Response.json({ message: "Workspace deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
