import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

function trimOrEmpty(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { owner?: unknown }
      | null;

    const owner = trimOrEmpty(body?.owner);

    if (!owner) {
      return Response.json(
        { message: "owner is invalid", workspaces: [], memberWorkspaces: [] },
        { status: 400 },
      );
    }

    const users = await sql`
      SELECT id FROM users WHERE name = ${owner} LIMIT 1
    `;

    const userId = (users[0] as { id: number } | undefined)?.id ?? null;

    if (!userId) {
      return Response.json(
        { workspaces: [], memberWorkspaces: [] },
        { status: 200 },
      );
    }

    // Keep backward compatibility: `workspaces` are owned workspaces.
    const workspaces = await sql`
      SELECT id, workspace_name, owner, owner_id, description, due_date
      FROM workspaces
      WHERE owner_id = ${userId} OR owner = ${owner}
      ORDER BY id ASC
    `;

    // Additional list: workspaces where the user is a member.
    const memberWorkspaces = await sql`
      SELECT DISTINCT w.id, w.workspace_name, w.owner, w.owner_id
      FROM workspace_members wm
      JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = ${userId}
        AND (w.owner_id IS NULL OR w.owner_id <> ${userId})
      ORDER BY w.workspace_name ASC
    `;

    return Response.json({ workspaces, memberWorkspaces }, { status: 200 });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
