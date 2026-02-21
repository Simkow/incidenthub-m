import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { username?: unknown; workspace?: unknown }
      | null;

    const username =
      typeof body?.username === "string" ? body.username.trim() : "";
    const workspace =
      typeof body?.workspace === "string" ? body.workspace.trim() : "";

    if (!username || !workspace) {
      return Response.json(
        { message: "Invalid username or workspace" },
        { status: 400 },
      );
    }

    const workspaceIdRow = await sql`
      SELECT id, owner_id
      FROM workspaces
      WHERE workspace_name = ${workspace}
      ORDER BY id ASC
      LIMIT 1
    `;

    const ws =
      (workspaceIdRow[0] as { id: number; owner_id: number } | undefined) ??
      null;

    if (!ws?.id) {
      return Response.json({ message: "Workspace not found" }, { status: 404 });
    }

    const usernameIdRow = await sql`
      SELECT id FROM users WHERE name = ${username} LIMIT 1
    `;

    const user =
      (usernameIdRow[0] as { id: number } | undefined) ?? null;

    if (!user?.id) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    if (ws.owner_id && user.id === ws.owner_id) {
      return Response.json(
        { message: "Cannot remove workspace owner" },
        { status: 400 },
      );
    }

    await sql`
      DELETE FROM workspace_members
      WHERE workspace_id = ${ws.id} AND user_id = ${user.id}
    `;

    return Response.json({ message: "Removed member successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
