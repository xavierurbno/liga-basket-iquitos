import { z } from "zod";

export const metodoPagoTreasuryZ = z.enum(["EFECTIVO", "PLIN", "YAPE"]);
export const tipoTreasuryZ = z.enum(["income", "expense"]);

export const createTreasuryTxSchema = z.object({
  clubId: z.string().uuid(),
  type: tipoTreasuryZ,
  amount: z.coerce.number().positive("El amount debe ser mayor a 0"),
  concept: z.string().trim().min(2, "Concepto demasiado corto").max(200),
  paymentChannel: metodoPagoTreasuryZ,
  transactionDate: z.coerce.date(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export type CreateTreasuryTxValues = z.infer<typeof createTreasuryTxSchema>;
