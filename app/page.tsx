'use client';

import { Navbar } from "./home/Navbar";
import { Hero } from "./home/Hero";
import { Presentation } from "./home/Presentation"

export default function Home() {
  return (
    <div className="w-full h-full bg-[#090909]">
      <Navbar />
      <Hero />
      <Presentation />
    </div>
  );
}
