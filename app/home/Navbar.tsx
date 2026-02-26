"use client";

import Logo from "../../public/assets/IncidentHub-logo-white.png";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useCurrentWorkspace } from "./CurrentWorkspace";
import { LocaleToggle } from "../i18n/LocaleToggle";
import { useI18n } from "../i18n/I18nProvider";
import { useRouter } from "next/navigation";

export const Navbar: React.FC = () => {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [username, setUsername] = useState("");

  const { t } = useI18n();

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
    <div className="w-full fixed px-6 md:px-12 lg:px-56 py-4 bg-[#090909]/70 text-gray-400 flex flex-col md:flex-row items-center md:justify-between gap-4 heading border-b border-white/30 z-50 backdrop-blur-sm">
      <div
        onClick={() => router.push("/")}
        className="flex gap-4 items-center justify-center shrink-0 cursor-pointer"
      >
        <Image src={Logo} alt="IncidentHub Logo" className="h-12 w-12" />
        <span className="font-medium text-lg text-transparent bg-linear-to-r from-neutral-200 to-neutral-300 bg-clip-text">
          IncidentHub
        </span>
      </div>
      <div className="flex gap-4 md:gap-8 text-sm md:text-base flex-wrap justify-center">
        {/* <Link
          href="/"
          className="hover:text-neutral-300 transition-all duration-300 opacity-50"
        >
          {t("navbar.product")}
        </Link> */}
        <Link
          href={dashboardHref}
          onClick={guardDashboardClick}
          className=" hover:text-neutral-300 transition-all duration-300"
        >
          {t("navbar.dashboard")}
        </Link>
        <Link
          href="/contact"
          className=" hover:text-neutral-300 transition-all duration-300 opacity-50"
        >
          {t("navbar.contact")}
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <LocaleToggle />
        {!token ? (
          <div className="flex gap-3 md:gap-4 text-sm md:text-base flex-wrap justify-center">
            <Link
              href="/login"
              className="font-base hover:text-neutral-300 px-8 py-1 bg-black/40 hover:bg-black/50 rounded-xl border border-white/50 transition-all duration-300"
            >
              {t("navbar.login")}
            </Link>
            <Link
              href="/login"
              className="font-base hover:text-black text-black/90 px-8 py-1 bg-white/90 hover:bg-white rounded-xl border border-white/50 transition-all duration-300"
            >
              {t("navbar.openApp")}
            </Link>
          </div>
        ) : (
          <div className="flex gap-3 md:gap-4 text-sm md:text-base flex-wrap justify-center">
            <Link
              href="/login"
              onClick={() => {
                localStorage.removeItem("authToken");
                queueMicrotask(() => setToken(""));
              }}
              className="font-base hover:text-neutral-300 px-8 py-1 bg-black/40 hover:bg-black/50 rounded-xl border border-white/50 transition-all duration-300"
            >
              {t("navbar.logout")}
            </Link>
            <Link
              href={dashboardHref}
              onClick={guardDashboardClick}
              className="font-base hover:text-black text-black/90 px-8 py-1 bg-white/90 hover:bg-white rounded-xl border border-white/50 transition-all duration-300"
            >
              {t("navbar.openApp")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
