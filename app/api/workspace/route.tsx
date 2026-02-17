import { sql } from "../../lib/db";

export async function POST(req: Request) {
  try {
    const { owner } = await req.json();

    const workspaces = await sql`
      SELECT *
      FROM workspaces
      WHERE owner = ${owner}
    `;

    return Response.json({ workspaces }, { status: 200 });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
