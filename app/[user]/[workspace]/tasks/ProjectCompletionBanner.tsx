"use client";

import { AnimatePresence, motion } from "motion/react";

type Props = {
  open: boolean;
  allTasksCount: number;
  onClose: () => void;
};

export function ProjectCompletionModal({
  open,
  allTasksCount,
  onClose,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="completion-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            key="completion-modal"
            initial={{ opacity: 0, filter: "blur(10px)", scale: 0.98 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, filter: "blur(10px)", scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-xl rounded-xl bg-[#181818] border border-[#2e2e2e] text-white"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e2e2e]">
              <h2 className="text-sm">Project complete</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-xs px-2 py-1 rounded-lg border border-[#2e2e2e] hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="p-5 flex flex-col gap-2">
              <div className="text-lg">Congratulations!</div>
              <div className="text-sm text-neutral-300">
                You’ve finished all {allTasksCount} tasks. Great work.
              </div>

              <div className="mt-3 rounded-lg border border-[#2e2e2e] bg-neutral-950/30 px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-neutral-300">Completion</span>
                <span className="text-xs px-2 py-1 rounded-lg border border-[#2e2e2e] text-neutral-200">
                  100%
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
