"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { Club } from "@/lib/db/schema";
import { CrearClubForm } from "@/components/system/CrearClubForm";

type EditarClubModalProps = {
  club: Club;
};

/**
 * Modal de edición: `panelKey` fuerza remount del formulario al cambiar de club.
 * Overlay en `document.body` + z-[100] para no quedar bajo el header de la intranet.
 */
export function EditarClubModal({ club }: EditarClubModalProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelKey = open ? club.id : "cerrado";

  useEffect(() => {
    setMounted(true);
  }, []);

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/40 backdrop-blur-[2px]"
        >
          <div className="box-border flex min-h-dvh w-full items-center justify-center px-4 pb-12 pt-[max(2.5rem,env(safe-area-inset-top,0px))] sm:px-5 sm:pb-16 sm:pt-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.18 }}
              className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#60A5FA] bg-[#F8FAFC] shadow-[0_25px_80px_-30px_rgba(59,130,246,0.65)] max-h-[min(90vh,calc(100dvh-5rem))]"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-[#BFDBFE]/60 px-4 py-3">
                <h2 className="text-lg font-bold text-slate-900">Editar club</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700"
                >
                  Cerrar
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
                <CrearClubForm
                  key={panelKey}
                  initialData={club}
                  onSuccess={() => setOpen(false)}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
      >
        Editar
      </button>
      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}
