"use client";

import Genwizer from "../../public/assets/logo-genwizer.png";
import Thinkwize from "../../public/assets/thinkwize-logo.png";
import Image from "next/image";
import { useI18n } from "../i18n/I18nProvider";

export const Sponsors = () => {
  const { t } = useI18n();

  return (
    <main className="w-full min-h-[50vh] bg-[#090909] overflow-hidden relative flex flex-col items-center gap-4 pt-10 px-6 md:px-12 lg:px-56 body-text text-center text-neutral-100 pb-8">
      <h2 className="text-3xl sm:text-4xl font-medium heading text-white">
        {t("sponsors.title")}
      </h2>
      <div className="w-40 sm:w-[300px] h-[1px] bg-gradient-to-r from-20%-transparent via-neutral-400 to-80%-transparent"></div>
      <div className="grid w-full gap-6 sm:gap-8 mt-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        <div className="flex items-center justify-center gap-3 sm:gap-4 py-4 px-6 sm:px-8 rounded-2xl border-x border-neutral-800/70 bg-neutral-950/30">
          <Image
            src={Genwizer}
            alt="logo-genwizer"
            className="w-10 h-10 sm:w-12 sm:h-12"
          />
          <span className="text-2xl sm:text-3xl text-white font-medium">
            Genwizer
          </span>
        </div>
        <div className="flex items-center justify-center gap-3 sm:gap-4 py-4 px-6 sm:px-8 rounded-2xl border-x border-neutral-800/70 bg-neutral-950/30">
          <Image
            src={Thinkwize}
            alt="logo-thinkwize"
            className="w-32 sm:w-40 h-auto"
          />
        </div>
        <div className="flex items-center justify-center gap-3 sm:gap-4 py-4 px-6 sm:px-8 rounded-2xl border-x border-neutral-800/70 bg-neutral-950/30">
          <span className="text-2xl sm:text-3xl text-white font-medium heading">
            Szymon Kowalski
          </span>
        </div>
      </div>
    </main>
  );
};
