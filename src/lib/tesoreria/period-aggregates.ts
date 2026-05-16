import type { Treasury } from "@/lib/db/schema";

export type PeriodBucket = "month" | "quarter" | "semester" | "year";

export interface AmountByPeriod {
  periodKey: string;
  label: string;
  ingresos: number;
  egresos: number;
  balance: number;
}

function toNumber(m: string | null): number {
  if (m == null) return 0;
  const n = Number(m);
  return Number.isFinite(n) ? n : 0;
}

function yearMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function quarterKey(d: Date): string {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}

function semesterKey(d: Date): string {
  const s = d.getMonth() < 6 ? 1 : 2;
  return `${d.getFullYear()}-S${s}`;
}

function yearKey(d: Date): string {
  return String(d.getFullYear());
}

function labelFor(key: string, bucket: PeriodBucket): string {
  if (bucket === "year") return key;
  if (bucket === "month") {
    const [y, m] = key.split("-");
    const monthNames = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const mi = Number(m) - 1;
    return `${monthNames[mi] ?? m} ${y}`;
  }
  if (bucket === "quarter") {
    const [y, q] = key.split("-");
    return `${q ?? ""} ${y ?? ""}`;
  }
  const [y, s] = key.split("-");
  return `${s === "S1" ? "1.er sem" : "2.do sem"} ${y}`;
}

/**
 * Agrupa movimientos por mes natural (clave `YYYY-MM`).
 */
export function aggregateByMonth(rows: Treasury[]): AmountByPeriod[] {
  return aggregate(rows, "month", yearMonth, labelFor);
}

export function aggregateByQuarter(rows: Treasury[]): AmountByPeriod[] {
  return aggregate(rows, "quarter", quarterKey, labelFor);
}

export function aggregateBySemester(rows: Treasury[]): AmountByPeriod[] {
  return aggregate(rows, "semester", semesterKey, labelFor);
}

export function aggregateByYear(rows: Treasury[]): AmountByPeriod[] {
  return aggregate(rows, "year", yearKey, labelFor);
}

function aggregate(
  rows: Treasury[],
  bucket: PeriodBucket,
  keyFn: (d: Date) => string,
  labelFn: (key: string, bucket: PeriodBucket) => string
): AmountByPeriod[] {
  const map = new Map<string, { ingresos: number; egresos: number }>();
  for (const r of rows) {
    const d = r.transactionDate instanceof Date ? r.transactionDate : new Date(r.transactionDate as unknown as string);
    const key = keyFn(d);
    const cur = map.get(key) ?? { ingresos: 0, egresos: 0 };
    const m = toNumber(r.amount as unknown as string);
    if (r.type === "income") cur.ingresos += m;
    else cur.egresos += m;
    map.set(key, cur);
  }
  const keys = [...map.keys()].sort();
  return keys.map((periodKey) => {
    const v = map.get(periodKey)!;
    return {
      periodKey,
      label: labelFn(periodKey, bucket),
      ingresos: v.ingresos,
      egresos: v.egresos,
      balance: v.ingresos - v.egresos,
    };
  });
}

/** Suma ingresos / egresos del mes calendario indicado. */
export function sumMonthTotals(
  rows: Treasury[],
  ref: Date = new Date()
): { ingresos: number; egresos: number } {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  let ingresos = 0;
  let egresos = 0;
  for (const r of rows) {
    const d = r.transactionDate instanceof Date ? r.transactionDate : new Date(r.transactionDate as unknown as string);
    if (d.getFullYear() !== y || d.getMonth() !== m) continue;
    const val = toNumber(r.amount as unknown as string);
    if (r.type === "income") ingresos += val;
    else egresos += val;
  }
  return { ingresos, egresos };
}

/** Balance acumulado (ingresos − egresos) sobre el conjunto dado. */
export function cumulativeBalance(rows: Treasury[]): number {
  let ing = 0;
  let egr = 0;
  for (const r of rows) {
    const val = toNumber(r.amount as unknown as string);
    if (r.type === "income") ing += val;
    else egr += val;
  }
  return ing - egr;
}

export type TreasuryMonthRollup = { yyyymm: string; ingresos: number; egresos: number };

function ymParts(yyyymm: string): { y: number; m: number } | null {
  const parts = yyyymm.split("-");
  if (parts.length !== 2) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return null;
  return { y, m };
}

function quarterKeyFromYyyymm(yyyymm: string): string | null {
  const p = ymParts(yyyymm);
  if (!p) return null;
  const q = Math.floor((p.m - 1) / 3) + 1;
  return `${p.y}-Q${q}`;
}

function semesterKeyFromYyyymm(yyyymm: string): string | null {
  const p = ymParts(yyyymm);
  if (!p) return null;
  const s = p.m <= 6 ? 1 : 2;
  return `${p.y}-S${s}`;
}

/** Construye los cuatro indicadores de período a partir de agregados mensuales (p. ej. salida de SQL). */
export function periodIndicatorsFromMonthlyRollups(months: TreasuryMonthRollup[]): {
  ultimoMes: AmountByPeriod | null;
  ultimoTrim: AmountByPeriod | null;
  ultimoSem: AmountByPeriod | null;
  ultimoAnio: AmountByPeriod | null;
} {
  const empty = { ultimoMes: null, ultimoTrim: null, ultimoSem: null, ultimoAnio: null };
  const sorted = [...months].sort((a, b) => a.yyyymm.localeCompare(b.yyyymm));
  if (sorted.length === 0) return empty;

  const last = sorted[sorted.length - 1]!;
  const ultimoMes: AmountByPeriod = {
    periodKey: last.yyyymm,
    label: labelFor(last.yyyymm, "month"),
    ingresos: last.ingresos,
    egresos: last.egresos,
    balance: last.ingresos - last.egresos,
  };

  const qkLast = quarterKeyFromYyyymm(last.yyyymm);
  let ti = 0;
  let te = 0;
  if (qkLast) {
    for (const row of sorted) {
      if (quarterKeyFromYyyymm(row.yyyymm) === qkLast) {
        ti += row.ingresos;
        te += row.egresos;
      }
    }
  }
  const ultimoTrim: AmountByPeriod | null = qkLast
    ? {
        periodKey: qkLast,
        label: labelFor(qkLast, "quarter"),
        ingresos: ti,
        egresos: te,
        balance: ti - te,
      }
    : null;

  const skLast = semesterKeyFromYyyymm(last.yyyymm);
  let si = 0;
  let se = 0;
  if (skLast) {
    for (const row of sorted) {
      if (semesterKeyFromYyyymm(row.yyyymm) === skLast) {
        si += row.ingresos;
        se += row.egresos;
      }
    }
  }
  const ultimoSem: AmountByPeriod | null = skLast
    ? {
        periodKey: skLast,
        label: labelFor(skLast, "semester"),
        ingresos: si,
        egresos: se,
        balance: si - se,
      }
    : null;

  const pLast = ymParts(last.yyyymm);
  let yi = 0;
  let ye = 0;
  const yk = pLast ? String(pLast.y) : null;
  if (pLast) {
    for (const row of sorted) {
      const py = ymParts(row.yyyymm);
      if (py && py.y === pLast.y) {
        yi += row.ingresos;
        ye += row.egresos;
      }
    }
  }
  const ultimoAnio: AmountByPeriod | null = yk
    ? {
        periodKey: yk,
        label: labelFor(yk, "year"),
        ingresos: yi,
        egresos: ye,
        balance: yi - ye,
      }
    : null;

  return { ultimoMes, ultimoTrim, ultimoSem, ultimoAnio };
}
