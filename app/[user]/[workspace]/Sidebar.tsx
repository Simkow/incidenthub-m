"use client";

import React from "react";
import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import Logo from "../../../public/assets/IncidentHub-logo-white.png";
import Inbox from "../../../public/assets/inbox.png";
import Incidents from "../../../public/assets/issues.png";
import Add from "../../../public/assets/add.png";
import Projects from "../../../public/assets/projects.png";
import Friends from "../../../public/assets/friends.png";
import Project from "../../../public/assets/current-project.png";
import Arrow from "../../../public/assets/down-arrow.png";
import Tasks from "../../../public/assets/tasks.png";
import Profile from "../../../public/assets/profile.png";
import Settings from "../../../public/assets/settings.png";
import { LocaleToggle } from "../../i18n/LocaleToggle";
import { useI18n } from "../../i18n/I18nProvider";

export const Sidebar: React.FC = () => {
  const { t } = useI18n();
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [memberWorkspaces, setMemberWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState("");
  const [user, setUser] = useState("");
  const [pendingInvites, setPendingInvites] = useState<
    Array<{ id: number; workspace: string; inviter: string }>
  >([]);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [respondingInviteId, setRespondingInviteId] = useState<number | null>(
    null,
  );
  const Workspace_Links = [
    {
      name: t("sidebar.tasks"),
      to: `/${user}/${currentWorkspace}/tasks`,
      icon: Tasks,
    },
    {
      name: t("sidebar.project"),
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
    {
      name: t("sidebar.member"),
      to: `/${user}/${currentWorkspace}/members`,
      icon: Friends,
    },
    {
      name: "Settings",
      to: `/${user}/${currentWorkspace}/settings`,
      icon: Settings,
    },
    // { name: "Incidents", to: "/incidents", icon: Incidents },
    // { name: "Settings", to: "/settings", icon: Settings },
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
        const data = (await response.json().catch(() => null)) as {
          workspaces?: unknown;
          memberWorkspaces?: unknown;
        } | null;

        const owned = Array.isArray(data?.workspaces)
          ? (data?.workspaces as unknown[])
              .map((w) => w as Partial<Workspace>)
              .filter(
                (w): w is Workspace => typeof w.workspace_name === "string",
              )
          : [];

        const member = Array.isArray(data?.memberWorkspaces)
          ? (data?.memberWorkspaces as unknown[])
              .map((w) => w as Partial<Workspace>)
              .filter(
                (w): w is Workspace => typeof w.workspace_name === "string",
              )
          : [];

        setWorkspaces(owned);
        setMemberWorkspaces(member);
      } catch (error) {
        console.error("Error fetching workspaces:", error);
        setWorkspaces([]);
        setMemberWorkspaces([]);
      }
    };

    if (!user) return;
    fetchWorkspaces();
  }, [user]);

  const fetchInvites = useCallback(async () => {
    if (!user) return;
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem("authToken");
    const tokenPresent = !!(token ? token.replace(/"/g, "") : "");
    if (!tokenPresent) {
      setPendingInvites([]);
      return;
    }

    try {
      const res = await fetch("/api/get-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user }),
      });

      const data = (await res.json().catch(() => null)) as {
        invitations?: unknown;
      } | null;

      const invites = Array.isArray(data?.invitations)
        ? (
            data?.invitations as Array<{
              id?: unknown;
              workspace?: unknown;
              inviter?: unknown;
            }>
          )
            .map((i) => ({
              id: typeof i.id === "number" ? i.id : Number(i.id),
              workspace: typeof i.workspace === "string" ? i.workspace : "",
              inviter: typeof i.inviter === "string" ? i.inviter : "",
            }))
            .filter((i) => Number.isFinite(i.id) && i.workspace && i.inviter)
        : [];

      setPendingInvites(invites);
    } catch (err) {
      console.error("Failed to fetch invitations", err);
      setPendingInvites([]);
    }
  }, [user]);

  React.useEffect(() => {
    void fetchInvites();
  }, [fetchInvites]);

  const respondInvite = useCallback(
    async (invitationId: number, action: "accept" | "reject") => {
      if (!user) return;

      setInviteMessage(null);
      setInviteError(null);
      setRespondingInviteId(invitationId);

      try {
        const res = await fetch("/api/respond-invitation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user, invitationId, action }),
        });

        const data = (await res.json().catch(() => null)) as {
          message?: unknown;
        } | null;
        const msg = typeof data?.message === "string" ? data.message : "";

        if (!res.ok) {
          setInviteError(msg || "Failed");
          return;
        }

        setInviteMessage(msg || "OK");
        await fetchInvites();
        // Refresh workspace lists (accept will add workspace membership)
        if (action === "accept") {
          const response = await fetch(`/api/workspace`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ owner: user }),
          });
          const refreshed = (await response.json().catch(() => null)) as {
            workspaces?: unknown;
            memberWorkspaces?: unknown;
          } | null;

          const owned = Array.isArray(refreshed?.workspaces)
            ? (refreshed?.workspaces as unknown[])
                .map((w) => w as Partial<Workspace>)
                .filter(
                  (w): w is Workspace => typeof w.workspace_name === "string",
                )
            : [];

          const member = Array.isArray(refreshed?.memberWorkspaces)
            ? (refreshed?.memberWorkspaces as unknown[])
                .map((w) => w as Partial<Workspace>)
                .filter(
                  (w): w is Workspace => typeof w.workspace_name === "string",
                )
            : [];

          setWorkspaces(owned);
          setMemberWorkspaces(member);
        }
      } catch (err) {
        console.error("Failed to respond invitation", err);
        setInviteError("Network error");
      } finally {
        setRespondingInviteId(null);
      }
    },
    [fetchInvites, user],
  );

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

  const sidebarSections = (
    <>
      <section
        onClick={() => setIsOpen(!isOpen)}
        className="mt-3 flex gap-2 items-center w-full md:w-40 py-2 pl-2 pr-3 bg-(--ws-surface-2) hover:bg-(--ws-hover) cursor-pointer rounded-lg"
      >
        <Image
          src={Project}
          alt="Current Project"
          className="w-4 h-4 ws-icon"
          width={16}
          height={16}
        />
        <span className="text-xs font-semibold">{currentWorkspace}</span>
        <Image
          src={Arrow}
          alt="arrow"
          className={`w-3 h-3 ws-icon ${isOpen ? "rotate-180" : ""} transition-all`}
          width={12}
          height={12}
        />
        <div>
          {isOpen && (
            <div className="absolute mt-2 w-40 max-h-60 overflow-y-auto bg-(--ws-surface) border border-(--ws-border) rounded-lg shadow-lg z-50">
              <div className="px-4 pt-3 pb-1 text-[11px] text-(--ws-fg-muted)">
                {t("sidebar.ownedWorkspaces")}
              </div>
              {workspaces.map((workspace) => (
                <div
                  key={workspace.workspace_name}
                  className="px-4 py-2 hover:bg-(--ws-hover) cursor-pointer text-xs"
                  onClick={() => {
                    if (!user) return;
                    localStorage.setItem(
                      "workspace",
                      JSON.stringify(workspace.workspace_name),
                    );
                    setIsOpen(false);
                    setMobileMenuOpen(false);
                    router.push(`/${user}/${workspace.workspace_name}/tasks`);
                  }}
                >
                  {workspace.workspace_name}
                </div>
              ))}

              {memberWorkspaces.length ? (
                <>
                  <div className="mx-2 my-2 border-t border-(--ws-border)" />
                  <div className="px-4 pb-1 text-[11px] text-(--ws-fg-muted)">
                    {t("sidebar.sharedWorkspaces")}
                  </div>
                  {memberWorkspaces.map((workspace) => (
                    <div
                      key={`member:${workspace.workspace_name}`}
                      className="px-4 py-2 hover:bg-(--ws-hover) cursor-pointer text-xs"
                      onClick={() => {
                        if (!user) return;
                        localStorage.setItem(
                          "workspace",
                          JSON.stringify(workspace.workspace_name),
                        );
                        setIsOpen(false);
                        setMobileMenuOpen(false);
                        router.push(
                          `/${user}/${workspace.workspace_name}/tasks`,
                        );
                      }}
                    >
                      {workspace.workspace_name}
                    </div>
                  ))}
                </>
              ) : null}
              <div className="mx-2 my-1 border-t border-(--ws-border)" />
              <div
                className="px-4 py-2 hover:bg-(--ws-hover) cursor-pointer text-xs flex items-center gap-2"
                onClick={() => {
                  setIsOpen(false);
                  if (!user) return;
                  const ownedFallback = workspaces[0]?.workspace_name ?? "";
                  const target = currentWorkspace || ownedFallback;
                  if (!target) return;
                  setMobileMenuOpen(false);
                  router.push(`/${user}/${target}/create-workspace`);
                }}
              >
                <Image
                  src={Add}
                  alt="Add"
                  className="w-3 h-3 ws-icon"
                  width={12}
                  height={12}
                />
                {t("sidebar.createWorkspace")}
              </div>
            </div>
          )}
        </div>
      </section>

      <button
        onClick={() => {
          if (!user) return;
          const ownedFallback = workspaces[0]?.workspace_name ?? "";
          const target = currentWorkspace || ownedFallback;
          if (!target) return;
          setMobileMenuOpen(false);
          router.push(`/${user}/${target}/profile`);
        }}
        className="text-xs flex gap-2 items-center rounded-lg py-2 pl-2 pr-3 md:pr-10 w-full font-bold heading hover:bg-(--ws-hover) cursor-pointer"
      >
        <Image
          src={Profile}
          alt="profile"
          className="w-4 h-4 ws-icon"
          width={16}
          height={16}
        />
        {user}
      </button>

      <section className="flex flex-col gap-2 w-full">
        <div className="flex gap-2 items-center rounded-lg py-2 pl-2 pr-3 md:pr-10 hover:bg-(--ws-hover) cursor-pointer w-full">
          <Image
            src={Inbox}
            alt="Inbox"
            className="w-4 h-4 opacity-50 ws-icon"
            width={16}
            height={16}
          />
          <span className="text-xs font-medium opacity-50">
            {t("sidebar.inbox")}
          </span>
        </div>
        <Link
          href={`/${user}/${currentWorkspace}/my-tasks`}
          onClick={() => setMobileMenuOpen(false)}
          className={
            "flex gap-2 items-center rounded-lg py-2 pl-2 pr-3 md:pr-10 cursor-pointer w-full " +
            (isActiveLink(`/${user}/${currentWorkspace}/my-tasks`)
              ? "bg-(--ws-hover)"
              : "hover:bg-(--ws-hover)")
          }
        >
          <Image
            src={Incidents}
            alt="Issues"
            className="w-4 h-4 ws-icon"
            width={16}
            height={16}
          />
          <span className="text-xs font-medium">{t("sidebar.myTasks")}</span>
        </Link>
      </section>

      {pendingInvites.length ? (
        <section className="flex flex-col items-start gap-2 w-full mt-2">
          <h2 className="text-sm text-(--ws-fg-muted)">
            {t("sidebar.invitations")}
          </h2>
          <div className="flex flex-col gap-2 w-full">
            {pendingInvites.map((inv) => (
              <div
                key={inv.id}
                className="rounded-lg border border-(--ws-border) bg-(--ws-surface-2) px-2 py-2 text-[11px] text-(--ws-fg-muted)"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="text-(--ws-fg)">{inv.workspace}</span>
                    <span className="text-(--ws-fg-muted)">
                      {" "}
                      · {inv.inviter}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={respondingInviteId === inv.id}
                    onClick={() => void respondInvite(inv.id, "accept")}
                    className="rounded-lg bg-(--ws-hover) hover:bg-(--ws-hover) border border-(--ws-border) px-2 py-1 text-[11px] disabled:opacity-60"
                  >
                    {t("sidebar.accept")}
                  </button>
                  <button
                    type="button"
                    disabled={respondingInviteId === inv.id}
                    onClick={() => void respondInvite(inv.id, "reject")}
                    className="rounded-lg bg-(--ws-surface-2) hover:bg-(--ws-hover) border border-(--ws-border) px-2 py-1 text-[11px] text-(--ws-fg-muted) disabled:opacity-60"
                  >
                    {t("sidebar.reject")}
                  </button>
                </div>
              </div>
            ))}

            {inviteMessage ? (
              <div className="text-[11px] text-emerald-300">
                {inviteMessage}
              </div>
            ) : null}
            {inviteError ? (
              <div className="text-[11px] text-red-300">{inviteError}</div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col items-start gap-2 w-full">
        <h2 className="text-sm text-(--ws-fg-muted)">
          {t("sidebar.workspace")}
        </h2>
        <div className="flex flex-col items-start gap-1 w-full">
          {Workspace_Links.map((link) => (
            <Link
              key={link.name}
              href={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={
                "text-xs flex gap-2 items-center rounded-lg py-2 pl-2 pr-3 md:pr-10 w-full cursor-pointer " +
                (isActiveLink(link.to)
                  ? "bg-(--ws-hover)"
                  : "hover:bg-(--ws-hover)")
              }
            >
              <Image
                src={link.icon}
                alt={link.name}
                className="w-4 h-4 ws-icon"
                width={16}
                height={16}
              />
              <span>{link.name}</span>
            </Link>
          ))}
          <button
            onClick={() => {
              if (!user) return;
              const ownedFallback = workspaces[0]?.workspace_name ?? "";
              const target = currentWorkspace || ownedFallback;
              if (!target) return;
              setMobileMenuOpen(false);
              router.push(`/${user}/${target}/create-workspace`);
            }}
            className="text-xs flex gap-2 items-center rounded-lg py-2 pl-2 pr-3 md:pr-10 w-full hover:bg-(--ws-hover) cursor-pointer"
          >
            <Image
              src={Add}
              alt="Add"
              className="w-4 h-4 ws-icon"
              width={16}
              height={16}
            />
            {t("sidebar.add")}
          </button>
        </div>
      </section>

      <section className="flex flex-col items-start gap-2 w-full">
        <h2 className="text-sm text-(--ws-fg-muted)">Project</h2>
        <div className="flex flex-col items-start gap-1 w-full">
          {Teams_Links.map((link) => (
            <Link
              key={link.name}
              href={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={
                "text-xs flex gap-2 items-center rounded-lg py-2 pl-2 pr-3 md:pr-10 w-full cursor-pointer " +
                (isActiveLink(link.to)
                  ? "bg-(--ws-hover)"
                  : "hover:bg-(--ws-hover)")
              }
            >
              <Image
                src={link.icon}
                alt={link.name}
                className="w-4 h-4 ws-icon"
                width={16}
                height={16}
              />
              <span>{link.name}</span>
            </Link>
          ))}
          <div className="my-2">
            <LocaleToggle />
          </div>
          <Link
            href="/login"
            onClick={() => {
              setMobileMenuOpen(false);
              localStorage.removeItem("authToken");
            }}
            className="text-xs flex gap-2 items-center rounded-lg py-2 pl-2 pr-3 md:pr-10 w-full cursor-pointer hover:bg-(--ws-hover)"
          >
            {t("navbar.logout")}
          </Link>
        </div>
      </section>
    </>
  );

  return (
    <div className="relative md:fixed flex flex-col items-start justify-start gap-3 md:gap-6 md:left-0 md:top-0 p-3 w-full md:w-48 h-auto md:h-full bg-(--ws-sidebar-bg) text-(--ws-fg) body-text z-50">
      <div className="w-full flex items-center justify-between md:block">
        <Link href={"/"} onClick={() => setMobileMenuOpen(false)}>
          <Image
            src={Logo}
            alt="IncidentHub Logo"
            className="h-8 w-8 ws-icon"
            width={32}
            height={32}
          />
        </Link>

        <button
          type="button"
          className="md:hidden rounded-lg border border-(--ws-border) px-2 py-1 hover:bg-(--ws-hover) transition-colors"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => {
            setMobileMenuOpen((v) => !v);
            setIsOpen(false);
          }}
        >
          <span className="text-xs font-semibold text-center flex items-center">
            {mobileMenuOpen
              ? `${t("sidebar.menuClose")}`
              : `${t("sidebar.menu")}`}
          </span>
        </button>
      </div>

      <div className="hidden md:flex w-full flex-col items-start justify-start gap-6">
        {sidebarSections}
      </div>

      <AnimatePresence initial={false}>
        {mobileMenuOpen ? (
          <motion.div
            key="mobile-sidebar"
            className="flex md:hidden w-full flex-col items-start justify-start gap-6"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {sidebarSections}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
