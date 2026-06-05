import { db } from "@/lib/db/client";
import { players, Player, NewPlayer, PlayerCategory, PlayerStatus } from "@/lib/db/schema";
import { effectiveBypassClubFilter, type ClubScopeOptions } from "@/lib/auth/data-scope";
import { eq, and, count, asc } from "drizzle-orm";
import { categories, clubs, leagues } from "@/lib/db/schema";
import { ExtractTablesWithRelations } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

type DB = typeof db;
type Transaction = PgTransaction<PostgresJsQueryResultHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>;

export class PlayerRepository {
  async countByCategory(
    clubId: string,
    category: PlayerCategory,
    tx: DB | Transaction = db,
    options?: ClubScopeOptions
  ) {
    const whereClause = effectiveBypassClubFilter(options)
      ? eq(players.category, category)
      : and(eq(players.clubId, clubId), eq(players.category, category));
    const [{ count: total }] = await tx
      .select({ count: count() })
      .from(players)
      .where(whereClause);
    return Number(total);
  }

  async create(data: NewPlayer, tx: DB | Transaction = db) {
    const [row] = await tx
      .insert(players)
      .values(data)
      .returning();
    return row;
  }

  async update(
    id: string,
    clubId: string,
    data: Partial<Player>,
    tx: DB | Transaction = db,
    options?: ClubScopeOptions
  ) {
    const whereClause = effectiveBypassClubFilter(options)
      ? eq(players.id, id)
      : and(eq(players.id, id), eq(players.clubId, clubId));
    return await tx
      .update(players)
      .set({ ...data, updatedAt: new Date() })
      .where(whereClause);
  }

  async updateStatus(
    id: string,
    status: PlayerStatus,
    tx: DB | Transaction = db,
    options?: ClubScopeOptions & { clubId?: string }
  ) {
    if (effectiveBypassClubFilter(options)) {
      return await tx
        .update(players)
        .set({ status, updatedAt: new Date() })
        .where(eq(players.id, id));
    }
    const clubId = options?.clubId;
    if (!clubId) {
      throw new Error("updateStatus: se requiere clubId cuando no hay bypass de super admin.");
    }
    return await tx
      .update(players)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(players.id, id), eq(players.clubId, clubId)));
  }

  async delete(
    id: string,
    clubId: string,
    tx: DB | Transaction = db,
    options?: ClubScopeOptions
  ) {
    const whereClause = effectiveBypassClubFilter(options)
      ? eq(players.id, id)
      : and(eq(players.id, id), eq(players.clubId, clubId));
    return await tx.delete(players).where(whereClause);
  }

  async findById(id: string, tx: DB | Transaction = db) {
    const [row] = await tx
      .select()
      .from(players)
      .where(eq(players.id, id))
      .limit(1);
    return row || null;
  }

  async findRosterByCategory(clubId: string, categoryId: string, tx: DB | Transaction = db) {
    return tx
      .select({
        id: players.id,
        name: players.name,
        lastname: players.lastname,
        documentType: players.documentType,
        documentNumber: players.documentNumber,
        birthdate: players.birthdate,
        phone: players.phone,
        jerseyNumber: players.jerseyNumber,
        photoUrl: players.photoUrl,
        carnetNumber: players.carnetNumber,
        gender: players.gender,
      })
      .from(players)
      .where(and(eq(players.clubId, clubId), eq(players.categoryId, categoryId)))
      .orderBy(asc(players.lastname), asc(players.name));
  }

  async findForFichaByCategory(clubId: string, categoryId: string, tx: DB | Transaction = db) {
    return tx
      .select({
        id: players.id,
        name: players.name,
        lastname: players.lastname,
        documentType: players.documentType,
        documentNumber: players.documentNumber,
        birthdate: players.birthdate,
        photoUrl: players.photoUrl,
        jerseyNumber: players.jerseyNumber,
        gender: players.gender,
      })
      .from(players)
      .where(and(eq(players.clubId, clubId), eq(players.categoryId, categoryId)));
  }

  async findForCarnet(
    playerId: string,
    clubId: string,
    categoryId: string,
    tx: DB | Transaction = db,
  ) {
    const [row] = await tx
      .select({
        id: players.id,
        name: players.name,
        lastname: players.lastname,
        documentType: players.documentType,
        documentNumber: players.documentNumber,
        birthdate: players.birthdate,
        photoUrl: players.photoUrl,
        carnetNumber: players.carnetNumber,
        credentialVersion: players.credentialVersion,
        credentialIssuedAt: players.credentialIssuedAt,
        gender: players.gender,
      })
      .from(players)
      .where(
        and(
          eq(players.id, playerId),
          eq(players.clubId, clubId),
          eq(players.categoryId, categoryId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async emitCredential(
    playerId: string,
    clubId: string,
    categoryId: string,
    tx: DB | Transaction = db,
  ) {
    const player = await this.findForCarnet(playerId, clubId, categoryId, tx);
    if (!player) return null;

    const nextVersion = (player.credentialVersion ?? 0) + 1;
    const issuedAt = new Date();

    const [row] = await tx
      .update(players)
      .set({
        credentialVersion: nextVersion,
        credentialIssuedAt: issuedAt,
        updatedAt: issuedAt,
      })
      .where(
        and(
          eq(players.id, playerId),
          eq(players.clubId, clubId),
          eq(players.categoryId, categoryId),
        ),
      )
      .returning({
        credentialVersion: players.credentialVersion,
        credentialIssuedAt: players.credentialIssuedAt,
      });

    return row ?? null;
  }

  async findValidationRosterByCategoryId(categoryId: string, tx: DB | Transaction = db) {
    return tx
      .select({
        id: players.id,
        name: players.name,
        lastname: players.lastname,
        jerseyNumber: players.jerseyNumber,
        photoUrl: players.photoUrl,
        status: players.status,
        gender: players.gender,
      })
      .from(players)
      .where(eq(players.categoryId, categoryId))
      .orderBy(asc(players.lastname), asc(players.name));
  }

  async findValidationById(playerId: string, tx: DB | Transaction = db) {
    const [row] = await tx
      .select({
        name: players.name,
        lastname: players.lastname,
        carnetNumber: players.carnetNumber,
        jerseyNumber: players.jerseyNumber,
        status: players.status,
        photoUrl: players.photoUrl,
        gender: players.gender,
        clubName: clubs.name,
        categoriaNombre: categories.name,
        leagueName: leagues.name,
        leagueSlug: leagues.slug,
      })
      .from(players)
      .innerJoin(clubs, eq(players.clubId, clubs.id))
      .leftJoin(categories, eq(players.categoryId, categories.id))
      .leftJoin(leagues, eq(clubs.leagueId, leagues.id))
      .where(eq(players.id, playerId))
      .limit(1);
    return row ?? null;
  }
}

export const playerRepository = new PlayerRepository();
