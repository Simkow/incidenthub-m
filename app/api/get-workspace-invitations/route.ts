import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

function toDateString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return "";
}

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

export type WorkspaceInvitationRow = {
  id: number;
  invitee: string;
  status: string;
  created_at: string;
  responded_at: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      username?: unknown;
      workspace?: unknown;
    } | null;

    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const workspace = typeof body?.workspace === "string" ? body.workspace.trim() : "";

    if (!username || !workspace) {
      return Response.json({ message: "Invalid payload" }, { status: 400 });
    }

    const userRow = await sql`SELECT id FROM users WHERE name = ${username} LIMIT 1`;
    const userId = (userRow[0] as { id: number } | undefined)?.id;
    if (!userId) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const wsRow = await sql`
      SELECT id, owner_id
      FROM workspaces
      WHERE workspace_name = ${workspace}
      ORDER BY id ASC
      LIMIT 1
    `;

    const ws = (wsRow[0] as { id: number; owner_id: number } | undefined) ?? null;
    if (!ws?.id) {
      return Response.json({ message: "Workspace not found" }, { status: 404 });
    }

    if (ws.owner_id !== userId) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    await ensureWorkspaceInvitationsTable();

    const rows = await sql`
      SELECT wi.id,
             u.name AS invitee,
             wi.status,
             wi.created_at,
             wi.responded_at
      FROM workspace_invitations wi
      JOIN users u ON u.id = wi.invitee_user_id
      WHERE wi.workspace_id = ${ws.id}
      ORDER BY wi.created_at DESC
    `;

    const invitations = rows
      .map(
        (r) =>
          r as Partial<WorkspaceInvitationRow> & {
            created_at?: unknown;
            responded_at?: unknown;
          },
      )
      .map((r) => ({
        ...r,
        created_at: toDateString(r.created_at),
        responded_at:
          r.responded_at === null || typeof r.responded_at === "undefined"
            ? null
            : toDateString(r.responded_at),
      }))
      .filter((r): r is WorkspaceInvitationRow =>
        typeof r.id === "number" &&
        typeof r.invitee === "string" &&
        typeof r.status === "string" &&
        typeof r.created_at === "string" &&
        !!r.created_at &&
        (typeof r.responded_at === "string" || r.responded_at === null),
      );

    return Response.json({ invitations }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
