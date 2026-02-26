import { sql } from "../../lib/db";

export const dynamic = "force-dynamic";

const WORKSPACE_SPACE_MESSAGE =
  "Workspace name cannot contain spaces. Example: \"my-workspace\" or \"my_workspace\".";

export async function POST(req: Request) {
  try {
    const { workspace, username, email } = await req.json();

    const workspaceName = typeof workspace === "string" ? workspace.trim() : "";
    const owner = typeof username === "string" ? username.trim() : "";
    const ownerEmail = typeof email === "string" ? email.trim() : "";

    if (!workspaceName || (!owner && !ownerEmail)) {
      return Response.json(
        { message: "All fields needed" },
        { status: 400 },
      );
    }

    if (/\s/.test(workspaceName)) {
      return Response.json({ message: WORKSPACE_SPACE_MESSAGE }, { status: 400 });
    }

    let idRow: unknown[] = [];

    if (ownerEmail) {
      idRow = await sql`
        SELECT id FROM users WHERE email = ${ownerEmail} LIMIT 1
      `;
    }

    if (!idRow.length && owner) {
      idRow = await sql`SELECT id FROM users WHERE name = ${owner} LIMIT 1`;
    }

    if (!idRow.length && owner) {
      idRow = await sql`
        SELECT id FROM users WHERE LOWER(name) = LOWER(${owner}) LIMIT 1
      `;
    }

    if (!idRow.length) {
      console.warn("first-workspace: user not found", {
        owner,
        ownerEmail,
      });
      return Response.json(
        { message: "User not found. Please log in again." },
        { status: 404 },
      );
    }

    const id = (idRow[0] as { id: number }).id;

    await sql`BEGIN`;

    const inserted = await sql`
      INSERT INTO workspaces (workspace_name, owner, owner_id)
      VALUES (${workspaceName}, ${owner}, ${id})
      RETURNING id
    `;

    const workspaceId = (inserted[0] as { id: number } | undefined)?.id;
    if (!workspaceId) {
      await sql`ROLLBACK`;
      return Response.json(
        { message: "Failed to create workspace" },
        { status: 500 },
      );
    }

    const defaultTasks = [
      {
        title: "Add your first task",
        description:
          "Start small: write down one thing you want to get done today.",
      },
      {
        title: "Finish your first task",
        description: "Mark a task as done and feel the momentum.",
      },
      {
        title: "Delete your first task",
        description:
          "Clean up tasks you no longer need — keep your list sharp.",
      },
    ] as const;

    for (const t of defaultTasks) {
      await sql`
        INSERT INTO tasks (title, description, priority, due_date, assignee_id, workspace_id, created_by, assignee)
        VALUES (
          ${t.title},
          ${t.description},
          ${"Medium"},
          NOW() + interval '3 days',
          ${id},
          ${workspaceId},
          ${id},
          ${owner}
        )
      `;
    }

    await sql`
      INSERT INTO notes (title, content, owner_id, workspace_id, is_pinned)
      VALUES (
        ${"Welcome to your workspace"},
        ${
          "This is a note. Use Notes to capture ideas, meeting summaries, or incident context.\n\nTip: Pin important notes so they stay on top."
        },
        ${id},
        ${workspaceId},
        ${true}
      )
    `;

    await sql`COMMIT`;

    return Response.json(
      { message: "Workspace created", workspace: workspaceName },
      { status: 201 },
    );
  } catch (error) {
    try {
      await sql`ROLLBACK`;
    } catch {
      // ignore
    }
    console.error(error);
    return Response.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
