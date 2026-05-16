"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  createTreasuryTxSchema,
  type CreateTreasuryTxValues,
} from "@/lib/validations/treasury";
import { createTreasuryTransaction } from "@/lib/actions/treasury";

type ClubOption = { id: string; name: string };

export function TesoreriaMovementModal({
  clubs,
  defaultOrganizationId,
}: {
  clubs: ClubOption[];
  defaultOrganizationId?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const defaultClubId = clubs[0]?.id ?? "";

  const form = useForm<CreateTreasuryTxValues>({
    resolver: zodResolver(createTreasuryTxSchema) as Resolver<CreateTreasuryTxValues>,
    defaultValues: {
      clubId: defaultClubId,
      type: "income",
      amount: 0,
      concept: "",
      paymentChannel: "EFECTIVO",
      transactionDate: new Date(),
      notes: "",
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && defaultClubId) {
      form.setValue("clubId", defaultClubId);
    }
  }, [open, defaultClubId, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    const res = await createTreasuryTransaction(values);
    if (!res.success) {
      setServerError(res.error);
      return;
    }
    setOpen(false);
    form.reset({
      clubId: defaultClubId,
      type: "income",
      amount: 0,
      concept: "",
      paymentChannel: "EFECTIVO",
      transactionDate: new Date(),
      notes: "",
    });
    /** No esperar al refresh RSC: si no, el submit sigue en "Guardando…" hasta re-ejecutar toda la página. */
    void router.refresh();
  });

  const overlay =
    mounted &&
    createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-90 flex items-center justify-center bg-[#0f2040]/45 p-4 backdrop-blur-[2px]"
            role="dialog"
            aria-modal
            aria-labelledby="tesoreria-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.18 }}
              className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#93C5FD] bg-white p-6 shadow-[0_28px_90px_-36px_rgba(30,58,138,0.75)]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 id="tesoreria-modal-title" className="text-lg font-bold text-[#0f2040]">
                    Registrar movimiento
                  </h2>
                  <p className="mt-1 text-xs text-slate-600">
                    Ingreso o egreso con método Plin, Yape o Efectivo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cerrar
                </button>
              </div>

              <form className="space-y-4" onSubmit={onSubmit}>
                {clubs.length > 1 && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Club
                    </label>
                    <select
                      className="mt-1 w-full rounded-xl border border-[#BFDBFE] bg-[#F8FAFC] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/25"
                      {...form.register("clubId")}
                    >
                      {clubs.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.clubId && (
                      <p className="mt-1 text-xs text-red-600">{form.formState.errors.clubId.message}</p>
                    )}
                  </div>
                )}
                {clubs.length === 1 && <input type="hidden" {...form.register("clubId")} />}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tipo
                    </label>
                    <select
                      className="mt-1 w-full rounded-xl border border-[#BFDBFE] bg-[#F8FAFC] px-3 py-2 text-sm"
                      {...form.register("type")}
                    >
                      <option value="income">Ingreso</option>
                      <option value="expense">Egreso</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Método de pago
                    </label>
                    <select
                      className="mt-1 w-full rounded-xl border border-[#BFDBFE] bg-[#F8FAFC] px-3 py-2 text-sm"
                      {...form.register("paymentChannel")}
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="PLIN">Plin</option>
                      <option value="YAPE">Yape</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Monto (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="mt-1 w-full rounded-xl border border-[#BFDBFE] bg-[#F8FAFC] px-3 py-2 text-sm outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/25"
                    {...form.register("amount", { valueAsNumber: true })}
                  />
                  {form.formState.errors.amount && (
                    <p className="mt-1 text-xs text-red-600">{form.formState.errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Concepto
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-[#BFDBFE] bg-[#F8FAFC] px-3 py-2 text-sm outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/25"
                    {...form.register("concept")}
                  />
                  {form.formState.errors.concept && (
                    <p className="mt-1 text-xs text-red-600">{form.formState.errors.concept.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Fecha
                  </label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-[#BFDBFE] bg-[#F8FAFC] px-3 py-2 text-sm outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/25"
                    value={
                      form.watch("transactionDate") instanceof Date
                        ? (form.watch("transactionDate") as Date).toISOString().slice(0, 10)
                        : ""
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      form.setValue("transactionDate", v ? new Date(`${v}T12:00:00`) : new Date(), {
                        shouldValidate: true,
                      });
                    }}
                  />
                  {form.formState.errors.transactionDate && (
                    <p className="mt-1 text-xs text-red-600">{form.formState.errors.transactionDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Descripción (opcional)
                  </label>
                  <textarea
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-[#BFDBFE] bg-[#F8FAFC] px-3 py-2 text-sm outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/25"
                    {...form.register("notes")}
                  />
                </div>

                {serverError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {serverError}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="rounded-xl bg-[#1e3a8a] px-4 py-2 text-sm font-bold text-white shadow-[0_14px_32px_-18px_rgba(30,58,138,0.9)] hover:bg-[#172554] disabled:opacity-60"
                  >
                    {form.formState.isSubmitting ? "Guardando…" : "Guardar movimiento"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );

  if (clubs.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-[#1e3a8a] px-4 py-2.5 text-sm font-bold text-white shadow-[0_18px_40px_-22px_rgba(30,58,138,0.95)] transition hover:bg-[#172554]"
      >
        Registrar movimiento
      </button>
      {overlay}
    </>
  );
}
