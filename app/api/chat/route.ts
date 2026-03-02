import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

type ChatMessageRow = {
  id: number;
  message: string;
  created_at: string;
  username: string | null;
};

function trimOrEmpty(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function resolveUserId(username: string) {
  const userRow = await sql`
    SELECT id
    FROM users
    WHERE name = ${username}
    LIMIT 1
  `;

  return (userRow[0] as { id: number } | undefined)?.id ?? null;
}

async function resolveWorkspaceId(workspace: string, userId: number) {
  const wsRow = await sql`
    SELECT w.id
    FROM workspaces w
    LEFT JOIN workspace_members wm
      ON wm.workspace_id = w.id AND wm.user_id = ${userId}
    WHERE w.workspace_name = ${workspace}
      AND (w.owner_id = ${userId} OR wm.user_id IS NOT NULL)
    ORDER BY w.id ASC
    LIMIT 1
  `;

  return (wsRow[0] as { id: number } | undefined)?.id ?? null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = trimOrEmpty(searchParams.get("username"));
    const workspace = trimOrEmpty(searchParams.get("workspace"));

    if (!username || !workspace) {
      return Response.json(
        { message: "username and workspace are required" },
        { status: 400 },
      );
    }

    const userId = await resolveUserId(username);
    if (!userId) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const workspaceId = await resolveWorkspaceId(workspace, userId);
    if (!workspaceId) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    const messages = (await sql`
      SELECT
        m.id,
        m.message,
        m.created_at,
        COALESCE(m.username, u.name) AS username
      FROM chat_messages m
      LEFT JOIN users u ON u.id = m.user_id
      WHERE m.workspace_id = ${workspaceId}
      ORDER BY m.created_at ASC, m.id ASC
    `) as ChatMessageRow[];

    return Response.json({ messages: messages ?? [] }, { status: 200 });
  } catch (error) {
    console.error("chat GET error", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      username?: unknown;
      workspace?: unknown;
      message?: unknown;
    } | null;

    const username = trimOrEmpty(body?.username);
    const workspace = trimOrEmpty(body?.workspace);
    const message = trimOrEmpty(body?.message);

    if (!username || !workspace || !message) {
      return Response.json(
        { message: "username, workspace, and message are required" },
        { status: 400 },
      );
    }

    const userId = await resolveUserId(username);
    if (!userId) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const workspaceId = await resolveWorkspaceId(workspace, userId);
    if (!workspaceId) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    const insertRow = await sql`
      INSERT INTO chat_messages (user_id, username, message, workspace_id)
      VALUES (${userId}, ${username}, ${message}, ${workspaceId})
      RETURNING id
    `;

    const id = (insertRow[0] as { id: number } | undefined)?.id ?? null;
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    console.error("chat POST error", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
