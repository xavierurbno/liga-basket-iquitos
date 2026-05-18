/**
 * SCHEMAS DE VALIDACIÓN — Zod 4
 * Fuente única de verdad para formularios (cliente + server actions).
 */
import { z } from "zod";
import { calcularEdadAnios } from "@/lib/utils/category";

function normalizePeruPhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Celular/fijo PE: 9 dígitos; vacío permitido. Default "" para campos no enviados en FormData. */
const telefonoOpcional = z
  .string()
  .default("")
  .superRefine((val, ctx) => {
    const digits = normalizePeruPhone(val);
    if (digits !== "" && !/^[09]\d{8}$/.test(digits)) {
      ctx.addIssue({
        code: "custom",
        message: "Ingresa un celular válido de 9 dígitos (ej. 987654321)",
      });
    }
  });

const birthdateField = z
  .string()
  .min(1, "La fecha de nacimiento es obligatoria")
  .refine((s) => {
    const d = new Date(s.length === 10 ? `${s}T12:00:00` : s);
    return !Number.isNaN(d.getTime());
  }, "La fecha de nacimiento no es válida")
  .transform((s) => new Date(s.length === 10 ? `${s}T12:00:00` : s))
  .refine((d) => d >= new Date("1940-01-01"), "La fecha de nacimiento es demasiado antigua")
  .refine((d) => d <= new Date(), "La fecha de nacimiento no puede ser futura");

const REGISTRO_JUGADOR_FIELD_LABELS: Record<string, string> = {
  name: "Nombres",
  lastname: "Apellidos",
  documentNumber: "N° de documento",
  documentType: "Tipo de documento",
  birthdate: "Fecha de nacimiento",
  gender: "Género",
  phone: "Contacto del deportista",
  tutorName: "Nombre del apoderado",
  tutorDocumentNumber: "Documento del apoderado",
  tutorPhone: "Teléfono del apoderado",
  tutorDocumentType: "Tipo de documento del apoderado",
  jerseyNumber: "N° de polo",
  email: "Correo",
  foto: "Foto",
  emergencyContact: "Contacto de emergencia",
};

/** Mensajes legibles en español (evita «Invalid input» genérico de Zod 4). */
export function formatRegistroJugadorZodError(error: z.ZodError): string {
  const parts = error.issues.map((issue) => {
    const key = String(issue.path[0] ?? "");
    const label = REGISTRO_JUGADOR_FIELD_LABELS[key] ?? (key || "Formulario");
    let msg = issue.message;

    if (msg === "Invalid input" || msg === "Invalid date" || issue.code === "invalid_type") {
      if (key === "birthdate") return "Fecha de nacimiento: valor no válido.";
      return `${label}: valor no válido o incompleto.`;
    }
    if (msg.includes("name debe")) msg = msg.replace(/name/gi, "nombre");
    if (msg.includes("lastname")) msg = msg.replace(/lastname/gi, "apellidos");
    if (key && !msg.toLowerCase().includes(label.toLowerCase())) {
      return `${label}: ${msg}`;
    }
    return msg;
  });
  const unique = [...new Set(parts.filter(Boolean))];
  return unique.length > 0 ? unique.join(" · ") : "Revisa los campos del formulario.";
}

const baseIdentitySchema = [
  z.object({
    documentType: z.literal("DNI"),
    documentNumber: z
      .string()
      .trim()
      .length(8, "El DNI debe tener exactamente 8 dígitos")
      .regex(/^\d{8}$/, "El DNI solo debe contener números"),
  }),
  z.object({
    documentType: z.literal("CE"),
    documentNumber: z
      .string()
      .trim()
      .toUpperCase()
      .min(9, "El CE debe tener al menos 9 caracteres")
      .max(15, "El CE debe tener máximo 15 caracteres")
      .regex(/^[a-zA-Z0-9]+$/, "El documento debe ser alfanumérico"),
  }),
  z.object({
    documentType: z.literal("PASAPORTE"),
    documentNumber: z
      .string()
      .trim()
      .toUpperCase()
      .min(6, "El pasaporte debe tener al menos 6 caracteres")
      .max(15, "El pasaporte debe tener máximo 15 caracteres")
      .regex(/^[a-zA-Z0-9]+$/, "El documento debe ser alfanumérico"),
  }),
] as const;

const playerIdentitySchema = z.discriminatedUnion("documentType", [...baseIdentitySchema]);

// Para el tutor, permitimos que sea opcional pero si viene debe validar
const tutorIdentitySchema = z.discriminatedUnion("tutorDocumentType", [
  z.object({
    tutorDocumentType: z.literal("DNI"),
    tutorDocumentNumber: z.string().regex(/^\d{8}$/, "DNI de 8 dígitos").optional().or(z.literal("")),
  }),
  z.object({
    tutorDocumentType: z.literal("CE"),
    tutorDocumentNumber: z.string().min(8).max(20).regex(/^[a-zA-Z0-9]+$/).optional().or(z.literal("")),
  }),
  z.object({
    tutorDocumentType: z.literal("PASAPORTE"),
    tutorDocumentNumber: z.string().min(8).max(20).regex(/^[a-zA-Z0-9]+$/).optional().or(z.literal("")),
  }),
]);

export const registroJugadorSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Los nombres deben tener al menos 2 caracteres")
      .max(80, "Máximo 80 caracteres")
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras en los nombres"),

    lastname: z
      .string()
      .trim()
      .min(2, "Los apellidos deben tener al menos 2 caracteres")
      .max(80, "Máximo 80 caracteres")
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras en los apellidos"),

    documentType: z.enum(["DNI", "CE", "PASAPORTE"]).default("DNI"),
    documentNumber: z.string(),

    birthdate: birthdateField,

    gender: z.enum(["MASCULINO", "FEMENINO", "MIXTO"], {
      error: "Selecciona un género",
    }),

    phone: telefonoOpcional,
    email: z.union([z.literal(""), z.string().email("Email inválido")]),
    address: z.string().max(200).optional(),

    position: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.enum(["BASE", "ESCOLTA", "ALERO", "ALA-PIVOT", "PIVOT"]).optional()
    ),
    jerseyNumber: z.preprocess(
      (v) =>
        v === "" || v === null || v === undefined || (typeof v === "number" && Number.isNaN(v))
          ? undefined
          : v,
      z.number().int().min(0).max(99).optional()
    ),
    size: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.enum(["XS", "S", "M", "L", "XL", "XXL"]).optional()
    ),

    bloodType: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional()
    ),
    allergies: z.string().max(500).optional(),
    emergencyContact: telefonoOpcional,

    tutorName: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((v) => v ?? ""),
    tutorDocumentType: z.enum(["DNI", "CE", "PASAPORTE"]).default("DNI"),
    tutorDocumentNumber: z
      .string()
      .trim()
      .toUpperCase()
      .optional()
      .transform((v) => v ?? ""),
    tutorPhone: telefonoOpcional,
  })
  .superRefine((data, ctx) => {
    // Validar Identidad del Jugador mediante la unión discriminada
    const playerResult = playerIdentitySchema.safeParse({
      documentType: data.documentType,
      documentNumber: data.documentNumber,
    });
    if (!playerResult.success) {
      playerResult.error.issues.forEach((issue) => {
        ctx.addIssue({
          ...issue,
          path: [issue.path[0] === "documentNumber" ? "documentNumber" : "documentType"],
        });
      });
    }

    const edadAnios = calcularEdadAnios(data.birthdate);

    if (edadAnios < 18) {
      if (!data.tutorName || data.tutorName.trim().length < 2) {
        ctx.addIssue({
          code: "custom",
          message:
            "El nombre del padre, madre o tutor legal es obligatorio para menores de edad",
          path: ["tutorName"],
        });
      }

      if (!data.tutorDocumentNumber) {
        ctx.addIssue({
          code: "custom",
          message:
            "El documento del padre, madre o tutor legal es obligatorio para menores de edad",
          path: ["tutorDocumentNumber"],
        });
      } else {
        // Validar Identidad del Tutor
        const tutorResult = tutorIdentitySchema.safeParse({
          tutorDocumentType: data.tutorDocumentType,
          tutorDocumentNumber: data.tutorDocumentNumber,
        });

        if (!tutorResult.success) {
          tutorResult.error.issues.forEach((issue) => {
            ctx.addIssue({
              ...issue,
              path: ["tutorDocumentNumber"],
            });
          });
        }
      }

      if (!data.tutorPhone || data.tutorPhone === "") {
        ctx.addIssue({
          code: "custom",
          message:
            "El teléfono del padre, madre o tutor legal es obligatorio para menores de edad",
          path: ["tutorPhone"],
        });
      }
    }
  });

export const movimientoCajaSchema = z
  .object({
    type: z.enum(["income", "expense"]),
    amount: z
      .number("Ingresa un amount válido")
      .positive("El amount debe ser mayor a 0")
      .max(999999.99, "Monto demasiado grande"),
    concept: z
      .string()
      .min(3, "Describe el concept (mínimo 3 caracteres)")
      .max(200, "Máximo 200 caracteres"),
    paymentChannel: z.enum([
      "YAPE",
      "PLIN",
      "EFECTIVO",
      "TRANSFERENCIA",
      "BCP",
      "BBVA",
      "INTERBANK",
    ]),
    operationCode: z.string().max(50).optional(),
    playerId: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.uuid().optional()
    ),
    transactionDate: z.coerce.date(),
    notes: z.string().max(500).optional(),
  });

/** Valores del formulario (entrada) — compatible con react-hook-form + preprocess. */
/** Validación de foto (solo formularios multipart en cliente). */
export const registroJugadorFotoSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 5 * 1024 * 1024, "La foto no puede superar 5MB")
  .refine(
    (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    "Solo se aceptan imágenes JPG, PNG o WEBP",
  )
  .optional();

/** Server action: sin campo `foto` (evita fallo Zod cuando no viene en FormData). */
export const registroJugadorServerSchema = registroJugadorSchema;

export type RegistroJugadorFormInput = z.input<typeof registroJugadorSchema>;
/** Datos ya validados/normalizados (salida Zod). */
export type RegistroJugadorForm = z.infer<typeof registroJugadorSchema>;
export type MovimientoCajaForm = z.infer<typeof movimientoCajaSchema>;
