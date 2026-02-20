"use client";

import React from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import Logo from "../../../public/assets/IncidentHub-logo-white.png";
import Inbox from "../../../public/assets/inbox.png";
import Incidents from "../../../public/assets/issues.png";
import Add from "../../../public/assets/add.png";
import Projects from "../../../public/assets/projects.png";
import Views from "../../../public/assets/views.png";
import Teams from "../../../public/assets/teams.png";
import Friends from "../../../public/assets/friends.png";
import Settings from "../../../public/assets/settings.png";
import Project from "../../../public/assets/current-project.png";
import Arrow from "../../../public/assets/down-arrow.png";
import Tasks from "../../../public/assets/tasks.png";

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    const current = (pathname ?? "").replace(/\/$/, "");
    const target = href.replace(/\/$/, "");

    if (!current || !target) return false;
    return current === target || current.startsWith(`${target}/`);
  };

  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState("");
  const [user, setUser] = useState("");
  const Workspace_Links = [
    { name: "Tasks", to: `/${user}/${currentWorkspace}/tasks`, icon: Tasks },
    {
      name: "Project",
      to: `/${user}/${currentWorkspace}/project`,
      icon: Projects,
    },
    // { name: "Views", to: "/app/views", icon: Views },
    // { name: "Teams", to: "/app/teams", icon: Teams },
  ];

  type Workspace = {
    workspace_name: string;
  };

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const routeUserRaw = (
      params as Record<string, string | string[] | undefined>
    )["user"];
    const routeWorkspaceRaw = (
      params as Record<string, string | string[] | undefined>
    )["workspace"];

    const routeUser = Array.isArray(routeUserRaw)
      ? (routeUserRaw[0] ?? "")
      : (routeUserRaw ?? "");
    const routeWorkspace = Array.isArray(routeWorkspaceRaw)
      ? (routeWorkspaceRaw[0] ?? "")
      : (routeWorkspaceRaw ?? "");

    const usr = window.localStorage.getItem("users");
    const work = window.localStorage.getItem("workspace");

    const storedUser = usr ? usr.replace(/"/g, "") : "";
    const storedWorkspace = work ? work.replace(/"/g, "") : "";

    const nextUser = routeUser || storedUser;
    const nextWorkspace = routeWorkspace || storedWorkspace || "";

    queueMicrotask(() => {
      setUser(nextUser);
      setCurrentWorkspace(nextWorkspace);
    });
  }, [params]);

  const Teams_Links = [
    { name: "Friends", to: "/dashboard", icon: Friends },
    { name: "Incidents", to: "/incidents", icon: Incidents },
    { name: "Settings", to: "/settings", icon: Settings },
  ];

  React.useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch(`/api/workspace`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ owner: user }),
        });
        const data = await response.json();
        setWorkspaces(data.workspaces);
      } catch (error) {
        console.error("Error fetching workspaces:", error);
      }
    };

    if (!user) return;
    fetchWorkspaces();
  }, [user]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user) return;
    if (!currentWorkspace) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/resolve-workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user, workspace: currentWorkspace }),
        });

        if (!res.ok) return;
        const data = (await res.json().catch(() => null)) as {
          workspace?: unknown;
        } | null;

        const resolved =
          typeof data?.workspace === "string" ? (data.workspace as string) : "";

        if (cancelled) return;

        if (!resolved) {
          window.localStorage.removeItem("workspace");
          return;
        }

        // keep localStorage in sync
        window.localStorage.setItem("workspace", JSON.stringify(resolved));

        if (resolved === currentWorkspace) return;

        setCurrentWorkspace(resolved);

        const rawPath = pathname ?? "";
        const segments = rawPath.split("/").filter(Boolean);
        // expected: [user, workspace, ...rest]
        const nextPath =
          segments.length >= 2
            ? "/" + [segments[0], resolved, ...segments.slice(2)].join("/")
            : `/${user}/${resolved}/tasks`;

        router.replace(nextPath);
      } catch (err) {
        console.error("Failed to resolve workspace", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, currentWorkspace, router, pathname]);

  return (
    <div className="relative md:fixed flex flex-col items-start justify-start gap-6 md:left-0 md:top-0 p-3 w-full md:w-48 h-auto md:h-full bg-[#121212] manrope z-50">
      <Link href={"/"}>
        <Image
          src={Logo}
          alt="IncidentHub Logo"
          className="h-8 w-8"
          width={32}
          height={32}
        />
      </Link>
      <section
        onClick={() => setIsOpen(!isOpen)}
        className="mt-3 flex gap-2 items-center w-full md:w-40 py-2 pl-2 pr-3 bg-white/5 hover:bg-white/10 cursor-pointer rounded-lg"
      >
        <Image
          src={Project}
          alt="Current Project"
          className="w-4 h-4"
          width={16}
          height={16}
        />
        <span className="text-white text-xs font-semibold">
          {currentWorkspace}
        </span>
        <Image
          src={Arrow}
          alt="arrow"
          className={`w-3 h-3 ${isOpen ? "rotate-180" : ""} transition-all`}
          width={12}
          height={12}
        />
        <div>
          {isOpen && (
            <div className="absolute mt-2 w-40 max-h-60 overflow-y-auto bg-[#121212] border border-white/20 rounded-lg shadow-lg z-50">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.workspace_name}
                  className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white text-xs"
                  onClick={() => {
                    if (!user) return;
                    localStorage.setItem(
                      "workspace",
                      JSON.stringify(workspace.workspace_name),
                    );
                    setIsOpen(false);
                    router.push(`/${user}/${workspace.workspace_name}/tasks`);
                  }}
                >
                  {workspace.workspace_name}
                </div>
              ))}
              <div className="mx-2 my-1 border-t border-white/10" />
              <div
                className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white text-xs flex items-center gap-2"
                onClick={() => {
                  setIsOpen(false);
                  if (!user || !currentWorkspace) return;
                  router.push(`/${user}/${currentWorkspace}/create-workspace`);
                }}
              >
                <Image
                  src={Add}
                  alt="Add"
                  className="w-3 h-3"
                  width={12}
                  height={12}
                />
                Create workspace
              </div>
            </div>
          )}
        </div>
      </section>
      <section className="flex flex-col gap-2 mt-5 w-full">
        <div className="flex gap-2 items-center rounded-lg py-2 pl-2 pr-3 md:pr-10 hover:bg-white/10 cursor-pointer w-full">
          <Image
            src={Inbox}
            alt="Inbox"
            className="w-4 h-4 opacity-50"
            width={16}
            height={16}
          />
          <span className="text-white text-xs font-medium opacity-50">
            Inbox
          </span>
        </div>
        <Link
          href={`/${user}/${currentWorkspace}/my-tasks`}
          className={
            "flex gap-2 items-center rounded-lg py-2 pl-2 pr-3 md:pr-10 cursor-pointer w-full " +
            (isActiveLink(`/${user}/${currentWorkspace}/my-tasks`)
              ? "bg-white/10"
              : "hover:bg-white/10")
          }
        >
          <Image
            src={Incidents}
            alt="Issues"
            className="w-4 h-4"
            width={16}
            height={16}
          />
          <span className="text-white text-xs font-medium">My tasks</span>
        </Link>
      </section>
      <section className="flex flex-col items-start gap-2 text-white w-full">
        <h2 className="text-sm text-neutral-400">Workspace</h2>
        <div className="flex flex-col items-start gap-1 w-full">
          {Workspace_Links.map((link) => (
            <Link
              key={link.name}
              href={link.to}
              className={
                "text-xs flex gap-2 items-center rounded-lg py-2 pl-2 pr-3 md:pr-10 w-full cursor-pointer " +
                (isActiveLink(link.to) ? "bg-white/10" : "hover:bg-white/10")
              }
            >
              <Image
                src={link.icon}
                alt={link.name}
                className="w-4 h-4"
                width={16}
                height={16}
              />
              <span>{link.name}</span>
            </Link>
          ))}
          <button
            onClick={() => {
              if (!user || !currentWorkspace) return;
              router.push(`/${user}/${currentWorkspace}/create-workspace`);
            }}
            className="text-xs flex gap-2 items-center rounded-lg py-2 pl-2 pr-3 md:pr-10 w-full hover:bg-white/10 cursor-pointer"
          >
            <Image
              src={Add}
              alt="Add"
              className="w-4 h-4"
              width={16}
              height={16}
            />
            Add
          </button>
        </div>
      </section>
      {/* <section className="flex flex-col items-start gap-2 text-white w-full">
        <h2 className="text-sm text-neutral-400">Project</h2>
        <div className="flex flex-col items-start gap-1 w-full">
          {Teams_Links.map((link) => (
            <Link
              key={link.name}
              href={link.to}
              className={
                "text-xs flex gap-2 items-center rounded-lg py-2 pl-2 pr-3 md:pr-10 w-full cursor-pointer " +
                (isActiveLink(link.to) ? "bg-white/10" : "hover:bg-white/10")
              }
            >
              <Image
                src={link.icon}
                alt={link.name}
                className="w-4 h-4"
                width={16}
                height={16}
              />
              <span>{link.name}</span>
            </Link>
          ))}
        </div>
      </section> */}
    </div>
  );
};
