import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await sql`
      SELECT id FROM users LIMIT 1
    `;

    return Response.json({ ok: true, data: rows }, { status: 200 });
  } catch (err) {
    console.error("Unexpected DB error:", err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
