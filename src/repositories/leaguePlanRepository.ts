import { db } from "@/lib/db/client";
import { leaguePlans, players, tournaments, type LeaguePlan, type LeaguePlanTier } from "@/lib/db/schema";
import { and, count, eq, ne, sql } from "drizzle-orm";
import { ExtractTablesWithRelations } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

type DB = typeof db;
type Transaction = PgTransaction<
  PostgresJsQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;

const DEFAULT_PLAN = {
  plan: "free" as const,
  maxPlayers: 200,
  maxActiveTournaments: 2,
};

export type LeaguePlanUsage = {
  plan: LeaguePlan;
  playerCount: number;
  activeTournamentCount: number;
};

export class LeaguePlanRepository {
  async findByLeagueId(leagueId: string, tx: DB | Transaction = db): Promise<LeaguePlan | null> {
    const [row] = await tx
      .select()
      .from(leaguePlans)
      .where(eq(leaguePlans.leagueId, leagueId))
      .limit(1);
    return row ?? null;
  }

  /** Garantiza fila de plan (p. ej. ligas creadas antes de 0041). */
  async ensureForLeague(leagueId: string, tx: DB | Transaction = db): Promise<LeaguePlan> {
    const existing = await this.findByLeagueId(leagueId, tx);
    if (existing) return existing;

    const [row] = await tx
      .insert(leaguePlans)
      .values({
        leagueId,
        plan: DEFAULT_PLAN.plan,
        maxPlayers: DEFAULT_PLAN.maxPlayers,
        maxActiveTournaments: DEFAULT_PLAN.maxActiveTournaments,
      })
      .onConflictDoNothing({ target: leaguePlans.leagueId })
      .returning();

    if (row) return row;

    const fallback = await this.findByLeagueId(leagueId, tx);
    if (!fallback) {
      throw new Error("No se pudo inicializar league_plans para la liga.");
    }
    return fallback;
  }

  async countPlayersByLeague(leagueId: string, tx: DB | Transaction = db): Promise<number> {
    const [row] = await tx
      .select({ total: count() })
      .from(players)
      .where(eq(players.leagueId, leagueId));
    return Number(row?.total ?? 0);
  }

  /** Torneos no finalizados ni cancelados. */
  async countActiveTournaments(leagueId: string, tx: DB | Transaction = db): Promise<number> {
    const [row] = await tx
      .select({ total: count() })
      .from(tournaments)
      .where(
        and(
          eq(tournaments.leagueId, leagueId),
          ne(tournaments.status, "finished"),
          ne(tournaments.status, "cancelled"),
        ),
      );
    return Number(row?.total ?? 0);
  }

  async getUsage(leagueId: string, tx: DB | Transaction = db): Promise<LeaguePlanUsage> {
    const [plan, playerCount, activeTournamentCount] = await Promise.all([
      this.ensureForLeague(leagueId, tx),
      this.countPlayersByLeague(leagueId, tx),
      this.countActiveTournaments(leagueId, tx),
    ]);
    return { plan, playerCount, activeTournamentCount };
  }

  async upsert(
    leagueId: string,
    data: {
      plan: LeaguePlanTier;
      maxPlayers: number;
      maxActiveTournaments: number;
      trialExpiresAt?: Date | null;
    },
    tx: DB | Transaction = db,
  ): Promise<LeaguePlan> {
    return this.upsertFromStripe(
      leagueId,
      {
        plan: data.plan,
        maxPlayers: data.maxPlayers,
        maxActiveTournaments: data.maxActiveTournaments,
        trialExpiresAt: data.trialExpiresAt,
      },
      tx,
    );
  }

  async findByStripeCustomerId(
    customerId: string,
    tx: DB | Transaction = db,
  ): Promise<LeaguePlan | null> {
    const [row] = await tx
      .select()
      .from(leaguePlans)
      .where(eq(leaguePlans.stripeCustomerId, customerId))
      .limit(1);
    return row ?? null;
  }

  async upsertFromStripe(
    leagueId: string,
    data: {
      plan: LeaguePlanTier;
      maxPlayers: number;
      maxActiveTournaments: number;
      trialExpiresAt?: Date | null;
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
    },
    tx: DB | Transaction = db,
  ): Promise<LeaguePlan> {
    const [row] = await tx
      .insert(leaguePlans)
      .values({
        leagueId,
        plan: data.plan,
        maxPlayers: data.maxPlayers,
        maxActiveTournaments: data.maxActiveTournaments,
        trialExpiresAt: data.trialExpiresAt ?? null,
        stripeCustomerId: data.stripeCustomerId ?? null,
        stripeSubscriptionId: data.stripeSubscriptionId ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: leaguePlans.leagueId,
        set: {
          plan: data.plan,
          maxPlayers: data.maxPlayers,
          maxActiveTournaments: data.maxActiveTournaments,
          trialExpiresAt: data.trialExpiresAt ?? null,
          ...(data.stripeCustomerId !== undefined
            ? { stripeCustomerId: data.stripeCustomerId }
            : {}),
          ...(data.stripeSubscriptionId !== undefined
            ? { stripeSubscriptionId: data.stripeSubscriptionId }
            : {}),
          updatedAt: sql`now()`,
        },
      })
      .returning();
    if (!row) throw new Error("No se pudo guardar el plan de la liga.");
    return row;
  }
}

export const leaguePlanRepository = new LeaguePlanRepository();
