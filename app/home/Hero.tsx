"use client";

import { motion } from "motion/react";
import BgImage from "../../public/assets/hero-bg.png";
import BgImage2 from "../../public/assets/hero-bg2.png";
import { useEffect, useState, type FC } from "react";
import Link from "next/link";
import { useAuth } from "../AuthProvider";
import Image from "next/image";
import { useCurrentWorkspace } from "./CurrentWorkspace";

const MotionImage = motion(Image);

export const Hero: FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [username] = useState<string | null>(() => {
    if (typeof window === "undefined") return "";
    const usr = window.localStorage.getItem("users");
    return usr ? usr.replace(/"/g, "") : "";
  });
  const { user } = useAuth();
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
  // const workspace = useCurrentWorkspace(user?.name);
  console.log(workspace);
  const hasDashboard = !!username && !!workspace;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible((isVisible) => !isVisible);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isVisible]);

  return (
    <main className="w-full max-md:max-h-screen max-md:justify-center min-h-screen bg-[#090909] overflow-hidden relative gap-8 flex flex-col pt-40 md:pt-32 px-6 md:px-12 lg:px-56 body-text text-center text-neutral-100 pb-32 md:pb-40">
      <div className="w-full h-full z-0">
        <div className="w-37.5 h-37.5 rounded-full bg-[#dceef6] absolute blur-3xl right-0 top-32 opacity-20 md:opacity-50"></div>
        <div className="w-24 h-32 md:w-50 md:h-75 rounded-full bg-[#dceef6] absolute blur-3xl left-16 bottom-4 md:left-40 md:bottom-20 opacity-20 md:opacity-50 -rotate-10"></div>
      </div>
      <div className="justify-start flex flex-col gap-4 mt-10 md:mt-20 z-40 relative pl-5">
        <motion.div
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 1 }}
          className="w-px h-full bg-white/30 absolute left-0 top-1/2 -translate-y-1/2"
        ></motion.div>
        <motion.h1
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 1 }}
          className="font-bold text-4xl md:text-6xl text-start text-white"
        >
          A modern way to{" "}
          <motion.span
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.3 }}
          >
            handle{" "}
            <span className="text-transparent bg-linear-to-l from-neutral-400 to-white bg-clip-text">
              incidents.
            </span>
          </motion.span>
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.6 }}
          className="text-start text-neutral-400 leading-relaxed text-base md:text-xl font-base"
        >
          Log incidents, track actions, and build postmortems with a clean,
          <br /> frontend-first workflow designed for real-world scenarios.
        </motion.h2>
        <div className="justify-start flex flex-col sm:flex-row gap-4 sm:gap-8">
          <Link
            href={hasDashboard ? `/${username}/${workspace}/tasks` : "/login"}
          >
            <motion.button
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.7 }}
              className="border border-white rounded-xl w-full sm:w-38 py-2 hover:bg-neutral-100 hover:text-black transition-all duration-300 cursor-pointer font-bold"
            >
              Start Building
            </motion.button>
          </Link>
          <motion.button
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 2 }}
            className="group text-neutral-300 rounded-xl w-full sm:w-38 py-2 hover:bg-neutral-700 transition-all duration-300 cursor-pointer font-bold"
          >
            Learn More...
            <span className="ml-2 text-neutral-400 font-base group-hover:text-white">{`>`}</span>
          </motion.button>
        </div>
      </div>
      <div className="w-full relative h-full z-40 hidden md:block">
        <MotionImage
          animate={{ opacity: 1, scale: 1, filter: "blur(1px)" }}
          transition={{ duration: 0.8 }}
          src={BgImage}
          alt="Hero Background"
          className="w-full max-w-5xl h-auto -rotate-10 scale-110 hover:scale-115 transition-all duration-1000"
        />
        <MotionImage
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
          src={BgImage2}
          alt="Hero Background 2"
          className="w-full max-w-5xl h-auto absolute top-5 left-0 md:left-40 -rotate-10 scale-110 hover:scale-115 transition-all duration-1000 blur-[0.5px] hover:blur-none"
        />
      </div>
    </main>
  );
};
