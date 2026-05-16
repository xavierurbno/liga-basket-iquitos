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
  jsonb,
  serial,
  pgSchema,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Auth schema para referenciar auth.users
export const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
  email: varchar("email", { length: 255 }),
});

export const leagues = pgTable(
  "leagues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("leagues_slug_idx").on(table.slug),
  })
);

export const categoryEnum = pgEnum("categoria", [
  "SUB_13",
  "SUB_15",
  "SUB_17",
  "MAYORES",
  "VETERANOS",
]);

export const genderEnum = pgEnum("genero", ["MASCULINO", "FEMENINO", "MIXTO"]);

export const playerStatusEnum = pgEnum("estado_jugador", [
  "ACTIVO",
  "SUSPENDIDO",
  "INACTIVO",
  "PENDIENTE_PAGO",
]);

export const transactionTypeEnum = pgEnum("tipo_movimiento", [
  "income",
  "expense",
]);

export const paymentChannelEnum = pgEnum("canal_pago", [
  "YAPE",
  "PLIN",
  "EFECTIVO",
  "TRANSFERENCIA",
  "BCP",
  "BBVA",
  "INTERBANK",
]);

export const documentTypeEnum = pgEnum("tipo_documento", [
  "DNI",
  "CE",
  "PASAPORTE",
]);

export const playerDocumentTypeEnum = pgEnum("tipo_documento_jugador", [
  "FICHA_MEDICA",
  "FOTO_CARNET",
  "AUTORIZACION_PADRES",
  "CONTRATO_CLUB",
  "REGLAMENTO_FIRMADO",
  "OTRO",
]);

export const roleEnum = pgEnum("role", [
  "SUPER_ADMIN",
  "LEAGUE_ADMIN",
  "CLUB_DELEGATE",
]);

export const sponsorCategoryEnum = pgEnum("sponsor_category", [
  "SOCIOS_PATROCINADORES",
  "PATR_TECNICO",
  "PATROCINADORES_OFICIALES",
  "PROVEEDORES",
  "INSTITUCIONALES",
]);

/** Normativas: tabla Postgres `normativas` (campos en español). Bucket público típico: `Nomativa`. */
export const normativaDocumentCategoryEnum = pgEnum("normativa_document_category", [
  "REGLAMENTO",
  "BASES",
  "COMUNICADO",
]);

export const normativas = pgTable(
  "normativas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    titulo: text("titulo").notNull(),
    descripcion: text("descripcion"),
    urlArchivo: text("url_archivo").notNull(),
    categoria: normativaDocumentCategoryEnum("categoria").notNull(),
    esPublico: boolean("es_publico").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    esPublicoIdx: index("normativas_es_publico_idx").on(table.esPublico),
  })
);

export const clubs = pgTable(
  "clubs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leagueId: uuid("league_id").references(() => leagues.id, { onDelete: "cascade" }),
    ownerId: uuid("owner_id").references(() => authUsers.id, { onDelete: "set null" }).unique(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 50 }).notNull(),
    federationCode: varchar("federation_code", { length: 20 }),
    colorPrimary: varchar("color_primary", { length: 7 }).default("#1e3a5f"),
    colorSecondary: varchar("color_secondary", { length: 7 }).default("#fbbf24"),
    logoUrl: text("logo_url"),
    courtAddress: text("court_address"),
    foundationDate: timestamp("foundation_date"),
    district: varchar("district", { length: 50 }).default("Iquitos"),
    province: varchar("province", { length: 50 }).default("Maynas"),
    region: varchar("region", { length: 50 }).default("Loreto"),
    adminEmail: varchar("admin_email", { length: 100 }).notNull(),
    adminPhone: varchar("admin_phone", { length: 15 }),
    presidentName: varchar("president_name", { length: 80 }),
    presidentLastname: varchar("president_lastname", { length: 80 }),
    presidentDocumentType: documentTypeEnum("president_document_type").default("DNI"),
    presidentDocumentNumber: varchar("president_document_number", { length: 20 }),
    presidentBirthdate: timestamp("president_birthdate"),
    presidentContact: varchar("president_contact", { length: 20 }),
    presidentEmail: varchar("president_email", { length: 120 }),
    presidentPhotoUrl: text("president_photo_url"),
    secretaryName: varchar("secretary_name", { length: 80 }),
    secretaryLastname: varchar("secretary_lastname", { length: 80 }),
    secretaryDocumentType: documentTypeEnum("secretary_document_type").default("DNI"),
    secretaryDocumentNumber: varchar("secretary_document_number", { length: 20 }),
    secretaryBirthdate: timestamp("secretary_birthdate"),
    secretaryContact: varchar("secretary_contact", { length: 20 }),
    secretaryEmail: varchar("secretary_email", { length: 120 }),
    secretaryPhotoUrl: text("secretary_photo_url"),
    treasurerName: varchar("treasurer_name", { length: 80 }),
    treasurerLastname: varchar("treasurer_lastname", { length: 80 }),
    treasurerDocumentType: documentTypeEnum("treasurer_document_type").default("DNI"),
    treasurerDocumentNumber: varchar("treasurer_document_number", { length: 20 }),
    treasurerBirthdate: timestamp("treasurer_birthdate"),
    treasurerContact: varchar("treasurer_contact", { length: 20 }),
    treasurerEmail: varchar("treasurer_email", { length: 120 }),
    treasurerPhotoUrl: text("treasurer_photo_url"),
    activePlan: boolean("active_plan").default(true),
    planExpirationDate: timestamp("plan_expiration_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("clubs_slug_idx").on(table.slug),
    emailIdx: index("clubs_email_idx").on(table.adminEmail),
  })
);

export const clubMembers = pgTable(
  "club_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 30 }).notNull().default("ADMIN"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userClubUnique: uniqueIndex("club_members_user_id_club_id_key").on(
      table.userId,
      table.clubId
    ),
    userIdx: index("club_members_user_idx").on(table.userId),
  })
);

export const userAssignments = pgTable(
  "user_assignments",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    leagueId: uuid("league_id").references(() => leagues.id, {
      onDelete: "cascade",
    }),
    clubId: uuid("club_id").references(() => clubs.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("CLUB_DELEGATE"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userLeagueClubUnique: uniqueIndex("user_assignments_unique").on(
      table.userId,
      table.leagueId,
      table.clubId
    ),
  })
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leagueId: uuid("league_id").references(() => leagues.id, { onDelete: "cascade" }),
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    description: text("description"),
    coachName: varchar("coach_name", { length: 120 }),
    coachLastname: varchar("coach_lastname", { length: 120 }),
    coachDocumentType: documentTypeEnum("coach_document_type").default("DNI"),
    coachDocumentNumber: varchar("coach_document_number", { length: 20 }),
    coachBirthdate: timestamp("coach_birthdate"),
    coachContact: varchar("coach_contact", { length: 20 }),
    coachEmail: varchar("coach_email", { length: 120 }),
    coachPhotoUrl: text("coach_photo_url"),
    delegateName: varchar("delegate_name", { length: 120 }),
    delegateLastname: varchar("delegate_lastname", { length: 120 }),
    delegateDocumentType: documentTypeEnum("delegate_document_type").default("DNI"),
    delegateDocumentNumber: varchar("delegate_document_number", { length: 20 }),
    delegateBirthdate: timestamp("delegate_birthdate"),
    delegateContact: varchar("delegate_contact", { length: 20 }),
    delegateEmail: varchar("delegate_email", { length: 120 }),
    delegatePhotoUrl: text("delegate_photo_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    clubIdx: index("categories_club_idx").on(table.clubId),
    clubNameUnique: uniqueIndex("categories_unique").on(
      table.clubId,
      table.name
    ),
  })
);

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leagueId: uuid("league_id").references(() => leagues.id, { onDelete: "cascade" }),
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 80 }).notNull(),
    lastname: varchar("lastname", { length: 80 }).notNull(),
    documentType: documentTypeEnum("document_type").notNull().default("DNI"),
    documentNumber: varchar("document_number", { length: 20 }).notNull(),
    birthdate: timestamp("birthdate").notNull(),
    gender: genderEnum("gender").notNull(),
    category: categoryEnum("category").notNull(),
    phone: varchar("phone", { length: 15 }),
    email: varchar("email", { length: 100 }).unique(),
    address: text("address"),
    position: varchar("position", { length: 30 }),
    jerseyNumber: integer("jersey_number"),
    size: varchar("size", { length: 5 }),
    photoUrl: text("photo_url"),
    status: playerStatusEnum("status").default("PENDIENTE_PAGO"),
    carnetNumber: varchar("carnet_number", { length: 20 }),
    tutorName: varchar("tutor_name", { length: 100 }),
    tutorDocumentType: documentTypeEnum("tutor_document_type").default("DNI"),
    tutorDocumentNumber: varchar("tutor_document_number", { length: 20 }),
    tutorPhone: varchar("tutor_phone", { length: 15 }),
    bloodType: varchar("blood_type", { length: 5 }),
    allergies: text("allergies"),
    emergencyContact: varchar("emergency_contact", { length: 15 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    clubCategoryIdx: index("players_club_category_idx").on(
      table.clubId,
      table.category
    ),
    documentLeagueIdx: uniqueIndex("players_doc_league_idx").on(
      table.documentType,
      table.documentNumber,
      table.leagueId
    ),
    lastnameIdx: index("players_lastname_idx").on(table.lastname),
    ftsIdx: index("players_fts_idx").using(
      "gin",
      sql`to_tsvector('spanish', ${table.name} || ' ' || ${table.lastname})`
    ),
    leagueIdDocumentIdx: index("idx_players_lookup").on(
      table.leagueId,
      table.documentNumber
    ),
  })
);

export const treasury = pgTable(
  "treasury",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leagueId: uuid("league_id").references(() => leagues.id, { onDelete: "cascade" }),
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    playerId: uuid("player_id").references(() => players.id, {
      onDelete: "set null",
    }),
    type: transactionTypeEnum("type").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    concept: varchar("concept", { length: 200 }).notNull(),
    paymentChannel: paymentChannelEnum("payment_channel").notNull().default("EFECTIVO"),
    operationCode: varchar("operation_code", { length: 50 }),
    proofUrl: text("proof_url"),
    registeredBy: uuid("registered_by").references(() => authUsers.id, { onDelete: "set null" }),
    transactionDate: timestamp("transaction_date").defaultNow().notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    clubDateIdx: index("treasury_club_date_idx").on(
      table.clubId,
      table.transactionDate
    ),
    clubTypeIdx: index("treasury_club_type_idx").on(table.clubId, table.type),
    clubIdIdx: index("idx_treasury_club").on(table.clubId),
  })
);

export const leagueSettings = pgTable(
  "league_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leagueId: uuid("league_id")
      .references(() => leagues.id, { onDelete: "cascade" })
      .unique(),
    seasonName: text("season_name"),
    transferPeriodStart: timestamp("transfer_period_start"),
    transferPeriodEnd: timestamp("transfer_period_end"),
    bannerText: text("banner_text"),
    loginLogoUrl: text("login_logo_url"),
    pointsWin: integer("points_win").default(2),
    pointsLoss: integer("points_loss").default(1),
    pointsWalkover: integer("points_walkover").default(0),
    maxPlayersPerClub: integer("max_players_per_club").default(15),
    isManualOverride: boolean("is_manual_override").default(false),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    leagueIdIdx: index("league_settings_league_id_idx").on(table.leagueId),
  })
);

export const leagueSettingsRelations = relations(leagueSettings, ({ one }) => ({
  league: one(leagues, {
    fields: [leagueSettings.leagueId],
    references: [leagues.id],
  }),
}));

export const playerDocuments = pgTable(
  "player_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    type: playerDocumentTypeEnum("type").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    storageKey: text("storage_key").notNull(),
    publicUrl: text("public_url"),
    sizeBytes: integer("size_bytes"),
    mimeType: varchar("mime_type", { length: 100 }),
    verified: boolean("verified").default(false),
    verifiedBy: uuid("verified_by").references(() => authUsers.id, { onDelete: "set null" }),
    verificationDate: timestamp("verification_date"),
    expirationDate: timestamp("expiration_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    playerIdx: index("docs_player_idx").on(table.playerId),
    clubIdx: index("docs_club_idx").on(table.clubId),
  })
);

export const documentHistory = pgTable(
  "document_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: varchar("type", { length: 50 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    shortIdentifier: varchar("short_identifier", { length: 20 }).notNull(),
    correlative: serial("correlative").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    entityIdx: index("docs_hist_entity_idx").on(table.entityId),
    typeIdx: index("docs_hist_type_idx").on(table.type),
  })
);

export const ownershipHistory = pgTable(
  "ownership_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clubId: uuid("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
    previousOwnerId: uuid("previous_owner_id").references(() => authUsers.id),
    newOwnerId: uuid("new_owner_id").notNull().references(() => authUsers.id),
    transferDate: timestamp("transfer_date").defaultNow().notNull(),
    registeredBy: uuid("registered_by").notNull(),
  },
  (table) => ({
    clubIdx: index("ownership_club_idx").on(table.clubId),
  })
);

export const clubsRelations = relations(clubs, ({ one, many }) => ({
  league: one(leagues, {
    fields: [clubs.leagueId],
    references: [leagues.id],
  }),
  categories: many(categories),
  players: many(players),
  treasury: many(treasury),
  playerDocuments: many(playerDocuments),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  league: one(leagues, {
    fields: [categories.leagueId],
    references: [leagues.id],
  }),
  club: one(clubs, {
    fields: [categories.clubId],
    references: [clubs.id],
  }),
  players: many(players),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  league: one(leagues, {
    fields: [players.leagueId],
    references: [leagues.id],
  }),
  club: one(clubs, {
    fields: [players.clubId],
    references: [clubs.id],
  }),
  category: one(categories, {
    fields: [players.categoryId],
    references: [categories.id],
  }),
  documents: many(playerDocuments),
  payments: many(treasury),
}));

export const treasuryRelations = relations(
  treasury,
  ({ one }) => ({
    league: one(leagues, {
      fields: [treasury.leagueId],
      references: [leagues.id],
    }),
    club: one(clubs, {
      fields: [treasury.clubId],
      references: [clubs.id],
    }),
    player: one(players, {
      fields: [treasury.playerId],
      references: [players.id],
    }),
  })
);

export const galleryPhotos = pgTable(
  "gallery_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leagueId: uuid("league_id").references(() => leagues.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    caption: varchar("caption", { length: 255 }),
    clubId: uuid("club_id").references(() => clubs.id, { onDelete: "set null" }),
    registeredBy: uuid("registered_by").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    clubIdx: index("gallery_club_idx").on(table.clubId),
  })
);

export const sponsors = pgTable(
  "sponsors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: sponsorCategoryEnum("category").notNull(),
    logoUrl: text("logo_url").notNull(),
    websiteUrl: text("website_url"),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    leagueIdIdx: index("sponsors_league_id_idx").on(table.leagueId),
  })
);

export const galleryPhotosRelations = relations(galleryPhotos, ({ one }) => ({
  league: one(leagues, {
    fields: [galleryPhotos.leagueId],
    references: [leagues.id],
  }),
  club: one(clubs, {
    fields: [galleryPhotos.clubId],
    references: [clubs.id],
  }),
}));

export const userAssignmentsRelations = relations(userAssignments, ({ one }) => ({
  user: one(authUsers, {
    fields: [userAssignments.userId],
    references: [authUsers.id],
  }),
  league: one(leagues, {
    fields: [userAssignments.leagueId],
    references: [leagues.id],
  }),
  club: one(clubs, {
    fields: [userAssignments.clubId],
    references: [clubs.id],
  }),
}));

export const authUsersRelations = relations(authUsers, ({ many }) => ({
  assignments: many(userAssignments),
}));

export const leaguesRelations = relations(leagues, ({ many, one }) => ({
  assignments: many(userAssignments),
  clubs: many(clubs),
  sponsors: many(sponsors),
  settings: one(leagueSettings),
}));

export const sponsorsRelations = relations(sponsors, ({ one }) => ({
  league: one(leagues, {
    fields: [sponsors.leagueId],
    references: [leagues.id],
  }),
}));

export type League = typeof leagues.$inferSelect;
export type NewLeague = typeof leagues.$inferInsert;
export type Club = typeof clubs.$inferSelect;
export type NewClub = typeof clubs.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Treasury = typeof treasury.$inferSelect;
export type TreasuryRecentMovement = Pick<
  Treasury,
  "id" | "type" | "amount" | "concept" | "paymentChannel" | "transactionDate"
>;
export type NewTreasury = typeof treasury.$inferInsert;
export type PlayerDocument = typeof playerDocuments.$inferSelect;
export type NewPlayerDocument = typeof playerDocuments.$inferInsert;
export type DocumentHistory = typeof documentHistory.$inferSelect;
export type NewDocumentHistory = typeof documentHistory.$inferInsert;
export type LeagueSettings = typeof leagueSettings.$inferSelect;
export type NewLeagueSettings = typeof leagueSettings.$inferInsert;
export type OwnershipHistory = typeof ownershipHistory.$inferSelect;
export type NewOwnershipHistory = typeof ownershipHistory.$inferInsert;
export type GalleryPhoto = typeof galleryPhotos.$inferSelect;
export type NewGalleryPhoto = typeof galleryPhotos.$inferInsert;
export type UserAssignment = typeof userAssignments.$inferSelect;
export type NewUserAssignment = typeof userAssignments.$inferInsert;
export type Sponsor = typeof sponsors.$inferSelect;
export type NewSponsor = typeof sponsors.$inferInsert;

// Enum types
export type IdentityDocumentType = typeof documentTypeEnum.enumValues[number];
export type PlayerStatus = typeof playerStatusEnum.enumValues[number];
export type TransactionType = typeof transactionTypeEnum.enumValues[number];
export type PaymentChannel = typeof paymentChannelEnum.enumValues[number];
export type UserRole = typeof roleEnum.enumValues[number];
export type SponsorCategory = typeof sponsorCategoryEnum.enumValues[number];
export type PlayerCategory = typeof categoryEnum.enumValues[number];
export type NormativaCategoria = typeof normativaDocumentCategoryEnum.enumValues[number];
export type Normativa = typeof normativas.$inferSelect;
export type NewNormativa = typeof normativas.$inferInsert;
