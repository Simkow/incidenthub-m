"use client";

import Image from "next/image";
import Members from "../../public/assets/members-view.png";
import Workspace from "../../public/assets/workspace-view.png";
import Dashboard from "../../public/assets/dashboard-view.png";
import Inbox from "../../public/assets/inbox-view.png";
import { motion } from "motion/react";
import { useI18n } from "../i18n/I18nProvider";

export const Presentation = () => {
  const { t } = useI18n();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  const cardEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

  const cardVariants = {
    hidden: { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: cardEase },
    },
  };

  return (
    <main className="w-full max-md:min-h-screen max-md:justify-center h-full bg-[#090909] overflow-hidden relative gap-8 flex flex-col pt-10 md:pt-10 px-6 md:px-12 lg:px-56 body-text text-center text-neutral-100 pb-32 md:pb-20">
      <div className="w-full h-full z-0">
        <div className="w-37.5 h-37.5 md:w-52 md:h-52 rounded-full bg-[#dceef6] absolute blur-3xl left-0 top-32 opacity-20 md:opacity-50"></div>
        <div className="w-24 h-32 md:w-64 md:h-82 rounded-full bg-[#dceef6] absolute blur-3xl max-md:right-8 md:right-0 bottom-4 md:bottom-40 opacity-20 md:opacity-30 -rotate-10"></div>
      </div>
      <div className="flex flex-col items-center w-full z-20">
        <div className="flex flex-col w-full items-center gap-1">
          <span className="heading max-md:text-base text-xl text-neutral-400">
            {t("presentation.kicker")}
          </span>
          <h2 className="max-md:text-3xl text-5xl heading font-bold">
            {t("presentation.title")}
          </h2>
          <div className="max-md:w-[90%] md:w-[400px] h-[1px] bg-neutral-400 mt-3"></div>
        </div>
        <motion.div
          className="grid w-full gap-6 mt-10 grid-cols-1 lg:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.section
            variants={cardVariants}
            className="w-full max-md:h-[350px] h-[450px] rounded-xl border border-neutral-800 flex flex-col gap-2 p-3 bg-neutral-950"
          >
            <h2 className="heading text-xl text-neutral-200 font-semibold">
              {t("presentation.cards.workspace.title")}
            </h2>
            <div className="flex gap-2 justify-center">
              <Image
                src={Members}
                alt="members-view"
                className="w-full rounded-xl border border-neutral-800"
              />
            </div>
            <span className="body-text text-base font-light text-neutral-300 text-start">
              {t("presentation.cards.workspace.body")}
            </span>
          </motion.section>

          <motion.section
            variants={cardVariants}
            className="w-full max-md:h-[350px] h-[450px] rounded-xl border border-neutral-800 flex flex-col gap-2 p-3 bg-neutral-950"
          >
            <h2 className="heading text-xl text-neutral-200 font-semibold">
              {t("presentation.cards.inbox.title")}
            </h2>
            <div className="flex gap-2 justify-center">
              <Image
                src={Inbox}
                alt="workspace-view"
                className="w-full rounded-xl border border-neutral-800"
              />
            </div>
            <span className="body-text text-base font-light text-neutral-300 text-start">
              {t("presentation.cards.inbox.body")}
            </span>
          </motion.section>

          <motion.section
            variants={cardVariants}
            className="w-full max-md:h-[350px] h-[450px] rounded-xl border border-neutral-800 flex flex-col gap-2 p-3 bg-neutral-950"
          >
            <h2 className="heading text-xl text-neutral-200 font-semibold">
              {t("presentation.cards.projects.title")}
            </h2>
            <div className="flex gap-2 justify-center">
              <Image
                src={Dashboard}
                alt="dashboard-view"
                className="w-full rounded-xl border border-neutral-800"
              />
            </div>
            <span className="body-text text-base font-light text-neutral-300 text-start">
              {t("presentation.cards.projects.body")}
            </span>
          </motion.section>

          <motion.section
            variants={cardVariants}
            className="w-full max-md:h-[350px] h-[450px] rounded-xl border border-neutral-800 flex flex-col gap-2 p-3 bg-neutral-950"
          >
            <h2 className="heading text-xl text-neutral-200 font-semibold">
              {t("presentation.cards.notes.title")}
            </h2>
            <div className="flex gap-2 justify-center">
              <Image
                src={Workspace}
                alt="notes-view"
                className="w-full rounded-xl border border-neutral-800"
              />
            </div>
            <span className="body-text text-base font-light text-neutral-300 text-start">
              {t("presentation.cards.notes.body")}
            </span>
          </motion.section>
        </motion.div>
      </div>
    </main>
  );
};
