"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CrearCategoriaForm } from "@/components/system/CrearCategoriaForm";
import { CategoriaWizardInitialData } from "@/lib/types/category";

/**
 * Modal de creación/edición de categoría.
 * El portal solo se monta cuando `open` es true (evita dos portales vacíos en la página
 * y carreras con AnimatePresence al cambiar de paso entrenador → delegado).
 */
export function CategoryWizardModal({
  clubId,
  mode = "create",
  initialData,
  initialStep = 1,
  triggerLabel,
  triggerClassName,
}: {
  clubId: string;
  mode?: "create" | "edit";
  initialData?: CategoriaWizardInitialData;
  initialStep?: 1 | 2 | 3;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const defaultTriggerClass =
    mode === "edit"
      ? "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
      : "rounded-xl bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_28px_-18px_rgba(59,130,246,0.9)]";

  const formInstanceKey = `${mode}-${initialData?.categoryId ?? "new"}-entry${initialStep}`;

  const overlay =
    mounted &&
    open &&
    createPortal(
      <div
        className="fixed inset-0 z-200 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-wizard-title"
          className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#60A5FA] bg-[#F8FAFC] p-4 shadow-[0_25px_80px_-30px_rgba(59,130,246,0.65)]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 id="category-wizard-title" className="text-lg font-bold text-slate-900">
              {mode === "edit" ? "Editar Categoría" : "Crear Categoría"}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700"
            >
              Cerrar
            </button>
          </div>
          <CrearCategoriaForm
            key={formInstanceKey}
            clubId={clubId}
            mode={mode}
            initialData={initialData}
            initialStep={initialStep}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName ?? defaultTriggerClass}
      >
        {triggerLabel ?? (mode === "edit" ? "Editar" : "Crear Categoría")}
      </button>

      {overlay}
    </>
  );
}
