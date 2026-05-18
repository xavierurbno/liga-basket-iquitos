export type QuarterInput = {
  homeQ1?: number | null;
  awayQ1?: number | null;
  homeQ2?: number | null;
  awayQ2?: number | null;
  homeQ3?: number | null;
  awayQ3?: number | null;
  homeQ4?: number | null;
  awayQ4?: number | null;
  homeOt?: number | null;
  awayOt?: number | null;
};

function n(v: number | null | undefined): number {
  return v == null || Number.isNaN(v) ? 0 : v;
}

export function sumSideQuarters(input: QuarterInput, side: "home" | "away"): number {
  const p = side === "home" ? "home" : "away";
  return (
    n(input[`${p}Q1` as keyof QuarterInput] as number | undefined) +
    n(input[`${p}Q2` as keyof QuarterInput] as number | undefined) +
    n(input[`${p}Q3` as keyof QuarterInput] as number | undefined) +
    n(input[`${p}Q4` as keyof QuarterInput] as number | undefined) +
    n(input[`${p}Ot` as keyof QuarterInput] as number | undefined)
  );
}

/** Hay datos de cuartos solo si al menos un valor es un entero ≥ 0 distinto de “vacío”. */
export function hasAnyQuarterInput(input: QuarterInput): boolean {
  const fields: (number | null | undefined)[] = [
    input.homeQ1,
    input.awayQ1,
    input.homeQ2,
    input.awayQ2,
    input.homeQ3,
    input.awayQ3,
    input.homeQ4,
    input.awayQ4,
    input.homeOt,
    input.awayOt,
  ];
  const present = fields.filter((v) => v != null && v !== undefined);
  if (present.length === 0) return false;
  return present.some((v) => v > 0);
}

/** Valida que el marcador total coincida con la suma de cuartos (+ OT). */
export function validateQuarterScores(
  homeScore: number,
  awayScore: number,
  input: QuarterInput
): string | null {
  if (!hasAnyQuarterInput(input)) return null;

  const homeSum = sumSideQuarters(input, "home");
  const awaySum = sumSideQuarters(input, "away");

  if (homeSum !== homeScore) {
    return `Local: la suma de cuartos (${homeSum}) no coincide con el marcador (${homeScore}).`;
  }
  if (awaySum !== awayScore) {
    return `Visitante: la suma de cuartos (${awaySum}) no coincide con el marcador (${awayScore}).`;
  }
  return null;
}

export function formatQuarterLine(input: QuarterInput, side: "home" | "away"): string | null {
  const p = side === "home" ? "home" : "away";
  const q1 = input[`${p}Q1` as keyof QuarterInput];
  const q2 = input[`${p}Q2` as keyof QuarterInput];
  const q3 = input[`${p}Q3` as keyof QuarterInput];
  const q4 = input[`${p}Q4` as keyof QuarterInput];
  const ot = input[`${p}Ot` as keyof QuarterInput];

  if ([q1, q2, q3, q4, ot].every((v) => v == null)) return null;

  const parts = [q1 ?? "-", q2 ?? "-", q3 ?? "-", q4 ?? "-"].join(" · ");
  return ot != null && ot > 0 ? `${parts} (OT ${ot})` : parts;
}
