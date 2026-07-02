import { eq, or } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { db } from "@/lib/db/client";
import {
  documentHistory,
  playerDocuments,
  players,
  type Player,
} from "@/lib/db/schema";
import type * as schema from "@/lib/db/schema";
import { getSupabaseAdmin } from "@/lib/supabase/admin-server";
import {
  extractPlayerPhotoStoragePath,
  playersBucketName,
} from "@/lib/storage/player-photo-storage";
import { anonymizedDocumentHistorySnapshot } from "./document-history-snapshot";

type Db = PostgresJsDatabase<typeof schema>;

export type PlayerArcoExport = {
  exportedAt: string;
  legalBasis: "Ley N° 29733 — derecho de acceso (ARCO)";
  playerId: string;
  leagueId: string | null;
  clubId: string;
  personalData: Record<string, unknown>;
  documentHistory: Array<{
    id: string;
    type: string;
    correlative: number;
    createdAt: string;
    snapshot: unknown;
  }>;
  uploadedDocuments: Array<{
    id: string;
    type: string;
    fileName: string;
    storageKey: string;
    createdAt: string;
  }>;
};

const ANON_NAME = "ANONIMIZADO";

function buildAnonymizedDocumentNumber(playerId: string): string {
  const compact = playerId.replace(/-/g, "").slice(0, 12).toUpperCase();
  return `***ARCO-${compact}`;
}

function playerToExportRecord(player: Player): Record<string, unknown> {
  return {
    name: player.name,
    lastname: player.lastname,
    documentType: player.documentType,
    documentNumber: player.documentNumber,
    birthdate: player.birthdate?.toISOString() ?? null,
    gender: player.gender,
    category: player.category,
    phone: player.phone,
    email: player.email,
    address: player.address,
    position: player.position,
    jerseyNumber: player.jerseyNumber,
    size: player.size,
    photoUrl: player.photoUrl,
    status: player.status,
    carnetNumber: player.carnetNumber,
    credentialVersion: player.credentialVersion,
    credentialIssuedAt: player.credentialIssuedAt?.toISOString() ?? null,
    tutorName: player.tutorName,
    tutorDocumentType: player.tutorDocumentType,
    tutorDocumentNumber: player.tutorDocumentNumber,
    tutorPhone: player.tutorPhone,
    bloodType: player.bloodType,
    allergies: player.allergies,
    emergencyContact: player.emergencyContact,
    createdAt: player.createdAt?.toISOString() ?? null,
    updatedAt: player.updatedAt?.toISOString() ?? null,
  };
}

function toIso(value: Date | string | null | undefined): string {
  if (value == null) return "";
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export async function buildPlayerArcoExport(
  playerId: string,
  database: Db = db,
): Promise<PlayerArcoExport | null> {
  let player: Player | undefined;
  try {
    [player] = await database
      .select()
      .from(players)
      .where(eq(players.id, playerId))
      .limit(1);
  } catch (err) {
    console.error("[buildPlayerArcoExport] players", err);
    return null;
  }

  if (!player) return null;

  let historyRows: {
    id: string;
    type: string;
    correlative: number;
    createdAt: Date;
    snapshot: unknown;
  }[] = [];
  try {
    historyRows = await database
      .select({
        id: documentHistory.id,
        type: documentHistory.type,
        correlative: documentHistory.correlative,
        createdAt: documentHistory.createdAt,
        snapshot: documentHistory.snapshot,
      })
      .from(documentHistory)
      .where(eq(documentHistory.entityId, playerId));
  } catch (err) {
    console.error("[buildPlayerArcoExport] document_history", err);
  }

  let docRows: {
    id: string;
    type: string;
    fileName: string;
    storageKey: string;
    createdAt: Date;
  }[] = [];
  try {
    docRows = await database
      .select({
        id: playerDocuments.id,
        type: playerDocuments.type,
        fileName: playerDocuments.fileName,
        storageKey: playerDocuments.storageKey,
        createdAt: playerDocuments.createdAt,
      })
      .from(playerDocuments)
      .where(eq(playerDocuments.playerId, playerId));
  } catch (err) {
    console.error("[buildPlayerArcoExport] player_documents", err);
  }

  return {
    exportedAt: new Date().toISOString(),
    legalBasis: "Ley N° 29733 — derecho de acceso (ARCO)",
    playerId: player.id,
    leagueId: player.leagueId,
    clubId: player.clubId,
    personalData: playerToExportRecord(player),
    documentHistory: historyRows.map((row) => ({
      id: row.id,
      type: row.type,
      correlative: Number(row.correlative),
      createdAt: toIso(row.createdAt),
      snapshot: row.snapshot,
    })),
    uploadedDocuments: docRows.map((row) => ({
      id: row.id,
      type: row.type,
      fileName: row.fileName,
      storageKey: row.storageKey,
      createdAt: toIso(row.createdAt),
    })),
  };
}

async function removeStorageObjects(paths: string[]): Promise<void> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return;

  try {
    const admin = getSupabaseAdmin();
    const bucket = playersBucketName();
    const { error } = await admin.storage.from(bucket).remove(unique);
    if (error) {
      console.error("[player-arco] storage remove", error.message);
    }
  } catch (err) {
    console.error("[player-arco] storage remove", err);
  }
}

export type AnonymizePlayerResult = {
  playerId: string;
  documentHistoryRowsUpdated: number;
  documentsRemoved: number;
};

/**
 * Cancelación ARCO: anonimiza fila de jugador, purga PII en historial y elimina archivos en Storage.
 */
export async function anonymizePlayerForArco(
  playerId: string,
  database: Db = db,
): Promise<AnonymizePlayerResult | null> {
  const [player] = await database
    .select()
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);

  if (!player) return null;

  const docRows = await database
    .select({
      id: playerDocuments.id,
      storageKey: playerDocuments.storageKey,
    })
    .from(playerDocuments)
    .where(eq(playerDocuments.playerId, playerId));

  const historyRows = await database
    .select({
      id: documentHistory.id,
      snapshot: documentHistory.snapshot,
    })
    .from(documentHistory)
    .where(
      or(
        eq(documentHistory.entityId, playerId),
        eq(documentHistory.shortIdentifier, player.documentNumber.slice(0, 20)),
      ),
    );

  const storagePaths: string[] = [];
  const photoPath = extractPlayerPhotoStoragePath(player.photoUrl);
  if (photoPath) storagePaths.push(photoPath);
  for (const doc of docRows) {
    const path = extractPlayerPhotoStoragePath(doc.storageKey) ?? doc.storageKey;
    if (path) storagePaths.push(path);
  }

  await removeStorageObjects(storagePaths);

  const anonymizedDoc = buildAnonymizedDocumentNumber(playerId);
  const genericBirthdate = new Date("1900-01-01T00:00:00.000Z");

  await database
    .update(players)
    .set({
      name: ANON_NAME,
      lastname: playerId.slice(0, 8).toUpperCase(),
      documentNumber: anonymizedDoc,
      birthdate: genericBirthdate,
      phone: null,
      email: null,
      address: null,
      photoUrl: null,
      position: null,
      jerseyNumber: null,
      size: null,
      tutorName: null,
      tutorDocumentNumber: null,
      tutorPhone: null,
      bloodType: null,
      allergies: null,
      emergencyContact: null,
      status: "INACTIVO",
      carnetNumber: null,
      credentialVersion: 0,
      credentialIssuedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(players.id, playerId));

  if (docRows.length > 0) {
    await database.delete(playerDocuments).where(eq(playerDocuments.playerId, playerId));
  }

  let historyUpdated = 0;
  for (const row of historyRows) {
    const snapshot =
      row.snapshot && typeof row.snapshot === "object" && !Array.isArray(row.snapshot)
        ? anonymizedDocumentHistorySnapshot(row.snapshot as Record<string, unknown>)
        : anonymizedDocumentHistorySnapshot({});
    await database
      .update(documentHistory)
      .set({ snapshot })
      .where(eq(documentHistory.id, row.id));
    historyUpdated += 1;
  }

  return {
    playerId,
    documentHistoryRowsUpdated: historyUpdated,
    documentsRemoved: docRows.length,
  };
}
