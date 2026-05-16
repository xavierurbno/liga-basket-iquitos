"use client";

import { useEffect, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { PlayerDetailsModalProps } from "@/lib/types/busqueda";

/**
 * Modal de detalle con superficie de datos mínima por privacidad.
 * No acepta ni renderiza DNI ni transactionDate de nacimiento — esos datos no deben salir del servidor.
 *
 * Datos de ficha: `imageUrl`, `fullName`, `poloNumber`, `clubName`, `categoryLabel` (sin DNI ni transactionDate de nacimiento).
 * `open` y `onClose` solo controlan el diálogo.
 */

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function PlayerDetailsModal({
  open,
  onClose,
  imageUrl,
  fullName,
  poloNumber,
  clubName,
  categoryLabel,
}: PlayerDetailsModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="presentation"
          className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Cerrar modal"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-indigo-200/80 bg-white shadow-[0_25px_60px_-20px_rgba(30,27,75,0.35)]"
          >
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-900"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5 stroke-2" />
              </button>
            </div>

            <div className="px-8 pb-8 pt-14 text-center">
              <div className="mx-auto flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl border-4 border-indigo-100 bg-linear-to-br from-indigo-50 to-slate-100 shadow-inner ring-1 ring-indigo-100/80">
                {imageUrl ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={imageUrl}
                      alt={fullName}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  </div>
                ) : (
                  <span className="text-3xl font-bold tracking-tight text-indigo-300">
                    {initialsFromName(fullName)}
                  </span>
                )}
              </div>

              <h2
                id={titleId}
                className="mt-6 text-2xl font-bold uppercase tracking-tight text-[#0f2040]"
              >
                {fullName}
              </h2>

              <div className="mt-4 space-y-1 border-y border-indigo-100/90 py-4 text-center">
                <p className="text-sm font-semibold text-indigo-900">{clubName}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{categoryLabel}</p>
              </div>

              <div className="mt-6 flex justify-center">
                <div
                  className="inline-flex items-center gap-3 rounded-2xl border border-indigo-200/85 bg-white px-5 py-3.5 shadow-sm ring-1 ring-indigo-950/5"
                  title="Número de polo"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/25 bg-linear-to-br from-indigo-600 to-slate-900 text-base font-bold tabular-nums text-white shadow-lg"
                    aria-hidden
                  >
                    {poloNumber != null ? poloNumber : "--"}
                  </span>
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-600">
                    N°{" "}
                    <span className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                      {poloNumber != null ? poloNumber : "--"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
