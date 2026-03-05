"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCurrentWorkspace } from "./CurrentWorkspace";
import { useRouter } from "next/navigation";

export const Footer = () => {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");

  const tokenPresent = !!token;
  const workspace = useCurrentWorkspace(tokenPresent ? username : "");
  const hasDashboard = !!username && !!workspace && tokenPresent;

  const dashboardHref = useMemo(() => {
    if (!hasDashboard) return "/login";
    return `/${username}/${workspace}/tasks`;
  }, [hasDashboard, username, workspace]);

  const guardDashboardClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => {
    const liveToken =
      typeof window === "undefined"
        ? ""
        : (window.localStorage.getItem("authToken") ?? "").replace(/"/g, "");

    if (!liveToken) {
      e.preventDefault();
      router.push("/login");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const user1 = window.localStorage.getItem("users");
    const next = user1 ? user1.replace(/"/g, "") : "";
    queueMicrotask(() => setUsername(next));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token1 = window.localStorage.getItem("authToken");
    const next = token1 ? token1.replace(/"/g, "") : "";
    queueMicrotask(() => setToken(next));
  }, []);

  return (
    <footer className="w-full bg-[#0b0b0b] text-neutral-200 body-text border-t border-neutral-800/70">
      <div className="px-6 md:px-12 lg:px-56 py-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-3">
          <span className="text-lg tracking-widest text-neutral-400">
            INCIDENTHUB
          </span>
          <p className="text-sm leading-6 text-neutral-400 max-w-sm">
            Calm, focused space for your team workflows. Keep tasks, notes, and
            projects aligned without noise.
          </p>
        </div>
        <div className="grid gap-3">
          <span className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Product
          </span>
          <span className="text-sm text-neutral-300 hover:text-white transition-colors cursor-pointer">
            Home
          </span>
          <Link
            className="text-sm text-neutral-300 hover:text-white transition-colors"
            href={dashboardHref}
            onClick={guardDashboardClick}
          >
            Dashboard
          </Link>
          <a
            className="text-sm text-neutral-300 hover:text-white transition-colors"
            href="/contact"
          >
            Contact
          </a>
        </div>
        <div className="grid gap-3">
          <span className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Company
          </span>
          <Link
            className="text-sm text-neutral-300 hover:text-white transition-colors"
            href="/register"
          >
            Create account
          </Link>
          <Link
            className="text-sm text-neutral-300 hover:text-white transition-colors"
            href="/login"
          >
            Sign in
          </Link>
          <span className="text-xs text-neutral-500">contact@genwizer.com</span>
        </div>
      </div>
      <div className="px-6 md:px-12 lg:px-56 py-6 border-t border-neutral-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <span className="text-xs text-neutral-500">
          © 2026 IncidentHub. All rights reserved.
        </span>
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <a className="hover:text-white transition-colors" href="/contact">
            Support
          </a>
          <a className="hover:text-white transition-colors" href="/home">
            Status
          </a>
        </div>
      </div>
    </footer>
  );
};
