/**
 * SCHEMAS DE VALIDACIÓN - ZOD
 */
import { z } from "zod";

const dniSchema = z.string().length(8, "El DNI debe tener 8 dígitos").regex(/^\d{8}$/, "Solo números");
const telefonoSchema = z.string().regex(/^[09]\d{8}$/, "9 dígitos").optional().or(z.literal(""));

export const registroJugadorSchema = z.object({
  nombres: z.string().min(2).max(80),
  apellidos: z.string().min(2).max(80),
  dni: dniSchema,
  fechaNacimiento: z.coerce.date(),
  genero: z.enum(["MASCULINO", "FEMENINO"]),
  telefono: telefonoSchema,
  email: z.string().email().optional().or(z.literal("")),
  nombreTutor: z.string().optional(),
  dniTutor: z.string().optional(),
  telefonoTutor: telefonoSchema,
}).superRefine((data, ctx) => {
  const edad = new Date().getFullYear() - data.fechaNacimiento.getFullYear();
  if (edad < 18 && (!data.nombreTutor || !data.dniTutor)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tutor obligatorio", path: ["nombreTutor"] });
  }
});

export const movimientoCajaSchema = z.object({
  tipo: z.enum(["INGRESO", "EGRESO"]),
  monto: z.number().positive().max(999999.99),
  concepto: z.string().min(3).max(200),
  canalPago: z.enum(["YAPE", "PLIN", "EFECTIVO", "TRANSFERENCIA", "BCP", "BBVA", "INTERBANK"]),
  fechaMovimiento: z.coerce.date(),
});

export type RegistroJugadorForm = z.infer<typeof registroJugadorSchema>;
export type MovimientoCajaForm = z.infer<typeof movimientoCajaSchema>;
