"use client";

import { motion } from "framer-motion";

type Metric = {
  label: string;
  value: number;
  subtitle: string;
};

export function PremiumMetrics({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {metrics.map((metric, index) => (
        <motion.article
          key={metric.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06, duration: 0.28 }}
          whileHover={{ y: -3, scale: 1.01 }}
          className="group rounded-2xl border border-[#BFDBFE] bg-white p-5 shadow-[0_12px_30px_-20px_rgba(59,130,246,0.55)]"
        >
          <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500">{metric.label}</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{metric.value}</p>
          <p className="mt-1 text-xs text-slate-500">{metric.subtitle}</p>
          <div className="mt-3 h-1.5 rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(metric.value * 8, 100)}%` }}
              transition={{ delay: 0.2 + index * 0.08, duration: 0.5 }}
              className="h-full rounded-full bg-[#3B82F6]"
            />
          </div>
        </motion.article>
      ))}
    </div>
  );
}
