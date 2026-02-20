import { sql } from "../../lib/db"

export async function POST(req: Request) {
    try{
    const user = await req.json();

    if (!user.length) {
        return Response.json({status: 400});
    }

    const userIdRow = await sql`SELECT id FROM users WHERE name = ${user} LIMIT 1`;

    const userId = (userIdRow[0] as { id: number } | undefined)?.id;

    if (!userId) {
        return Response.json({ project: null }, { status: 404 });
    }

    const tasksRow = await sql`SELECT * FROM tasks WHERE assignee_id = ${userId}`

    if (!tasksRow.length) {
        return Response.json({status: 400});
    }

    return Response.json({tasks: tasksRow}, {status: 200});

    } catch(error) {
        console.error(error);
        return Response.json({message: "Internal server error"}, {status: 500});
    }
}