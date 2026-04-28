/**
 * ============================================================
 * ESQUEMA DE BASE DE DATOS - LIGA DE BASKET IQUITOS
 * ============================================================
 * Usamos Drizzle ORM porque es "type-safe by design": TypeScript
 * conoce la estructura exacta de cada tabla en tiempo de compilación,
 * eliminando errores de columna en producción.
 *
 * Multi-tenancy: Cada tabla con datos de club tiene `club_id`,
 * columna que Supabase RLS usa para aislar datos entre organizaciones.
 * ============================================================
 */

import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  numeric,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────
// ENUMS: Valores cerrados para evitar datos corruptos en BD
// ─────────────────────────────────────────────────────────────

/**
 * Categorías FIBA estándar peruanas.
 * Usamos enum de BD (no solo TypeScript) para que PostgreSQL
 * rechace cualquier valor inválido a nivel de motor.
 */
export const categoriaEnum = pgEnum("categoria", [
  "SUB_13",
  "SUB_15",
  "SUB_17",
  "MAYORES",
  "VETERANOS",
]);

/**
 * Géneros para inscripción federativa.
 */
export const generoEnum = pgEnum("genero", ["MASCULINO", "FEMENINO", "MIXTO"]);

/**
 * Estado de inscripción del jugador en la liga.
 */
export const estadoJugadorEnum = pgEnum("estado_jugador", [
  "ACTIVO",
  "SUSPENDIDO",
  "INACTIVO",
  "PENDIENTE_PAGO",
]);

/**
 * Tipo de movimiento de caja (Ingreso vs Egreso).
 * Este enum alimenta los KPIs financieros del dashboard.
 */
export const tipoMovimientoEnum = pgEnum("tipo_movimiento", [
  "INGRESO",
  "EGRESO",
]);

/**
 * Canal de pago digital: crítico para la realidad de Iquitos
 * donde Yape/Plin son los métodos predominantes.
 */
export const canalPagoEnum = pgEnum("canal_pago", [
  "YAPE",
  "PLIN",
  "EFECTIVO",
  "TRANSFERENCIA",
  "BCP",
  "BBVA",
  "INTERBANK",
]);

/**
 * Tipos de documento gestionable en el sistema.
 */
export const tipoDocumentoEnum = pgEnum("tipo_documento", [
  "DNI",
  "FICHA_MEDICA",
  "FOTO_CARNET",
  "AUTORIZACION_PADRES",
  "CONTRATO_CLUB",
  "REGLAMENTO_FIRMADO",
  "OTRO",
]);

// ─────────────────────────────────────────────────────────────
// TABLA: clubs
// Raíz del árbol multi-tenant. Cada club es un "tenant".
// ─────────────────────────────────────────────────────────────

export const clubs = pgTable(
  "clubs",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Nombre oficial para documentos y carnets
    nombre: varchar("nombre", { length: 100 }).notNull(),

    // Slug para URLs limpias: /dashboard/aguila-fc
    slug: varchar("slug", { length: 50 }).notNull(),

    // RUC o código FEDERACIÓN PERUANA DE BASKETBALL
    codigoFederacion: varchar("codigo_federacion", { length: 20 }),

    // Colores corporativos para personalización del portal
    colorPrimario: varchar("color_primario", { length: 7 }).default("#1e3a5f"),
    colorSecundario: varchar("color_secundario", { length: 7 }).default(
      "#fbbf24"
    ),

    // Referencia al logo en Supabase Storage (bucket: club-assets)
    logoUrl: text("logo_url"),

    // Dirección del coliseo/cancha principal
    direccionCancha: text("direccion_cancha"),
    distrito: varchar("distrito", { length: 50 }).default("Iquitos"),
    provincia: varchar("provincia", { length: 50 }).default("Maynas"),
    region: varchar("region", { length: 50 }).default("Loreto"),

    // Contacto del administrador del club
    adminEmail: varchar("admin_email", { length: 100 }).notNull(),
    adminTelefono: varchar("admin_telefono", { length: 15 }),

    // Control de suscripción SaaS
    planActivo: boolean("plan_activo").default(true),
    fechaVencimientoPlan: timestamp("fecha_vencimiento_plan"),

    // Auditoría: cuándo se creó y modificó el registro
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Índice único para que dos clubs no compartan slug en URLs
    slugIdx: uniqueIndex("clubs_slug_idx").on(table.slug),
    emailIdx: index("clubs_email_idx").on(table.adminEmail),
  })
);

// ─────────────────────────────────────────────────────────────
// TABLA: jugadores
// Registro federativo completo por jugador.
// ─────────────────────────────────────────────────────────────

export const jugadores = pgTable(
  "jugadores",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // FK al club → base del aislamiento multi-tenant
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),

    // Datos personales federativos
    nombres: varchar("nombres", { length: 80 }).notNull(),
    apellidos: varchar("apellidos", { length: 80 }).notNull(),
    dni: varchar("dni", { length: 8 }).notNull(), // DNI peruano = 8 dígitos exactos
    fechaNacimiento: timestamp("fecha_nacimiento").notNull(),

    genero: generoEnum("genero").notNull(),

    /**
     * Categoría AUTO-CALCULADA en backend según fecha de nacimiento.
     * Almacenamos el valor calculado para consultas eficientes,
     * pero la lógica real está en /lib/utils/categoria.ts
     */
    categoria: categoriaEnum("categoria").notNull(),

    // Contacto jugador o tutor (si es menor)
    telefono: varchar("telefono", { length: 15 }),
    email: varchar("email", { length: 100 }),
    direccion: text("direccion"),

    // Posición preferida en cancha
    posicion: varchar("posicion", { length: 30 }),
    numeroCamiseta: integer("numero_camiseta"),
    talla: varchar("talla", { length: 5 }), // XS/S/M/L/XL/XXL

    // URL de foto en Supabase Storage (bucket: jugador-fotos)
    fotoUrl: text("foto_url"),

    // Estado en la competición
    estado: estadoJugadorEnum("estado").default("PENDIENTE_PAGO"),

    // Número de ficha asignado por la liga (generado automáticamente)
    numeroFicha: varchar("numero_ficha", { length: 20 }),

    // Datos para menores de edad
    nombreTutor: varchar("nombre_tutor", { length: 100 }),
    dniTutor: varchar("dni_tutor", { length: 8 }),
    telefonoTutor: varchar("telefono_tutor", { length: 15 }),

    // Información médica básica
    grupoSanguineo: varchar("grupo_sanguineo", { length: 5 }),
    alergias: text("alergias"),
    contactoEmergencia: varchar("contacto_emergencia", { length: 15 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Índice compuesto: buscar jugadores de un club por categoría (filtro más común)
    clubCategoriaIdx: index("jugadores_club_categoria_idx").on(
      table.clubId,
      table.categoria
    ),

    // DNI único POR CLUB (un jugador no puede inscribirse 2 veces en el mismo club)
    dniClubIdx: uniqueIndex("jugadores_dni_club_idx").on(table.dni, table.clubId),

    // Índice de búsqueda rápida por apellido
    apellidosIdx: index("jugadores_apellidos_idx").on(table.apellidos),
  })
);

// ─────────────────────────────────────────────────────────────
// TABLA: movimientos_caja
// Libro de ingresos/egresos del club.
// ─────────────────────────────────────────────────────────────

export const movimientosCaja = pgTable(
  "movimientos_caja",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),

    // Referencia al jugador si el movimiento es una inscripción/cuota
    jugadorId: uuid("jugador_id").references(() => jugadores.id, {
      onDelete: "set null",
    }),

    tipo: tipoMovimientoEnum("tipo").notNull(),

    /**
     * numeric(12,2) = hasta 9.999.999.999,99 soles.
     * Usamos numeric (no float) para EVITAR errores de redondeo
     * en cálculos financieros. Un float puede dar 9.999999... en vez de 10.
     */
    monto: numeric("monto", { precision: 12, scale: 2 }).notNull(),

    concepto: varchar("concepto", { length: 200 }).notNull(),

    // Canal de pago digital — clave para reportes de cobranza
    canalPago: canalPagoEnum("canal_pago").notNull().default("EFECTIVO"),

    // Número de operación Yape/Plin o referencia bancaria
    codigoOperacion: varchar("codigo_operacion", { length: 50 }),

    // URL del comprobante en Supabase Storage (bucket: comprobantes)
    comprobanteUrl: text("comprobante_url"),

    // Quién registró el movimiento (auth.uid() de Supabase)
    registradoPor: uuid("registrado_por"),

    // Fecha efectiva del movimiento (puede diferir de created_at si se registra después)
    fechaMovimiento: timestamp("fecha_movimiento").defaultNow().notNull(),

    observaciones: text("observaciones"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Índice para reportes financieros por rango de fechas
    clubFechaIdx: index("caja_club_fecha_idx").on(
      table.clubId,
      table.fechaMovimiento
    ),

    // Índice para dashboard: sumar ingresos/egresos por tipo
    clubTipoIdx: index("caja_club_tipo_idx").on(table.clubId, table.tipo),
  })
);

// ─────────────────────────────────────────────────────────────
// TABLA: documentos_jugador
// Gestión documental: DNI, fichas médicas, autorizaciones.
// ─────────────────────────────────────────────────────────────

export const documentosJugador = pgTable(
  "documentos_jugador",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // FK al jugador
    jugadorId: uuid("jugador_id")
      .notNull()
      .references(() => jugadores.id, { onDelete: "cascade" }),

    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),

    tipo: tipoDocumentoEnum("tipo").notNull(),

    // Nombre original del archivo (para mostrar al usuario)
    nombreArchivo: varchar("nombre_archivo", { length: 255 }).notNull(),

    // Ruta en Supabase Storage
    storageKey: text("storage_key").notNull(),

    // URL pública o firmada según política del bucket
    urlPublica: text("url_publica"),

    // Tamaño en bytes para control de cuota del plan
    tamanoBytes: integer("tamano_bytes"),
    mimeType: varchar("mime_type", { length: 100 }),

    // Estado de verificación del documento
    verificado: boolean("verificado").default(false),
    verificadoPor: uuid("verificado_por"),
    fechaVerificacion: timestamp("fecha_verificacion"),

    // Fecha de vencimiento (ej: ficha médica vence cada año)
    fechaVencimiento: timestamp("fecha_vencimiento"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    jugadorIdx: index("docs_jugador_idx").on(table.jugadorId),
    clubIdx: index("docs_club_idx").on(table.clubId),
  })
);

// ─────────────────────────────────────────────────────────────
// RELACIONES: Le decimos a Drizzle cómo relacionar las tablas
// para poder hacer queries con .with() de forma type-safe
// ─────────────────────────────────────────────────────────────

export const clubsRelations = relations(clubs, ({ many }) => ({
  jugadores: many(jugadores),
  movimientosCaja: many(movimientosCaja),
  documentos: many(documentosJugador),
}));

export const jugadoresRelations = relations(jugadores, ({ one, many }) => ({
  club: one(clubs, {
    fields: [jugadores.clubId],
    references: [clubs.id],
  }),
  documentos: many(documentosJugador),
  pagos: many(movimientosCaja),
}));

export const movimientosCajaRelations = relations(
  movimientosCaja,
  ({ one }) => ({
    club: one(clubs, {
      fields: [movimientosCaja.clubId],
      references: [clubs.id],
    }),
    jugador: one(jugadores, {
      fields: [movimientosCaja.jugadorId],
      references: [jugadores.id],
    }),
  })
);

// ─────────────────────────────────────────────────────────────
// TYPE EXPORTS: Inferimos tipos TS desde el schema (DRY principle)
// Así no repetimos la definición de tipos manualmente.
// ─────────────────────────────────────────────────────────────

export type Club = typeof clubs.$inferSelect;
export type NuevoClub = typeof clubs.$inferInsert;
export type Jugador = typeof jugadores.$inferSelect;
export type NuevoJugador = typeof jugadores.$inferInsert;
export type MovimientoCaja = typeof movimientosCaja.$inferSelect;
export type NuevoMovimiento = typeof movimientosCaja.$inferInsert;
export type DocumentoJugador = typeof documentosJugador.$inferSelect;
export type NuevoDocumento = typeof documentosJugador.$inferInsert;
