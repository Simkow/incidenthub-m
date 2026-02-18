'use client';

import { motion } from 'motion/react'
import { useState, useEffect } from 'react'

export const Project: React.FC = () => {
    const [username] = useState(() => {
        if (typeof window === "undefined") {
            return;
        }
        const user = localStorage.getItem("users");
        if (!user) {
            return;
        }
        const userTransformed = user.replace(/"/g, "");
        return userTransformed;
    })

    
    return (
        <motion.main
        initial={{ opacity: 0, filter: "blur(10px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.5 }}
        className="w-full h-screen bg-[#121212] flex"
        >
            <section className="py-2 w-full h-full">
                <main className="w-full h-full border-y border-l rounded-l-xl border-[#2e2e2e] bg-[#181818] flex flex-col items-center p-4 gap-8 text-white relative">
                
                </main>
            </section>
        </motion.main>
    )
}
