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

export type PendingInvitation = {
  id: number;
  workspace: string;
  inviter: string;
  created_at: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      username?: unknown;
    } | null;

    const username = typeof body?.username === "string" ? body.username.trim() : "";
    if (!username) {
      return Response.json({ message: "username is invalid" }, { status: 400 });
    }

    const userRow = await sql`SELECT id FROM users WHERE name = ${username} LIMIT 1`;
    const userId = (userRow[0] as { id: number } | undefined)?.id;
    if (!userId) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const rows = await sql`
      SELECT wi.id, wi.status,
             w.workspace_name AS workspace,
             u.name AS inviter,
             wi.created_at
      FROM workspace_invitations wi
      JOIN workspaces w ON w.id = wi.workspace_id
      JOIN users u ON u.id = wi.inviter_user_id
      WHERE wi.invitee_user_id = ${userId}
        AND wi.status = 'pending'
      ORDER BY wi.created_at DESC
    `;

    const invitations = rows
      .map((r) => r as Partial<PendingInvitation> & { created_at?: unknown })
      .map((r) => ({ ...r, created_at: toDateString(r.created_at) }))
      .filter((r): r is PendingInvitation =>
        typeof r.id === "number" &&
        typeof r.workspace === "string" &&
        typeof r.inviter === "string" &&
        typeof r.created_at === "string" &&
        !!r.created_at,
      );

    return Response.json({ invitations }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
