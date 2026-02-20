import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

type Body = {
  username?: string;
  workspace?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Body | null;
    const username = typeof body?.username === "string" ? body.username : "";
    const workspace =
      typeof body?.workspace === "string" ? body.workspace : body?.workspace ?? null;

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

    if (workspace) {
      const exists = await sql`
        SELECT 1
        FROM workspaces
        WHERE owner_id = ${userId} AND workspace_name = ${workspace}
        LIMIT 1
      `;

      if (exists.length) {
        return Response.json({ workspace }, { status: 200 });
      }
    }

    const first = await sql`
      SELECT workspace_name
      FROM workspaces
      WHERE owner_id = ${userId}
      ORDER BY id ASC
      LIMIT 1
    `;

    const firstName = (first[0] as { workspace_name: string } | undefined)
      ?.workspace_name;

    return Response.json({ workspace: firstName ?? null }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
