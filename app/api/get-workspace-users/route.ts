import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { workspace?: unknown }
      | null;

    const workspace =
      typeof body?.workspace === "string" ? body.workspace.trim() : "";

    if (!workspace) {
      return Response.json({ message: "workspace is invalid" }, { status: 400 });
    }

    const wsRow = await sql`
      SELECT id, owner
      FROM workspaces
      WHERE workspace_name = ${workspace}
      ORDER BY id ASC
      LIMIT 1
    `;

    const ws = (wsRow[0] as { id: number; owner: string } | undefined) ?? null;

    if (!ws?.id) {
      return Response.json({ message: "Workspace not found" }, { status: 404 });
    }

    const ownerName = typeof ws.owner === "string" ? ws.owner.trim() : "";

    const userRows = await sql`
      SELECT DISTINCT u.name
      FROM users u
      JOIN tasks t
        ON (t.assignee_id = u.id OR t.created_by = u.id)
      WHERE t.workspace_id = ${ws.id}
      ORDER BY u.name ASC
    `;

    const fromTasks = userRows
      .map((r) => (r as { name?: unknown }).name)
      .filter((n): n is string => typeof n === "string")
      .map((n) => n.trim())
      .filter(Boolean);

    const users = Array.from(
      new Set([...(ownerName ? [ownerName] : []), ...fromTasks]),
    );

    return Response.json({ users }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
