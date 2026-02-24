import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

type UpdateUserBody = {
  current_name?: unknown;
  next_name?: unknown;
  next_email?: unknown;
};

function trimOrEmpty(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

const NO_SPACES = /^\S+$/;

export async function PATCH(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as UpdateUserBody | null;

    const currentName = trimOrEmpty(body?.current_name);
    const nextNameRaw = trimOrEmpty(body?.next_name);
    const nextEmailRaw = trimOrEmpty(body?.next_email);

    const nextName = nextNameRaw ? nextNameRaw : null;
    const nextEmail = nextEmailRaw ? nextEmailRaw : null;

    if (!currentName) {
      return Response.json(
        { message: "current_name is required" },
        { status: 400 },
      );
    }

    if (!nextName && !nextEmail) {
      return Response.json(
        { message: "Provide next_name and/or next_email" },
        { status: 400 },
      );
    }

    if (nextName && !NO_SPACES.test(nextName)) {
      return Response.json(
        { message: "Username can't contain spaces" },
        { status: 400 },
      );
    }

    if (nextEmail && !NO_SPACES.test(nextEmail)) {
      return Response.json(
        { message: "Email can't contain spaces" },
        { status: 400 },
      );
    }

    const currentRow = await sql`
      SELECT id, name, email
      FROM users
      WHERE name = ${currentName}
      LIMIT 1
    `;

    const current = currentRow[0] as
      | { id: number; name: string; email: string | null }
      | undefined;

    if (!current) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    if (nextName && nextName !== current.name) {
      const taken = await sql`
        SELECT 1
        FROM users
        WHERE name = ${nextName}
          AND id <> ${current.id}
        LIMIT 1
      `;

      if (taken.length) {
        return Response.json(
          { message: "Username already taken" },
          { status: 409 },
        );
      }
    }

    if (nextEmail && nextEmail !== (current.email ?? "")) {
      const taken = await sql`
        SELECT 1
        FROM users
        WHERE email = ${nextEmail}
          AND id <> ${current.id}
        LIMIT 1
      `;

      if (taken.length) {
        return Response.json(
          { message: "Email already taken" },
          { status: 409 },
        );
      }
    }

    await sql`BEGIN`;

    const updatedRows = await sql`
      UPDATE users
      SET
        name = COALESCE(${nextName}, name),
        email = COALESCE(${nextEmail}, email)
      WHERE id = ${current.id}
      RETURNING id, name, email
    `;

    const updated = updatedRows[0] as
      | { id: number; name: string; email: string | null }
      | undefined;

    if (!updated) {
      await sql`ROLLBACK`;
      return Response.json(
        { message: "Failed to update user" },
        { status: 500 },
      );
    }

    if (nextName && nextName !== current.name) {
      await sql`
        UPDATE workspaces
        SET owner = ${nextName}
        WHERE owner_id = ${current.id}
           OR owner = ${current.name}
      `;

      await sql`
        UPDATE tasks
        SET assignee = ${nextName}
        WHERE assignee_id = ${current.id}
           OR assignee = ${current.name}
      `;
    }

    await sql`COMMIT`;

    return Response.json(
      { id: updated.id, name: updated.name, email: updated.email },
      { status: 200 },
    );
  } catch (error) {
    try {
      await sql`ROLLBACK`;
    } catch {
      // ignore
    }
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
