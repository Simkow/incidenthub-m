"use client";

import Link from "next/link";
import Image from "next/image";
import Arrow from "../../public/assets/down-arrow.png";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "../AuthProvider";

export const FirstWorkspace: React.FC = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isClicked, setIsClicked] = useState(false);
  const [projectName, setProjectName] = useState("");
  const { user } = useAuth();
  const username = user?.name;
  const id = user?.id;

  useEffect(() => {
    setUserName(window.localStorage.getItem("users")?.split('"').join(""));
  }, []);

  useEffect(() => {
    setUserEmail(window.localStorage.getItem("userEmail"));
  }, [])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/add-workspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspace_name: projectName,
          owner_id: id,
          owner: username,
        }),
      });
      localStorage.setItem("workspace", projectName);
      if (localStorage.getItem("workspace")?.includes(" ") === true) {
        const trimmedWorkspace = localStorage
          .getItem("workspace")
          ?.replace(" ", "-");
        localStorage.setItem("workspace", trimmedWorkspace || "");
      }
      if (response.ok) {
        console.log("Workspace created successfully");
        window.location.href = `/dashboard/${username}/${projectName}`;
      }
      if (!response.ok) {
        console.error("Failed to create workspace");
      }
    } catch (error) {
      console.error("Error adding workspace:", error);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col justify-center relative bg-[#121212] manrope">
      <Link
        href={"/"}
        className="text-neutral-400 absolute left-8 top-5 flex gap-2 items-center hover:text-neutral-200 transition-all text-sm"
      >
        <Image
          src={Arrow}
          alt="arrow"
          className="w-3 h-3 rotate-90"
          width={12}
          height={12}
        />
        Back to IncidentHub
      </Link>
      <span className="flex flex-col items-start absolute right-8 top-5 gap-1 text-neutral-400 text-sm">
        Logged in as{" "}
        <span className="text-neutral-200">
          {userEmail?.split('"').join("")}
        </span>
      </span>
      <main>
        <section className="w-full h-full flex flex-col justify-center items-center gap-6">
          <h1 className="text-3xl font-bold text-white">
            Welcome to your first workspace!
          </h1>
          <p className="text-neutral-400 text-center w-1/2">
            It looks like you haven't set up any projects or teams yet. Get
            started by creating your first project and inviting team members to
            collaborate.
          </p>
          <button
            onClick={() => setIsClicked(true)}
            className="bg-black text-white rounded-lg px-6 py-3 hover:bg-neutral-800 transition cursor-pointer"
          >
            Create Your First Project
          </button>
          {isClicked && (
            <motion.form
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-4 w-96 mt-4"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="projectName"
                  className="text-neutral-200 font-medium"
                >
                  Project Name
                </label>
                <input
                  type="text"
                  id="projectName"
                  name="projectName"
                  className="text-neutral-700 bg-neutral-200 border border-neutral-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-neutral-300 text-sm"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
                <label
                  htmlFor="workspaceUrl"
                  className="text-neutral-200 font-medium mt-2"
                >
                  Workspace URL
                </label>
                <input
                  readOnly
                  type="text"
                  id="workspaceUrl"
                  value={`http://localhost:5173/${userName}/${projectName}`}
                  name="workspaceUrl"
                  className="text-neutral-700 bg-neutral-200 border border-neutral-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-neutral-300 text-sm"
                  placeholder="Enter workspace name"
                />
              </div>
              <button
                type="submit"
                className="bg-black text-white rounded-lg px-6 py-3 hover:bg-neutral-800 transition cursor-pointer"
              >
                Create Workspace
              </button>
            </motion.form>
          )}
        </section>
      </main>
    </div>
  );
};
