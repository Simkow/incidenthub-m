import React from "react";

export const Intro: React.FC = () => {
  return (
    <section className="w-full min-h-screen bg-[#121212]">
      <div className="loader">
        <div className="line l1"></div>
        <div className="line l2"></div>
        <div className="line l3"></div>
        <div className="line l4"></div>
        <div className="line l5"></div>
      </div>
    </section>
  );
};
