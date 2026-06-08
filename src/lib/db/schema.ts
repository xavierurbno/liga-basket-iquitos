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
  rawUserMetaData: jsonb("raw_user_meta_data"),
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
    leagueId: uuid("league_id").references(() => leagues.id, { onDelete: "cascade" }),
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
    leagueIdIdx: index("normativas_league_id_idx").on(table.leagueId),
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
    /** Versión de emisión del carnet digital (0 = nunca emitido). */
    credentialVersion: integer("credential_version").notNull().default(0),
    /** Fecha/hora de la última emisión registrada en sistema. */
    credentialIssuedAt: timestamp("credential_issued_at"),
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
    portalPrimaryColor: varchar("portal_primary_color", { length: 7 }).default("#1e3a5f"),
    portalAccentColor: varchar("portal_accent_color", { length: 7 }).default("#005CEE"),
    pointsWin: integer("points_win").default(2),
    pointsLoss: integer("points_loss").default(1),
    pointsWalkover: integer("points_walkover").default(0),
    maxPlayersPerClub: integer("max_players_per_club").default(15),
    isManualOverride: boolean("is_manual_override").default(false),
    /** Override opcional del logo de federación en carnet/PDF (null = global `public/logos/federacion.png`). */
    carnetFederationLogoUrl: text("carnet_federation_logo_url"),
    /** Logo B/N de la liga solo en reverso clásico (null = `public/logos/liga-mono.png` si existe). */
    carnetLeagueMonoLogoUrl: text("carnet_league_mono_logo_url"),
    presidentSignatureUrl: text("president_signature_url"),
    secretarySignatureUrl: text("secretary_signature_url"),
    presidentDisplayName: text("president_display_name"),
    secretaryDisplayName: text("secretary_display_name"),
    /** none | president | both — firmas en reverso del carnet CR80. */
    carnetSignatureMode: varchar("carnet_signature_mode", { length: 16 })
      .default("both")
      .notNull(),
    /** Ej: "03/2026 - 03/2027" */
    carnetValidityLabel: text("carnet_validity_label"),
    /** Plantilla legal; placeholder `{ligaNombre}`. */
    carnetAuthorizationTemplate: text("carnet_authorization_template"),
    /** lddbi_template | esquinas_color | esquinas_clasica_reverso | onda_color | onda_clasica_reverso */
    carnetThemePreset: varchar("carnet_theme_preset", { length: 32 })
      .default("lddbi_template")
      .notNull(),
    carnetShowFederation: boolean("carnet_show_federation").default(true).notNull(),
    carnetFederationDisplayName: text("carnet_federation_display_name"),
    carnetSportLabel: varchar("carnet_sport_label", { length: 40 }),
    carnetSportGraphicUrl: text("carnet_sport_graphic_url"),
    /** Prefijo serial documentos (carta/constancia/solvencia); null = derivado del slug. */
    documentSerialPrefix: varchar("document_serial_prefix", { length: 12 }),
    socialFacebookUrl: text("social_facebook_url"),
    socialInstagramUrl: text("social_instagram_url"),
    socialYoutubeUrl: text("social_youtube_url"),
    socialTiktokUrl: text("social_tiktok_url"),
    socialWhatsappUrl: text("social_whatsapp_url"),
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
    leagueId: uuid("league_id").references(() => leagues.id, { onDelete: "set null" }),
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
    leagueIdIdx: index("document_history_league_id_idx").on(table.leagueId),
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

/** Fase 2: auditoría de acciones de negocio (escritura vía servidor, lectura con RLS). */
export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    actorId: uuid("actor_id").references(() => authUsers.id, { onDelete: "set null" }),
    actorRole: varchar("actor_role", { length: 30 }),
    action: varchar("action", { length: 80 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id"),
    leagueId: uuid("league_id").references(() => leagues.id, { onDelete: "set null" }),
    clubId: uuid("club_id").references(() => clubs.id, { onDelete: "set null" }),
    clientIp: varchar("client_ip", { length: 45 }),
    payload: jsonb("payload"),
  },
  (table) => ({
    leagueCreatedIdx: index("audit_events_league_created_idx").on(
      table.leagueId,
      table.createdAt,
    ),
    entityIdx: index("audit_events_entity_idx").on(table.entityType, table.entityId),
    actorCreatedIdx: index("audit_events_actor_created_idx").on(
      table.actorId,
      table.createdAt,
    ),
    actionCreatedIdx: index("audit_events_action_created_idx").on(
      table.action,
      table.createdAt,
    ),
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
    leagueIdx: index("gallery_photos_league_id_idx").on(table.leagueId),
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

// ─── Torneos (Fase A: linear / home_and_away) ───────────────────────────────

export const tournamentFormatEnum = pgEnum("tournament_format", [
  "linear",
  "home_and_away",
  "groups",
  "groups_playoffs",
]);

export const tournamentStatusEnum = pgEnum("tournament_status", [
  "draft",
  "active",
  "finished",
  "cancelled",
]);

export const tournamentMatchStatusEnum = pgEnum("tournament_match_status", [
  "scheduled",
  "finished",
  "postponed",
  "wo_home",
  "wo_away",
  "cancelled",
]);

export const tournamentMatchPhaseEnum = pgEnum("tournament_match_phase", [
  "group",
  "playoff",
]);

export interface TournamentSettings {
  pointsWin?: number;
  pointsLoss?: number;
  pointsWalkover?: number;
  woScore?: number;
  numberOfGroups?: number;
  shuffleGroups?: boolean;
  teamsPerGroupToAdvance?: number;
  thirdPlaceMatch?: boolean;
  playoffsGenerated?: boolean;
  useQuarters?: boolean;
  rulesNote?: string;
}

export const tournaments = pgTable(
  "tournaments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 80 }).notNull(),
    description: text("description"),
    format: tournamentFormatEnum("format").notNull(),
    status: tournamentStatusEnum("status").notNull().default("draft"),
    settings: jsonb("settings").$type<TournamentSettings>(),
    isPublicFixture: boolean("is_public_fixture").notNull().default(false),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    createdBy: uuid("created_by").references(() => authUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    leagueSlugIdx: uniqueIndex("tournaments_league_slug_idx").on(table.leagueId, table.slug),
    leagueIdIdx: index("tournaments_league_id_idx").on(table.leagueId),
    statusIdx: index("tournaments_status_idx").on(table.status),
  })
);

export const tournamentGroups = pgTable(
  "tournament_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tournamentIdIdx: index("tournament_groups_tournament_id_idx").on(table.tournamentId),
  })
);

export const tournamentParticipants = pgTable(
  "tournament_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => tournamentGroups.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    seedPosition: integer("seed_position"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    groupCategoryUnique: uniqueIndex("tournament_participants_group_category_idx").on(
      table.groupId,
      table.categoryId
    ),
    tournamentCategoryUnique: uniqueIndex("tournament_participants_tournament_category_idx").on(
      table.tournamentId,
      table.categoryId
    ),
    groupIdIdx: index("tournament_participants_group_id_idx").on(table.groupId),
    categoryIdIdx: index("tournament_participants_category_id_idx").on(table.categoryId),
  })
);

export const tournamentMatches = pgTable(
  "tournament_matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => tournamentGroups.id, { onDelete: "cascade" }),
    round: integer("round").notNull(),
    matchNumber: integer("match_number").notNull(),
    phase: tournamentMatchPhaseEnum("phase").notNull().default("group"),
    homeCategoryId: uuid("home_category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    awayCategoryId: uuid("away_category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    status: tournamentMatchStatusEnum("status").notNull().default("scheduled"),
    scheduledAt: timestamp("scheduled_at"),
    venue: varchar("venue", { length: 200 }),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    homeQ1: integer("home_q1"),
    awayQ1: integer("away_q1"),
    homeQ2: integer("home_q2"),
    awayQ2: integer("away_q2"),
    homeQ3: integer("home_q3"),
    awayQ3: integer("away_q3"),
    homeQ4: integer("home_q4"),
    awayQ4: integer("away_q4"),
    homeOt: integer("home_ot"),
    awayOt: integer("away_ot"),
    playoffLabel: varchar("playoff_label", { length: 100 }),
    advancesToMatchId: uuid("advances_to_match_id"),
    advancesAs: varchar("advances_as", { length: 10 }),
    loserAdvancesToMatchId: uuid("loser_advances_to_match_id"),
    loserAdvancesAs: varchar("loser_advances_as", { length: 10 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tournamentIdIdx: index("tournament_matches_tournament_id_idx").on(table.tournamentId),
    groupIdIdx: index("tournament_matches_group_id_idx").on(table.groupId),
    roundIdx: index("tournament_matches_round_idx").on(table.round),
    phaseIdx: index("tournament_matches_phase_idx").on(table.tournamentId, table.phase),
  })
);

export const tournamentStandings = pgTable(
  "tournament_standings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => tournamentGroups.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    played: integer("played").notNull().default(0),
    won: integer("won").notNull().default(0),
    lost: integer("lost").notNull().default(0),
    woWon: integer("wo_won").notNull().default(0),
    woLost: integer("wo_lost").notNull().default(0),
    points: integer("points").notNull().default(0),
    pointsFor: integer("points_for").notNull().default(0),
    pointsAgainst: integer("points_against").notNull().default(0),
    pointDiff: integer("point_diff").notNull().default(0),
    position: integer("position").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    groupCategoryUnique: uniqueIndex("tournament_standings_group_category_idx").on(
      table.groupId,
      table.categoryId
    ),
    tournamentIdIdx: index("tournament_standings_tournament_id_idx").on(table.tournamentId),
  })
);

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  league: one(leagues, {
    fields: [tournaments.leagueId],
    references: [leagues.id],
  }),
  groups: many(tournamentGroups),
  matches: many(tournamentMatches),
  standings: many(tournamentStandings),
}));

export const tournamentGroupsRelations = relations(tournamentGroups, ({ one, many }) => ({
  tournament: one(tournaments, {
    fields: [tournamentGroups.tournamentId],
    references: [tournaments.id],
  }),
  participants: many(tournamentParticipants),
  matches: many(tournamentMatches),
  standings: many(tournamentStandings),
}));

export const tournamentParticipantsRelations = relations(tournamentParticipants, ({ one }) => ({
  group: one(tournamentGroups, {
    fields: [tournamentParticipants.groupId],
    references: [tournamentGroups.id],
  }),
  category: one(categories, {
    fields: [tournamentParticipants.categoryId],
    references: [categories.id],
  }),
}));

export const tournamentMatchesRelations = relations(tournamentMatches, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentMatches.tournamentId],
    references: [tournaments.id],
  }),
  group: one(tournamentGroups, {
    fields: [tournamentMatches.groupId],
    references: [tournamentGroups.id],
  }),
  homeCategory: one(categories, {
    fields: [tournamentMatches.homeCategoryId],
    references: [categories.id],
    relationName: "homeCategory",
  }),
  awayCategory: one(categories, {
    fields: [tournamentMatches.awayCategoryId],
    references: [categories.id],
    relationName: "awayCategory",
  }),
}));

export const tournamentStandingsRelations = relations(tournamentStandings, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentStandings.tournamentId],
    references: [tournaments.id],
  }),
  group: one(tournamentGroups, {
    fields: [tournamentStandings.groupId],
    references: [tournamentGroups.id],
  }),
  category: one(categories, {
    fields: [tournamentStandings.categoryId],
    references: [categories.id],
  }),
}));

export const leaguesRelations = relations(leagues, ({ many, one }) => ({
  assignments: many(userAssignments),
  clubs: many(clubs),
  sponsors: many(sponsors),
  settings: one(leagueSettings),
  tournaments: many(tournaments),
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
export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
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
export type Tournament = typeof tournaments.$inferSelect;
export type NewTournament = typeof tournaments.$inferInsert;
export type TournamentGroup = typeof tournamentGroups.$inferSelect;
export type TournamentParticipant = typeof tournamentParticipants.$inferSelect;
export type TournamentMatch = typeof tournamentMatches.$inferSelect;
export type TournamentStanding = typeof tournamentStandings.$inferSelect;
export type TournamentFormat = (typeof tournamentFormatEnum.enumValues)[number];
export type TournamentStatus = (typeof tournamentStatusEnum.enumValues)[number];
export type TournamentMatchStatus = (typeof tournamentMatchStatusEnum.enumValues)[number];
