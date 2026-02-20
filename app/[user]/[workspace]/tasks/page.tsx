import { Sidebar } from "../Sidebar";
import { TaskDashboard } from "./TaskDashboard";
import { sql } from "../../../lib/db";
import { notFound } from "next/navigation";

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
    SELECT *
    FROM workspaces
    WHERE workspace_name = ${workspace} AND owner_id = ${userId}
    LIMIT 1
  `;

  if (!workspaces.length) {
    notFound();
  }

  return (
    <div>
      <Sidebar />
      <div className="md:ml-48 bg-[#121212]">
        <TaskDashboard />
      </div>
    </div>
  );
}
