import { sql } from "../../lib/db";

function trimOrEmpty(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

function parseWorkspaceId(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

export async function POST(req: Request) {
    try {
        const body = (await req.json().catch(() => null)) as
            | { username?: unknown; ws_id?: unknown }
            | null;

        const username = trimOrEmpty(body?.username);
        const workspaceId = parseWorkspaceId(body?.ws_id);

        if (!username || !workspaceId) {
            return Response.json(
                { message: "username and ws_id are required" },
                { status: 400 },
            );
        }

        const userIdRows = await sql`SELECT id FROM users WHERE name = ${username} LIMIT 1`;
        const userId = (userIdRows[0] as { id: number } | undefined)?.id ?? null;

        if (!userId) {
            return Response.json({ message: "User not found" }, { status: 404 });
        }

        const workspaceRows = await sql`
            SELECT id, owner_id, owner
            FROM workspaces
            WHERE id = ${workspaceId}
            LIMIT 1
        `;

        const workspaceRow = (workspaceRows[0] as
            | { id: number; owner_id: number | null; owner: string | null }
            | undefined) ?? null;

        if (!workspaceRow) {
            return Response.json({ message: "Workspace not found" }, { status: 404 });
        }

        const isOwnerById =
            typeof workspaceRow.owner_id === "number" && workspaceRow.owner_id === userId;
        const isOwnerByName =
            typeof workspaceRow.owner === "string" && workspaceRow.owner === username;

        if (isOwnerById || isOwnerByName) {
            return Response.json(
                { message: "Workspace owner cannot quit" },
                { status: 403 },
            );
        }

        // Transfer tasks assigned to the quitting user to the workspace owner.
        let ownerId: number | null =
            typeof workspaceRow.owner_id === "number" && Number.isFinite(workspaceRow.owner_id)
                ? workspaceRow.owner_id
                : null;
        let ownerName: string = typeof workspaceRow.owner === "string" ? workspaceRow.owner.trim() : "";

        if (!ownerId && ownerName) {
            const rows = await sql`SELECT id FROM users WHERE name = ${ownerName} LIMIT 1`;
            ownerId = (rows[0] as { id: number } | undefined)?.id ?? null;
        }

        if (ownerId && !ownerName) {
            const rows = await sql`SELECT name FROM users WHERE id = ${ownerId} LIMIT 1`;
            ownerName = ((rows[0] as { name?: unknown } | undefined)?.name as string | undefined)?.trim?.() ?? "";
        }

        if (!ownerId || !ownerName) {
            return Response.json(
                { message: "Workspace owner not found" },
                { status: 500 },
            );
        }

        await sql`
            UPDATE tasks
            SET assignee_id = ${ownerId}, assignee = ${ownerName}
            WHERE workspace_id = ${workspaceId}
              AND assignee_id = ${userId}
        `;

        await sql`
            DELETE FROM workspace_members
            WHERE user_id = ${userId}
                AND workspace_id = ${workspaceId}
        `;

        return Response.json({ ok: true }, { status: 200 });
    } catch (error) {
        console.error(error);
        return Response.json({ message: "Internal server error" }, { status: 500 });
    }
}