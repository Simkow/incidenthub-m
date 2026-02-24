import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

type GetUserBody = {
    user?: unknown;
};

export async function POST(req: Request) {
    try {
        const json = (await req.json().catch(() => null)) as GetUserBody | string | null;

        const user =
            typeof json === "string"
                ? json.trim()
                : typeof json?.user === "string"
                    ? json.user.trim()
                    : "";

        if (!user) {
            return Response.json(
                { message: "user is required" },
                { status: 400 },
            );
        }

        const userRow = await sql`
            SELECT id, email, name
            FROM users
            WHERE name = ${user}
            LIMIT 1
        `;

        const found = userRow[0] as
            | { id: number; email: string | null; name: string }
            | undefined;

        if (!found) {
            return Response.json({ message: "User not found" }, { status: 404 });
        }

        return Response.json(
            { id: found.id, email: found.email, name: found.name },
            { status: 200 },
        );
    } catch (error) {
        console.error(error);
        return Response.json({ message: "Internal server error" }, { status: 500 });
    }
}