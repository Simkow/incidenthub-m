"use client";

import Logo from "../../public/assets/IncidentHub-logo-white.png";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../AuthProvider";
import Image from "next/image";
import { useCurrentWorkspace } from "./CurrentWorkspace";

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [token] = useState(() => {
    if (typeof window === "undefined") return;

    const storedToken = window.localStorage.getItem("authToken");
    return storedToken ? storedToken.replace(/"/g, "") : "";
  });
  const [username] = useState<string | null>(() => {
    if (typeof window === "undefined") return "";
    const usr = window.localStorage.getItem("users");
    return usr ? usr.replace(/"/g, "") : "";
  });
  const [workspace] = useState(() => {
    if (typeof window === undefined) {
      return;
    }
    const currentWorkspace = localStorage.getItem("workspace") as string;
    if (!currentWorkspace.length) {
      return;
    }
    const works = currentWorkspace.replace(/"/g, "");
    return works
  });
  const hasDashboard = !!username && !!workspace;

  return (
    <div className="w-full fixed px-6 md:px-12 lg:px-56 py-4 bg-[#090909]/70 text-gray-400 flex flex-col md:flex-row items-center md:justify-between gap-4 heading border-b border-white/30 z-50 backdrop-blur-sm">
      <div className="flex gap-4 items-center justify-center shrink-0">
        <Image src={Logo} alt="IncidentHub Logo" className="h-12 w-12" />
        <span className="font-medium text-lg text-transparent bg-linear-to-r from-neutral-200 to-neutral-300 bg-clip-text">
          IncidentHub
        </span>
      </div>
      <div className="flex gap-4 md:gap-8 text-sm md:text-base flex-wrap justify-center">
        <Link
          href="/"
          className="hover:text-neutral-300 transition-all duration-300 opacity-50"
        >
          Product
        </Link>
        <Link
          href={hasDashboard ? `/${username}/${workspace}/tasks` : "/login"}
          className=" hover:text-neutral-300 transition-all duration-300"
        >
          Dashboard
        </Link>
        <Link
          href="/contact"
          className=" hover:text-neutral-300 transition-all duration-300 opacity-50"
        >
          Contact
        </Link>
      </div>
      <div>
        {!token ? (
          <div className="flex gap-3 md:gap-4 text-sm md:text-base flex-wrap justify-center">
            <Link
              href="/login"
              className="font-base hover:text-neutral-300 px-8 py-1 bg-black/40 hover:bg-black/50 rounded-xl border border-white/50 transition-all duration-300"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="font-base hover:text-black text-black/90 px-8 py-1 bg-white/90 hover:bg-white rounded-xl border border-white/50 transition-all duration-300"
            >
              Open App
            </Link>
          </div>
        ) : (
          <div className="flex gap-3 md:gap-4 text-sm md:text-base flex-wrap justify-center">
            <Link
              href="/login"
              onClick={() => localStorage.removeItem("authToken")}
              className="font-base hover:text-neutral-300 px-8 py-1 bg-black/40 hover:bg-black/50 rounded-xl border border-white/50 transition-all duration-300"
            >
              Logout
            </Link>
            <Link
              href={hasDashboard ? `/${username}/${workspace}` : "/login"}
              className="font-base hover:text-black text-black/90 px-8 py-1 bg-white/90 hover:bg-white rounded-xl border border-white/50 transition-all duration-300"
            >
              Open App
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
