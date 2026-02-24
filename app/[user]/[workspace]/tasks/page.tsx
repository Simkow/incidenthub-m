import { Sidebar } from "../Sidebar";
import { TaskDashboard } from "./TaskDashboard";
import { sql } from "../../../lib/db";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    user: string;
    workspace: string;
  }>;
};

export default async function WorkspacePage({ params }: PageProps) {
  const { user, workspace } = await params;

  const users = await sql`
    SELECT id FROM users WHERE name = ${user} LIMIT 1
  `;

  if (!users.length) {
    notFound();
  }

  const userId = (users[0] as { id: number }).id;

  const workspaces = await sql`
    SELECT w.id
    FROM workspaces w
    LEFT JOIN workspace_members wm
      ON wm.workspace_id = w.id AND wm.user_id = ${userId}
    WHERE w.workspace_name = ${workspace}
      AND (w.owner_id = ${userId} OR wm.user_id IS NOT NULL)
    ORDER BY w.id ASC
    LIMIT 1
  `;

  if (!workspaces.length) {
    const fallback = await sql`
      SELECT workspace_name
      FROM workspaces
      WHERE owner_id = ${userId}
      ORDER BY id ASC
      LIMIT 1
    `;

    const fallbackName = (fallback[0] as { workspace_name: string } | undefined)
      ?.workspace_name;

    if (fallbackName) {
      redirect(
        `/${encodeURIComponent(user)}/${encodeURIComponent(fallbackName)}/tasks`,
      );
    }

    const firstMember = await sql`
      SELECT w.workspace_name
      FROM workspace_members wm
      JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = ${userId}
      ORDER BY w.id ASC
      LIMIT 1
    `;

    const firstMemberName = (
      firstMember[0] as { workspace_name: string } | undefined
    )?.workspace_name;

    if (firstMemberName) {
      redirect(
        `/${encodeURIComponent(user)}/${encodeURIComponent(firstMemberName)}/tasks`,
      );
    }

    redirect("/first-workspace");
  }

  return (
    <div>
      <Sidebar />
      <div className="md:ml-48 bg-[color:var(--ws-bg)]">
        <TaskDashboard />
      </div>
    </div>
  );
}
