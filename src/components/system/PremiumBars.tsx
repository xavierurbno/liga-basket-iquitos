"use client";

import { motion } from "framer-motion";

export function PremiumBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-44 items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="flex-1">
          <motion.div
            initial={{ height: 0, opacity: 0.7 }}
            animate={{ height: `${Math.max((value / max) * 100, 8)}%`, opacity: 1 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className="w-full rounded-t-md bg-linear-to-t from-[#2563EB] to-[#93C5FD]"
          />
        </div>
      ))}
    </div>
  );
}
