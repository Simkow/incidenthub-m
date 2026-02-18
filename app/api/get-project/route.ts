import { sql } from '../../lib/db';

export async function POST(req: Request) {
    try {
        const { username, workspace } = await req.json();

        if (!username || !workspace) {
            return Response.json({message: "Username or workspace is empty"}, {status: 400})
        }

        const userIdRow = await sql`SELECT id FROM users WHERE name = ${username} LIMIT 1`;
        const userId = userIdRow[0].id;

        const workspaceIdRow = await sql`SELECT id FROM workspaces WHERE workspace_name = ${workspace} LIMIT 1`;
        const workspaceId = workspaceIdRow[0].id;

        if (!userId.length  || !workspaceId.length) {
            return Response.json({message: "user ID or workspace ID is not get correctly"}, {status: 200})
        }

        const workspaceData = await sql`SELECT * FROM workspaces WHERE id = ${workspaceId} AND owner_id = ${userId}`;
        //Miejsce zakończenia - pobieranie workspacu również w warunku obecności zewnętrznego membera (nie ownera)

    } catch (error) {

    }
}