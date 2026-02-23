"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "../../public/assets/IncidentHub-logo-white.png";
import Background from "../../public/assets/login-bg.jpg";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthProvider";
import { useI18n } from "../i18n/I18nProvider";

export const Login: React.FC = () => {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isBlurred, setIsBlurred] = useState(false);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuth();
  const [workspace] = useState(() => {
    if (typeof window === "undefined") return "";
    const works = window.localStorage.getItem("workspace");
    return works ? works.replace(/"/g, "") : "";
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBlurred((isBlurred) => !isBlurred);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isBlurred]);

  function handleEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
  }
  function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login successful");
        localStorage.setItem("authToken", "logged-in");
        localStorage.setItem("users", JSON.stringify(data.user.name));
        localStorage.setItem("userEmail", JSON.stringify(data.user.email));
        setUser(data.user);

        // sprawdź w bazie, czy user ma już workspace
        try {
          const wsRes = await fetch("/api/get-workspace", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: data.user.name }),
          });

          if (wsRes.ok) {
            const wsData = await wsRes.json();
            const workspaceName = wsData.workspace as string | null;

            if (workspace) {
              router.push(`/${data.user.name}/${workspace}/tasks`);
              return;
            }

            if (workspaceName) {
              localStorage.setItem("workspace", JSON.stringify(workspaceName));
              router.push(`/${data.user.name}/${workspaceName}/tasks`);
              return;
            }
          }

          // brak workspace w bazie lub błąd API -> first-workspace
          router.push("/first-workspace");
          return;
        } catch {
          router.push("/first-workspace");
          return;
        }
      }
      if (response.status === 400) {
        setError(
          (data?.message as unknown) && typeof data.message === "string"
            ? data.message
            : t("auth.invalidCredentials"),
        );
      } else if (response.status === 401) {
        setError(
          (data?.message as unknown) && typeof data.message === "string"
            ? data.message
            : t("auth.invalidCredentials"),
        );
      } else if (!response.ok) {
        setError(
          (data?.message as unknown) && typeof data.message === "string"
            ? data.message
            : t("auth.loginFailed"),
        );
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError(t("auth.genericError"));
    }
  }

  const inputClassName =
    "bg-neutral-950/60 text-neutral-100 border border-neutral-800 rounded-lg px-4 py-2 w-full text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-neutral-700";

  return (
    <div className="w-full min-h-screen flex flex-col gap-4 justify-center items-center bg-neutral-950 pt-20 pb-40">
      <Image
        src={Background}
        alt="Background"
        className={`fixed top-0 left-0 w-full h-full object-cover z-10 opacity-30 transition-all duration-3000 ${isBlurred ? "blur-sm" : ""}`}
        width={1920}
        height={1080}
      />
      <form
        onSubmit={handleSubmit}
        className="w-[92vw] max-w-md rounded-xl bg-neutral-950/60 px-8 py-6 flex justify-center items-center flex-col gap-5 shadow-lg shadow-black/30 backdrop-blur-sm border border-white/10 z-20"
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
          <h1 className="text-2xl font-bold text-neutral-200 mb-1 text-center">
            {t("auth.loginTitle")} <br />
            <span className="text-white">IncidentHub</span>
          </h1>
          <p className="text-xs text-neutral-500 text-center">
            {t("auth.emailHint")}
          </p>
        </div>
        {error ? (
          <div className="w-full rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="w-full flex flex-col gap-2">
          <label htmlFor="email" className="text-neutral-300 font-medium">
            {t("auth.email")}
          </label>
          <p className="text-xs text-neutral-500 font-light">
            {t("auth.emailHint")}
          </p>
          <input
            type="email"
            id="email"
            name="email"
            className={inputClassName}
            value={email}
            onChange={handleEmailChange}
            placeholder="name@company.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="w-full flex flex-col gap-2">
          <label htmlFor="password" className="text-neutral-300 font-medium">
            {t("auth.password")}
          </label>
          <p className="text-xs text-neutral-500 font-light">
            {t("auth.passwordHint")}
          </p>
          <input
            type="password"
            id="password"
            name="password"
            className={inputClassName}
            value={password}
            onChange={handlePasswordChange}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>
        <div className="w-full flex flex-col items-start gap-1">
          <button
            type="submit"
            className="mt-2 bg-neutral-100 text-neutral-900 rounded-lg px-4 py-2 w-full hover:bg-white transition cursor-pointer font-medium"
          >
            {t("auth.login")}
          </button>
          <Link href="/register">
            <button
              type="button"
              className="text-neutral-400 hover:underline text-sm cursor-pointer"
            >
              {t("auth.registerLink")}
            </button>
          </Link>
        </div>
        {/* <button className='mt-2 text-sm text-neutral-500 hover:underline cursor-pointer'>If you forgot password..</button> */}
      </form>
    </div>
  );
};
