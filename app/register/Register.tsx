"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "../../public/assets/IncidentHub-logo-white.png";
import Background from "../../public/assets/login-bg.jpg";
import { useRouter } from "next/navigation";

export const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isBlurred, setIsBlurred] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBlurred((isBlurred) => !isBlurred);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isBlurred]);

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }
  function handleEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
  }
  function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });
      if (response.ok) {
        router.push("/login");
      } else {
        console.error("Registration failed");
      }
    } catch (error) {
      console.error("Error during registration:", error);
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col gap-4 justify-center items-center bg-[#090909] pt-20 pb-40">
      <Image
        src={Background}
        alt="Background"
        className={`fixed top-0 left-0 w-full h-full object-cover z-10 opacity-30 transition-all duration-3000 ${isBlurred ? "blur-sm" : ""}`}
        width={1920}
        height={1080}
      />
      <form
        action="submit"
        onSubmit={handleSubmit}
        className="rounded-xl bg-neutral-900/30 px-8 py-5 flex justify-center items-center flex-col gap-4 shadow-lg shadow-black/30 backdrop-blur-[1px] border border-white/20 z-20"
      >
        <div className="w-full flex flex-col justify-center items-center">
          <Link href="/">
            <Image
              src={Logo}
              alt="IncidentHub Logo"
              className="w-8 h-8 hover:scale-105 transition-all"
              width={32}
              height={32}
            />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-500 mb-4 text-center">
            Register to <br />
            <span className="text-white">IncidentHub</span>
          </h1>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-neutral-300 font-medium">
            Name:
          </label>
          <label htmlFor="name" className="text-xs text-neutral-500 font-light">
            Enter your username
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="text-neutral-700 bg-neutral-200 border border-neutral-300 rounded-lg px-4 py-2 w-80 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            onChange={handleNameChange}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-neutral-300 font-medium">
            Email:
          </label>
          <label
            htmlFor="email"
            className="text-xs text-neutral-500 font-light"
          >
            Provide your email address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="text-neutral-700 bg-neutral-200 border border-neutral-300 rounded-lg px-4 py-2 w-80 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            onChange={handleEmailChange}
          />
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <label htmlFor="password" className="text-neutral-300 font-medium">
            Password:
          </label>
          <label
            htmlFor="password"
            className="text-xs text-neutral-500 font-light"
          >
            Enter your password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className="text-neutral-700 bg-neutral-200 border border-neutral-300 rounded-lg px-4 py-2 w-80 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            onChange={handlePasswordChange}
          />
        </div>
        <div className="w-full flex flex-col items-start gap-1">
          <button
            type="submit"
            className="mt-6 bg-black text-white rounded-lg px-4 py-2 w-full hover:bg-neutral-800 transition cursor-pointer"
          >
            Register
          </button>
          <Link href="/login">
            <button className="text-neutral-400 hover:underline text-sm cursor-pointer">
              Login...
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
};
