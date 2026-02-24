import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

function trimOrEmpty(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { requester?: unknown; username?: unknown; workspace?: unknown }
      | null;

    const requester = trimOrEmpty(body?.requester);
    const username = trimOrEmpty(body?.username);
    const workspace = trimOrEmpty(body?.workspace);

    if (!requester || !username || !workspace) {
      return Response.json(
        { message: "Invalid requester, username or workspace" },
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

    const requesterIdRow = await sql`
      SELECT id FROM users WHERE name = ${requester} LIMIT 1
    `;

    const requesterUser =
      (requesterIdRow[0] as { id: number } | undefined) ?? null;

    if (!requesterUser?.id) {
      return Response.json(
        { message: "Requester not found" },
        { status: 404 },
      );
    }

    const ownerCheckRows = await sql`
      SELECT owner_id, owner
      FROM workspaces
      WHERE id = ${ws.id}
      LIMIT 1
    `;

    const ownerCheck = (ownerCheckRows[0] as
      | { owner_id: number | null; owner: string | null }
      | undefined) ?? null;

    const isOwnerById =
      typeof ownerCheck?.owner_id === "number" &&
      ownerCheck.owner_id === requesterUser.id;
    const isOwnerByName =
      typeof ownerCheck?.owner === "string" && ownerCheck.owner === requester;

    if (!isOwnerById && !isOwnerByName) {
      return Response.json(
        { message: "Only workspace owner can remove members" },
        { status: 403 },
      );
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

    return Response.json(
      { message: "Removed member successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
