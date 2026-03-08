'use client';

import { Navbar } from "./home/Navbar";
import { Hero } from "./home/Hero";
import { Presentation } from "./home/Presentation";
import { useEffect } from "react";
import { Sponsors } from "./home/Sponsors";
import { Footer } from "./home/Footer";

export default function Home() {
  // test

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [])

  return (
    <div className="w-full h-full bg-[#090909]">
      <Navbar />
      <Hero />
      <Presentation />
      <Sponsors />
      <Footer />
    </div>
  );
}
