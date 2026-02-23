"use client";

import { motion } from "motion/react";

export const Dashboard: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-[#121212] flex"
    >
      <section className="py-2 w-full">
        <main className="w-full border-y border-l rounded-l-xl border-[#2e2e2e] bg-[#181818]"></main>
      </section>
    </motion.div>
  );
};
