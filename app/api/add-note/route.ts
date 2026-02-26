import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

function trimOrEmpty(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
    try {
        const body = (await req.json().catch(() => null)) as {
            ws?: unknown;
            owner?: unknown;
            title?: unknown;
            content?: unknown;
            is_pinned?: unknown;
        } | null;

        const workspace = trimOrEmpty(body?.ws);
        const owner = trimOrEmpty(body?.owner);
        const title = trimOrEmpty(body?.title);
        const content = typeof body?.content === "string" ? body.content : "";
        const is_pinned =
            typeof body?.is_pinned === "boolean" ? body.is_pinned : false;

        if (!workspace || !owner) {
            return Response.json(
                { message: "workspace and owner are required" },
                { status: 400 },
            );
        }

        if (!title) {
            return Response.json({ message: "title is required" }, { status: 400 });
        }

        const userRow = await sql`
            SELECT id
            FROM users
            WHERE name = ${owner}
            LIMIT 1
        `;
        const ownerId = (userRow[0] as { id: number } | undefined)?.id;
        if (!ownerId) {
            return Response.json({ message: "User not found" }, { status: 404 });
        }

        const wsRow = await sql`
            SELECT w.id
            FROM workspaces w
            LEFT JOIN workspace_members wm
                ON wm.workspace_id = w.id AND wm.user_id = ${ownerId}
            WHERE w.workspace_name = ${workspace}
                AND (w.owner_id = ${ownerId} OR wm.user_id IS NOT NULL)
            ORDER BY w.id ASC
            LIMIT 1
        `;

        const workspaceId = (wsRow[0] as { id: number } | undefined)?.id;
        if (!workspaceId) {
            return Response.json({ message: "Forbidden" }, { status: 403 });
        }

        await sql`
            INSERT INTO notes (title, content, owner_id, workspace_id, is_pinned)
            VALUES (${title}, ${content}, ${ownerId}, ${workspaceId}, ${is_pinned})
        `;

        return Response.json({ message: "Note added successfully" }, { status: 201 });
    } catch (error) {
        console.error("add-note error", error);
        return Response.json({ message: "Internal server error" }, { status: 500 });
    }
}