import { sql } from '../../lib/db'

export async function POST(req: Request) {
    try {
    const {username, workspace} = await req.json();

    if (!username || !workspace) {
        return Response.json({message: "Invalid username or workspace"}, {status: 400});
    }

    const workspaceIdRow = await sql`SELECT id FROM workspaces WHERE workspace_name = ${workspace}`;

    const workspaceId = (workspaceIdRow[0] as {id: number}).id;

    const usernameIdRow = await sql`SELECT id FROM users WHERE name = ${username}`;

    if(!usernameIdRow.length) {
        return Response.json({message: "User with this username doesn't exist"}, {status: 400});
    }

    const usernameId = (usernameIdRow[0] as {id: number}).id;

    await sql`INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (${workspaceId}, ${usernameId}, 'member');`

    return Response.json({message: "Added member successfully"}, {status: 200});
    } catch (error) {
        console.error(error);
        return Response.json({message: "Internal server error"}, {status: 500});
    }
}