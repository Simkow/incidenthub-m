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
      username?: unknown;
      invitationId?: unknown;
      action?: unknown;
    } | null;

    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const invitationId =
      typeof body?.invitationId === "number"
        ? body.invitationId
        : typeof body?.invitationId === "string" && body.invitationId.trim()
          ? Number(body.invitationId)
          : NaN;
    const action = typeof body?.action === "string" ? body.action.trim() : "";

    if (!username || !Number.isFinite(invitationId) || !action) {
      return Response.json({ message: "Invalid payload" }, { status: 400 });
    }

    if (action !== "accept" && action !== "reject") {
      return Response.json({ message: "Invalid action" }, { status: 400 });
    }

    const userRow = await sql`SELECT id FROM users WHERE name = ${username} LIMIT 1`;
    const userId = (userRow[0] as { id: number } | undefined)?.id;
    if (!userId) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    await ensureWorkspaceInvitationsTable();

    const invRow = await sql`
      SELECT id, workspace_id
      FROM workspace_invitations
      WHERE id = ${invitationId}
        AND invitee_user_id = ${userId}
        AND status = 'pending'
      LIMIT 1
    `;

    const inv = (invRow[0] as { id: number; workspace_id: number } | undefined) ?? null;
    if (!inv?.id) {
      return Response.json({ message: "Invitation not found" }, { status: 404 });
    }

    if (action === "accept") {
      await sql`
        INSERT INTO workspace_members (workspace_id, user_id, role)
        SELECT ${inv.workspace_id}, ${userId}, 'member'
        WHERE NOT EXISTS (
          SELECT 1
          FROM workspace_members
          WHERE workspace_id = ${inv.workspace_id} AND user_id = ${userId}
        )
      `;

      await sql`
        UPDATE workspace_invitations
        SET status = 'accepted', responded_at = now()
        WHERE id = ${invitationId}
      `;

      return Response.json({ message: "Invitation accepted" }, { status: 200 });
    }

    await sql`
      UPDATE workspace_invitations
      SET status = 'rejected', responded_at = now()
      WHERE id = ${invitationId}
    `;

    return Response.json({ message: "Invitation rejected" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
