import { sql } from '../../lib/db';

export async function POST(req: Request) {
    try {
        const body = (await req.json().catch(() => null)) as {
            username?: unknown;
            workspace?: unknown;
        } | null;

        const username = typeof body?.username === 'string' ? body.username.trim() : '';
        const workspace = typeof body?.workspace === 'string' ? body.workspace.trim() : '';

        if (!username || !workspace) {
            return Response.json(
                { message: 'Username or workspace is empty' },
                { status: 400 },
            );
        }

        const userIdRow = await sql`SELECT id FROM users WHERE name = ${username} LIMIT 1`;
        const userId = (userIdRow[0] as { id: number } | undefined)?.id;
        if (!userId) {
            return Response.json({ project: null }, { status: 404 });
        }

        const workspaceIdRow = await sql`
            SELECT id
            FROM workspaces
            WHERE workspace_name = ${workspace}
            LIMIT 1
        `;
        const workspaceId = (workspaceIdRow[0] as { id: number } | undefined)?.id;
        if (!workspaceId) {
            return Response.json({ project: null }, { status: 404 });
        }

        const rows = await sql`
            SELECT workspace_name, description, due_date
            FROM workspaces
            WHERE id = ${workspaceId} AND owner_id = ${userId}
            LIMIT 1
        `;

        const project = (rows?.[0] ?? null) as
            | { workspace_name: string; description: string | null; due_date: string | null }
            | null;

        return Response.json({ project }, { status: 200 });

    } catch (error) {
        console.error(error);
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}