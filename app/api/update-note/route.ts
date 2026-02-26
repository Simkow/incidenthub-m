import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

function trimOrEmpty(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

type UpdateNoteBody = {
  id?: unknown;
  username?: unknown;
  title?: unknown;
  content?: unknown;
  is_pinned?: unknown;
};

export async function PATCH(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as UpdateNoteBody | null;

    const idRaw = body?.id;
    const noteId = typeof idRaw === "number" ? idRaw : Number(idRaw);

    if (!Number.isFinite(noteId) || noteId <= 0) {
      return Response.json({ message: "id is invalid" }, { status: 400 });
    }

    const username = trimOrEmpty(body?.username);
    if (!username) {
      return Response.json({ message: "username is invalid" }, { status: 400 });
    }

    const userRow = await sql`
      SELECT id
      FROM users
      WHERE name = ${username}
      LIMIT 1
    `;

    const userId = (userRow[0] as { id: number } | undefined)?.id;
    if (!userId) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const noteRow = await sql`
      SELECT id, workspace_id
      FROM notes
      WHERE id = ${noteId}
      LIMIT 1
    `;

    const workspaceId = (
      noteRow[0] as { workspace_id: number } | undefined
    )?.workspace_id;

    if (!workspaceId) {
      return Response.json({ message: "Note not found" }, { status: 404 });
    }

    const access = await sql`
      SELECT 1
      FROM workspaces w
      LEFT JOIN workspace_members wm
        ON wm.workspace_id = w.id AND wm.user_id = ${userId}
      WHERE w.id = ${workspaceId}
        AND (w.owner_id = ${userId} OR wm.user_id IS NOT NULL)
      LIMIT 1
    `;

    if (!access.length) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    const title = typeof body?.title === "string" ? body.title : null;
    const content = typeof body?.content === "string" ? body.content : null;
    const is_pinned =
      typeof body?.is_pinned === "boolean" ? body.is_pinned : null;

    await sql`
      UPDATE notes
      SET
        title = COALESCE(${title}, title),
        content = COALESCE(${content}, content),
        is_pinned = COALESCE(${is_pinned}, is_pinned)
      WHERE id = ${noteId}
    `;

    return Response.json({ message: "Note updated" }, { status: 200 });
  } catch (error) {
    console.error("update-note error", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
