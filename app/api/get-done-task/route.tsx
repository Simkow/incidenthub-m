import { sql } from "../../lib/db";

export async function POST(req: Request) {
  try {
    const { username, workspace } = (await req.json()) as {
      username?: unknown;
      workspace?: unknown;
    };

    if (typeof username !== "string" || !username.trim()) {
      return Response.json({ message: "username is invalid" }, { status: 400 });
    }

    const workspaceName = typeof workspace === "string" ? workspace.trim() : "";

    const user_id =
      await sql`SELECT id FROM users WHERE name = ${username} LIMIT 1`;
    const id = user_id[0]?.id;

    if (!id) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const data = workspaceName
      ? await sql`
            SELECT id
            FROM workspaces
            WHERE workspace_name = ${workspaceName}
            LIMIT 1
          `.then(async (wsRow) => {
          const workspaceId = wsRow[0]?.id as number | undefined;
          if (!workspaceId) return null;
          return sql`
              SELECT *
              FROM tasks
              WHERE assignee_id = ${id} AND workspace_id = ${workspaceId} AND is_finished = true
            `;
        })
      : await sql`SELECT * FROM tasks WHERE assignee_id = ${id} AND is_finished = true`;

    if (workspaceName && !data) {
      return Response.json({ message: "Workspace not found" }, { status: 404 });
    }

    return Response.json({ tasks: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
