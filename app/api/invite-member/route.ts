import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

async function ensureWorkspaceInvitationsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS workspace_invitations (
      id SERIAL PRIMARY KEY,
      workspace_id INTEGER NOT NULL,
      inviter_user_id INTEGER NOT NULL,
      invitee_user_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      responded_at TIMESTAMPTZ NULL,
      UNIQUE (workspace_id, invitee_user_id)
    )
  `;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      inviter?: unknown;
      username?: unknown;
      workspace?: unknown;
    } | null;

    const inviter =
      typeof body?.inviter === "string" ? body.inviter.trim() : "";
    const invitee =
      typeof body?.username === "string" ? body.username.trim() : "";
    const workspace =
      typeof body?.workspace === "string" ? body.workspace.trim() : "";

    if (!inviter || !invitee || !workspace) {
      return Response.json(
        { message: "inviter, username and workspace are required" },
        { status: 400 },
      );
    }

    const inviterRow =
      await sql`SELECT id FROM users WHERE name = ${inviter} LIMIT 1`;
    const inviterId = (inviterRow[0] as { id: number } | undefined)?.id;
    if (!inviterId) {
      return Response.json({ message: "Inviter not found" }, { status: 404 });
    }

    const inviteeRow =
      await sql`SELECT id FROM users WHERE name = ${invitee} LIMIT 1`;
    const inviteeId = (inviteeRow[0] as { id: number } | undefined)?.id;
    if (!inviteeId) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    // Workspace names are not globally unique in this app (unique per owner),
    // so always resolve the workspace owned by the inviter.
    const wsRow = await sql`
      SELECT id
      FROM workspaces
      WHERE workspace_name = ${workspace}
        AND owner_id = ${inviterId}
      ORDER BY id ASC
      LIMIT 1
    `;

    const ws = (wsRow[0] as { id: number } | undefined) ?? null;
    if (!ws?.id) {
      const exists = await sql`
        SELECT 1
        FROM workspaces
        WHERE workspace_name = ${workspace}
        LIMIT 1
      `;

      if (exists.length) {
        return Response.json(
          { message: "Only the workspace owner can invite members" },
          { status: 403 },
        );
      }

      return Response.json({ message: "Workspace not found" }, { status: 404 });
    }

    const alreadyMember = await sql`
      SELECT 1
      FROM workspace_members
      WHERE workspace_id = ${ws.id} AND user_id = ${inviteeId}
      LIMIT 1
    `;

    if (alreadyMember.length) {
      return Response.json(
        { message: "User is already a member" },
        { status: 409 },
      );
    }

    await ensureWorkspaceInvitationsTable();

    await sql`
      INSERT INTO workspace_invitations (workspace_id, inviter_user_id, invitee_user_id, status)
      VALUES (${ws.id}, ${inviterId}, ${inviteeId}, 'pending')
      ON CONFLICT (workspace_id, invitee_user_id)
      DO UPDATE SET status = 'pending', inviter_user_id = EXCLUDED.inviter_user_id, responded_at = NULL
    `;

    return Response.json(
      { message: "Invitation sent" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
