import { and, asc, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { clubs, treasury } from "@/lib/db/schema";
import type { TreasuryAccess } from "@/lib/auth/treasury-access";

function num(v: string | null | undefined): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function scopeCondition(access: TreasuryAccess, filterClubId: string | null) {
  if (access.kind === "none") return sql`false`;
  if (access.kind === "readonly") {
    if (access.clubIds.length === 0) return sql`false`;
    if (filterClubId) {
      if (!access.clubIds.includes(filterClubId)) return sql`false`;
      return eq(treasury.clubId, filterClubId);
    }
    return inArray(treasury.clubId, access.clubIds);
  }
  if (filterClubId) return eq(treasury.clubId, filterClubId);
  return sql`true`;
}

export async function getTreasuryKpis(
  access: TreasuryAccess,
  filterClubId: string | null,
  ref: Date = new Date()
): Promise<{ ingresosMes: number; egresosMes: number; balanceActual: number }> {
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
  const scope = scopeCondition(access, filterClubId);
  /** Fechas en `sql`...`` como ${Date} rompen postgres-js; usar `gte`/`lte` en el WHERE. */
  const monthScope = and(scope, gte(treasury.transactionDate, start), lte(treasury.transactionDate, end));

  const [monthRow] = await db
    .select({
      ingresos: sql<string>`coalesce(sum(case when ${treasury.type} = 'income' then ${treasury.amount}::numeric else 0 end), 0)`,
      egresos: sql<string>`coalesce(sum(case when ${treasury.type} = 'expense' then ${treasury.amount}::numeric else 0 end), 0)`,
    })
    .from(treasury)
    .where(monthScope);

  const [totRow] = await db
    .select({
      ingresos: sql<string>`coalesce(sum(case when ${treasury.type} = 'income' then ${treasury.amount}::numeric else 0 end), 0)`,
      egresos: sql<string>`coalesce(sum(case when ${treasury.type} = 'expense' then ${treasury.amount}::numeric else 0 end), 0)`,
    })
    .from(treasury)
    .where(scope);

  return {
    ingresosMes: num(monthRow?.ingresos),
    egresosMes: num(monthRow?.egresos),
    balanceActual: num(totRow?.ingresos) - num(totRow?.egresos),
  };
}

export type MonthRollupRow = { yyyymm: string; ingresos: number; egresos: number };

/** Agregación mensual en SQL (pocas filas); evita traer miles de movimientos al servidor. */
export async function getTreasuryMonthlyRollups(
  access: TreasuryAccess,
  filterClubId: string | null,
  monthsBack = 36
): Promise<MonthRollupRow[]> {
  const scope = scopeCondition(access, filterClubId);
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);

  const monthTrunc = sql`date_trunc('month', ${treasury.transactionDate})`;

  const raw = await db
    .select({
      yyyymm: sql<string>`to_char(${monthTrunc}, 'YYYY-MM')`,
      ingresos: sql<string>`coalesce(sum(case when ${treasury.type} = 'income' then ${treasury.amount}::numeric else 0 end), 0)`,
      egresos: sql<string>`coalesce(sum(case when ${treasury.type} = 'expense' then ${treasury.amount}::numeric else 0 end), 0)`,
    })
    .from(treasury)
    .where(and(scope, gte(treasury.transactionDate, since)))
    .groupBy(monthTrunc)
    .orderBy(asc(monthTrunc));

  return raw.map((r) => ({
    yyyymm: r.yyyymm,
    ingresos: num(r.ingresos),
    egresos: num(r.egresos),
  }));
}

/**
 * Compatibilidad: versiones antiguas de `tesoreria/page.tsx` importaban esta función.
 * Preferir `getTreasuryMonthlyRollups`. Límite acotado para no penalizar el pool de conexiones.
 */
export async function listTransactionsForAggregates(
  access: TreasuryAccess,
  filterClubId: string | null,
  limit = 500
) {
  const scope = scopeCondition(access, filterClubId);
  const cap = Math.min(Math.max(1, limit), 1000);
  return db
    .select()
    .from(treasury)
    .where(scope)
    .orderBy(desc(treasury.transactionDate))
    .limit(cap);
}

export type TransactionListRow = {
  id: string;
  transactionDate: Date;
  type: "income" | "expense";
  amount: string;
  concept: string;
  paymentChannel: "EFECTIVO" | "PLIN" | "YAPE" | "TRANSFERENCIA" | "BCP" | "BBVA" | "INTERBANK";
  notes: string | null;
  clubId: string;
  clubName: string;
};

export async function listTransactionsPage(params: {
  access: TreasuryAccess;
  filterClubId: string | null;
  type: "income" | "expense" | null;
  page: number;
  pageSize: number;
}): Promise<{ rows: TransactionListRow[]; total: number }> {
  const { access, filterClubId, type, page, pageSize } = params;
  const scope = scopeCondition(access, filterClubId);
  const tipoCond = type ? eq(treasury.type, type) : sql`true`;
  const where = and(scope, tipoCond);

  const [countRow] = await db.select({ c: count() }).from(treasury).where(where);
  const total = Number(countRow?.c ?? 0);
  const offset = Math.max(0, (page - 1) * pageSize);

  const raw = await db
    .select({
      id: treasury.id,
      transactionDate: treasury.transactionDate,
      type: treasury.type,
      amount: treasury.amount,
      concept: treasury.concept,
      paymentChannel: treasury.paymentChannel,
      notes: treasury.notes,
      clubId: treasury.clubId,
      clubName: clubs.name,
    })
    .from(treasury)
    .innerJoin(clubs, eq(treasury.clubId, clubs.id))
    .where(where)
    .orderBy(desc(treasury.transactionDate), desc(treasury.id))
    .limit(pageSize)
    .offset(offset);

  const rows: TransactionListRow[] = raw.map((r) => ({
    id: r.id,
    transactionDate: r.transactionDate,
    type: r.type,
    amount: String(r.amount),
    concept: r.concept,
    paymentChannel: r.paymentChannel,
    notes: r.notes,
    clubId: r.clubId,
    clubName: r.clubName,
  }));

  return { rows, total };
}

export async function listClubsForSelect() {
  return db.select({ id: clubs.id, name: clubs.name, slug: clubs.slug }).from(clubs).orderBy(clubs.name);
}

/** Lista de clubes acotada al alcance del usuario (menos filas que cargar toda la liga para `club_manager`). */
export async function listClubsForTreasury(access: TreasuryAccess) {
  if (access.kind === "none") return [];
  if (access.kind === "readonly") {
    if (access.clubIds.length === 0) return [];
    return db
      .select({ id: clubs.id, name: clubs.name, slug: clubs.slug })
      .from(clubs)
      .where(inArray(clubs.id, access.clubIds))
      .orderBy(clubs.name);
  }
  return listClubsForSelect();
}
