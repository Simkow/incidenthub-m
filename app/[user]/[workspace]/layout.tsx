import type { Metadata } from "next";
import { WorkspaceThemeProvider } from "./WorkspaceThemeProvider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Incident Hub | Workspace",
};

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ user: string; workspace: string }>;
}) {
  const { user, workspace } = await params;
  return (
    <WorkspaceThemeProvider username={user} workspace={workspace}>
      {children}
    </WorkspaceThemeProvider>
  );
}
