import { sql } from '../../lib/db'

export async function POST(req: Request) {
    try {
    const {workspace, username} = await req.json();

    if (!workspace || !username) {
        return Response.json({message: "All fields needed"}, {status: 400});
    }

    const idRow = await sql`SELECT id FROM users WHERE name = ${username} LIMIT 1`;

    if (!idRow.length) {
        return Response.json({message: "Something is wrong with database command"}, {status: 400});
    }

    const id = idRow[0].id as number;

    await sql`
            INSERT INTO workspaces (workspace_name, owner, owner_id)
            VALUES (${workspace}, ${username}, ${id})
        `;
    
    return Response.json(
      { message: "Workspace created", workspace },
      { status: 201 }
    );   
    
} catch (error) {
    console.error(error);
    return Response.json({message: "Internal Server Error"}, {status: 500});
}
    

}