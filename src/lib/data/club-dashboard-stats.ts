import { and, count, desc, eq, gte, lte, sum } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { players, treasury } from "@/lib/db/schema";
import type { TreasuryRecentMovement } from "@/lib/db/schema";

export type ClubDashboardStats = {
  totalJugadores: number;
  jugadoresActivos: number;
  ingresosMes: number;
  egresosMes: number;
  saldoNeto: number;
  jugadoresPendientes: number;
  porcentajePago: number;
  distribucionCategorias: { category: string; total: number }[];
  movimientosRecientes: TreasuryRecentMovement[];
};

function monthBounds() {
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const finMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  return { inicioMes, finMes };
}

export async function fetchClubDashboardStats(clubId: string): Promise<ClubDashboardStats> {
  const { inicioMes, finMes } = monthBounds();

  const [
    totalJugadores,
    jugadoresActivos,
    ingresosMes,
    egresosMes,
    distribucionCategorias,
    movimientosRecientes,
  ] = await Promise.all([
    db
      .select({ total: count() })
      .from(players)
      .where(eq(players.clubId, clubId))
      .then((r) => Number(r[0]?.total ?? 0)),

    db
      .select({ total: count() })
      .from(players)
      .where(and(eq(players.clubId, clubId), eq(players.status, "ACTIVO")))
      .then((r) => Number(r[0]?.total ?? 0)),

    db
      .select({ total: sum(treasury.amount) })
      .from(treasury)
      .where(
        and(
          eq(treasury.clubId, clubId),
          eq(treasury.type, "income"),
          gte(treasury.transactionDate, inicioMes),
          lte(treasury.transactionDate, finMes)
        )
      )
      .then((r) => Number(r[0]?.total ?? 0)),

    db
      .select({ total: sum(treasury.amount) })
      .from(treasury)
      .where(
        and(
          eq(treasury.clubId, clubId),
          eq(treasury.type, "expense"),
          gte(treasury.transactionDate, inicioMes),
          lte(treasury.transactionDate, finMes)
        )
      )
      .then((r) => Number(r[0]?.total ?? 0)),

    db
      .select({
        category: players.category,
        total: count(),
      })
      .from(players)
      .where(eq(players.clubId, clubId))
      .groupBy(players.category),

    db
      .select({
        id: treasury.id,
        type: treasury.type,
        amount: treasury.amount,
        concept: treasury.concept,
        paymentChannel: treasury.paymentChannel,
        transactionDate: treasury.transactionDate,
      })
      .from(treasury)
      .where(eq(treasury.clubId, clubId))
      .orderBy(desc(treasury.transactionDate))
      .limit(8),
  ]);

  const saldoNeto = ingresosMes - egresosMes;
  const porcentajePago =
    totalJugadores > 0 ? Math.round((jugadoresActivos / totalJugadores) * 100) : 0;
  const jugadoresPendientes = totalJugadores - jugadoresActivos;

  return {
    totalJugadores,
    jugadoresActivos,
    ingresosMes,
    egresosMes,
    saldoNeto,
    jugadoresPendientes,
    porcentajePago,
    distribucionCategorias,
    movimientosRecientes,
  };
}
