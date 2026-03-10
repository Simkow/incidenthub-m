"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Team from "../../public/assets/teams.png";
import Individual from "../../public/assets/user.png";
import { useI18n } from "../i18n/I18nProvider";

export function CreatedFor() {
  const { t } = useI18n();

  const data = [
    {
      icon: Team,
      title: t("createdFor.cards.teams.title"),
      subtitle: t("createdFor.cards.teams.subtitle"),
      description: t("createdFor.cards.teams.description"),
      badge: t("createdFor.cards.teams.badge"),
      iconClassName: "w-14 h-14 sm:w-16 sm:h-16",
    },
    {
      icon: Individual,
      title: t("createdFor.cards.individual.title"),
      subtitle: t("createdFor.cards.individual.subtitle"),
      description: t("createdFor.cards.individual.description"),
      badge: t("createdFor.cards.individual.badge"),
      iconClassName: "w-10 h-10 sm:w-12 sm:h-12",
    },
  ];

  return (
    <main className="w-full bg-[#090909] overflow-hidden relative px-6 md:px-12 lg:px-56 pt-12 md:pt-10 pb-20 md:pb-28">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[-4rem] top-20 h-48 w-48 rounded-full bg-[#dceef6]/10 blur-3xl md:h-72 md:w-72" />
        <div className="absolute right-[-2rem] bottom-10 h-40 w-40 rounded-full bg-white/8 blur-3xl md:h-64 md:w-64" />
      </div>

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-8 text-neutral-100">
        <div className="flex max-w-2xl flex-col items-center gap-3 text-center">
          <span className="heading text-base sm:text-lg text-neutral-400">
            {t("createdFor.kicker")}
          </span>
          <h2 className="heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            {t("createdFor.title")}
          </h2>
          {/* <div className="h-px w-36 sm:w-52 bg-white to-transparent" /> */}
          <p className="body-text max-w-2xl text-sm leading-7 text-neutral-300 sm:text-base">
            {t("createdFor.intro")}
          </p>
        </div>

        <div className="grid w-full gap-5 md:gap-6 lg:grid-cols-2">
          {data.map((section, index) => (
            <motion.article
              key={section.title}
              initial={{ opacity: 0, y: 22, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="group relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-3xl border border-white/8 bg-linear-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-5 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)]"
            >
              <div className="absolute inset-0 bg-linear-to-br from-white/[0.03] via-transparent to-transparent opacity-80" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex max-w-[75%] flex-col gap-2">
                  <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-300">
                    {section.badge}
                  </span>
                  <h3 className="heading text-2xl sm:text-3xl font-semibold text-white">
                    {section.title}
                  </h3>
                  <p className="body-text text-sm sm:text-base text-neutral-400">
                    {section.subtitle}
                  </p>
                </div>

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 sm:h-20 sm:w-20">
                  <Image
                    src={section.icon}
                    alt={section.title}
                    className={section.iconClassName}
                  />
                </div>
              </div>

              <p className="relative mt-8 body-text text-sm leading-7 text-neutral-200 sm:text-base">
                {section.description}
              </p>

              <div className="relative mt-8 flex items-center justify-between gap-4 border-t border-white/8 pt-4 text-xs uppercase tracking-[0.2em] text-neutral-500 sm:text-sm">
                <span>{t("createdFor.footerLabel")}</span>
                <span className="text-neutral-300 transition-colors duration-300 group-hover:text-white">
                  {t("createdFor.footerValue")}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </main>
  );
}
