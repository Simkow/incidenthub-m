import { sql } from "../../lib/db";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username) {
      return Response.json(
        { message: "Username value needed" },
        { status: 400 }
      );
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

    return Response.json(
      { workspace: workspaces[0].workspace_name },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}