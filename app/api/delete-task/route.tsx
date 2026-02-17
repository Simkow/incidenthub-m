import { sql } from "../../lib/db";

export async function DELETE(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { id?: unknown } | null;

    const idRaw = body?.id;
    const id = typeof idRaw === "number" ? idRaw : Number(idRaw);

    if (!Number.isFinite(id) || id <= 0) {
      return Response.json({ message: "id is invalid" }, { status: 400 });
    }

    await sql`DELETE FROM tasks WHERE id = ${id}`;
    return Response.json(
      { message: "Task deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}