"use client";

import { Navbar } from "./home/Navbar";
import { Hero } from "./home/Hero";
import { Presentation } from "./home/Presentation";
import { CreatedFor } from "./home/CreatedFor";
import { useEffect, useState } from "react";
import { Sponsors } from "./home/Sponsors";
import { Footer } from "./home/Footer";
import { useRouter, useSearchParams } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username] = useState(() => {
    if (typeof window === "undefined") return "";
    const users = window.localStorage.getItem("users");
    return users ? users.replace(/"/g, "") : "";
  });
  const [workspace] = useState(() => {
    if (typeof window === "undefined") return "";
    const works = window.localStorage.getItem("workspace");
    return works ? works.replace(/"/g, "") : "";
  });

  useEffect(() => {
    const showLanding = searchParams.get("landing") === "1";

    if (showLanding) return;

    if (localStorage.getItem("authToken")) {
      router.push(`/${username}/${workspace}/tasks`);
    }
  }, [router, searchParams, username, workspace]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full h-full bg-[#090909]">
      <Navbar />
      <Hero />
      <Presentation />
      <CreatedFor />
      <Sponsors />
      <Footer />
    </div>
  );
}
