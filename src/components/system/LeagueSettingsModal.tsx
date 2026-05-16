"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getLeagueSettingsAction,
  updateLeagueSettingsAction,
} from "@/lib/actions/system-dashboard";
import { LeagueSettings } from "@/lib/types/league";

// ─── Helper: convert Date → datetime-local string ────────────
function toInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  // datetime-local expects "YYYY-MM-DDTHH:mm"
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Props ────────────────────────────────────────────────────
interface LeagueSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────
export function LeagueSettingsModal({
  isOpen,
  onClose,
}: LeagueSettingsModalProps) {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [startVal, setStartVal] = useState("");
  const [endVal, setEndVal] = useState("");
  const [bannerVal, setBannerVal] = useState("");
  const [manualOverride, setManualOverride] = useState(false);

  // Load settings when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setFeedback(null);
    setLoading(true);

    getLeagueSettingsAction().then((s) => {
      setStartVal(
        toInputValue(
          s.transferPeriodStart ? new Date(s.transferPeriodStart) : null
        )
      );
      setEndVal(
        toInputValue(s.transferPeriodEnd ? new Date(s.transferPeriodEnd) : null)
      );
      setBannerVal(s.bannerText ?? "");
      setManualOverride(s.isManualOverride ?? false);
      setLoading(false);
    });
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleSave = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateLeagueSettingsAction({
        transferPeriodStart: startVal || null,
        transferPeriodEnd: endVal || null,
        bannerText: bannerVal.trim() || null,
        isManualOverride: manualOverride,
      });

      if (result.success) {
        setFeedback({ type: "success", message: "Configuración guardada correctamente." });
        setTimeout(onClose, 1200);
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/40"
            style={{ backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            key="modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div
              className="w-full max-w-md rounded-3xl border border-blue-100 p-7 shadow-2xl"
              style={{ background: "#F5F5F5" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.16em]"
                    style={{ color: "#005CEE" }}
                  >
                    ⚙ The Lock — Ajustes
                  </p>
                  <h2
                    className="mt-1 text-xl font-black"
                    style={{ color: "#1e3a5f" }}
                  >
                    Mercado de Pases
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/10"
                  aria-label="Cerrar"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1e3a5f"
                    strokeWidth="2.5"
                    className="h-4 w-4"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {loading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-11 rounded-xl bg-blue-100/60" />
                  <div className="h-11 rounded-xl bg-blue-100/60" />
                  <div className="h-20 rounded-xl bg-blue-100/60" />
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Start date */}
                  <div>
                    <label
                      htmlFor="the-lock-start"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wider"
                      style={{ color: "#1e3a5f" }}
                    >
                      Fecha de Inicio
                    </label>
                    <input
                      id="the-lock-start"
                      type="datetime-local"
                      value={startVal}
                      onChange={(e) => setStartVal(e.target.value)}
                      className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none ring-0 transition focus:border-[#005CEE] focus:ring-2 focus:ring-[#005CEE]/20"
                    />
                  </div>

                  {/* End date */}
                  <div>
                    <label
                      htmlFor="the-lock-end"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wider"
                      style={{ color: "#1e3a5f" }}
                    >
                      Fecha de Cierre
                    </label>
                    <input
                      id="the-lock-end"
                      type="datetime-local"
                      value={endVal}
                      onChange={(e) => setEndVal(e.target.value)}
                      className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none ring-0 transition focus:border-[#005CEE] focus:ring-2 focus:ring-[#005CEE]/20"
                    />
                  </div>

                  {/* Banner text */}
                  <div>
                    <label
                      htmlFor="the-lock-banner"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wider"
                      style={{ color: "#1e3a5f" }}
                    >
                      Texto del Banner (Sistema Cerrado)
                    </label>
                    <textarea
                      id="the-lock-banner"
                      value={bannerVal}
                      onChange={(e) => setBannerVal(e.target.value)}
                      rows={3}
                      placeholder="Ej: El Mercado de Pases está cerrado temporalmente."
                      className="w-full resize-none rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#005CEE] focus:ring-2 focus:ring-[#005CEE]/20"
                    />
                  </div>

                  {/* Manual override toggle */}
                  <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-white px-4 py-3">
                    <div>
                      <p
                        className="text-sm font-bold"
                        style={{ color: "#1e3a5f" }}
                      >
                        Activar Manualmente
                      </p>
                      <p className="text-xs text-slate-500">
                        Ignora las fechas y fuerza apertura
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={manualOverride}
                      onClick={() => setManualOverride((v) => !v)}
                      className="relative h-6 w-11 rounded-full transition-colors duration-200"
                      style={{
                        background: manualOverride ? "#005CEE" : "#CBD5E1",
                      }}
                    >
                      <span
                        className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
                        style={{
                          transform: manualOverride
                            ? "translateX(20px)"
                            : "translateX(0)",
                        }}
                      />
                    </button>
                  </div>

                  {/* Feedback */}
                  <AnimatePresence>
                    {feedback && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                          feedback.type === "success"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-red-50 text-red-800"
                        }`}
                      >
                        {feedback.message}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isPending}
                      className="flex-1 rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      id="the-lock-save-btn"
                      onClick={handleSave}
                      disabled={isPending}
                      className="flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-md transition active:scale-95 disabled:opacity-60"
                      style={{
                        background: isPending
                          ? "#0047C0"
                          : "linear-gradient(135deg,#005CEE,#0047C0)",
                        boxShadow: "0 6px 20px rgba(0,92,238,0.35)",
                      }}
                    >
                      {isPending ? "Guardando…" : "Guardar cambios"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
