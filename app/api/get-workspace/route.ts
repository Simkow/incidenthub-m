import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username) {
      return Response.json({ message: "Username value needed" }, { status: 400 });
    }

    const users = await sql`
      SELECT id
      FROM users
      WHERE name = ${username}
      LIMIT 1
    `;

    if (!users.length) {
      return Response.json({ workspace: null }, { status: 200 });
    }

    const userId = (users[0] as { id: number }).id;

    const workspaces = await sql`
      SELECT workspace_name
      FROM workspaces
      WHERE owner_id = ${userId}
      ORDER BY id ASC
      LIMIT 1
    `;

    const firstOwned =
      (workspaces[0] as { workspace_name: string } | undefined) ?? null;
    if (firstOwned?.workspace_name) {
      return Response.json(
        { workspace: firstOwned.workspace_name },
        { status: 200 },
      );
    }

    const member = await sql`
      SELECT w.workspace_name
      FROM workspace_members wm
      JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = ${userId}
      ORDER BY w.id ASC
      LIMIT 1
    `;

    const firstMember =
      (member[0] as { workspace_name: string } | undefined) ?? null;
    return Response.json(
      { workspace: firstMember?.workspace_name ?? null },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
