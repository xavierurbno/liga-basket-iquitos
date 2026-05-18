import { z } from "zod";

export const tournamentFormatSchema = z.enum([
  "linear",
  "home_and_away",
  "groups",
  "groups_playoffs",
]);

const groupFormatRefine = (
  data: { format: string; categoryIds: string[]; numberOfGroups?: number },
  ctx: z.RefinementCtx
) => {
  if (data.format === "groups" || data.format === "groups_playoffs") {
    const n = data.numberOfGroups ?? 2;
    if (data.categoryIds.length < n * 2) {
      ctx.addIssue({
        code: "custom",
        message: `Para ${n} grupos necesitas al menos ${n * 2} equipos.`,
        path: ["categoryIds"],
      });
    }
  }
};

/** Evita que `z.coerce` convierta ausencia de dato en 0 y dispare validación de cuartos. */
const quarterField = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? undefined : n;
}, z.number().int().min(0).max(99).optional());

export const createTournamentSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
    format: tournamentFormatSchema,
    categoryIds: z.array(z.string().uuid()).min(2, "Selecciona al menos 2 equipos"),
    numberOfGroups: z.coerce.number().int().min(2).max(4).optional(),
    shuffleGroups: z.boolean().optional(),
    teamsPerGroupToAdvance: z.coerce.number().int().min(1).max(2).optional(),
    thirdPlaceMatch: z.boolean().optional(),
    useQuarters: z.boolean().optional(),
    pointsWin: z.coerce.number().int().min(0).max(10).optional(),
    pointsLoss: z.coerce.number().int().min(0).max(10).optional(),
    pointsWalkover: z.coerce.number().int().min(0).max(10).optional(),
    rulesNote: z.string().max(2000).optional(),
  })
  .superRefine(groupFormatRefine);

export const recordMatchResultSchema = z
  .object({
    matchId: z.string().uuid(),
    mode: z.enum(["score", "wo_home", "wo_away", "postpone"]),
    homeScore: z.coerce.number().int().min(0).max(300).optional(),
    awayScore: z.coerce.number().int().min(0).max(300).optional(),
    homeQ1: quarterField,
    awayQ1: quarterField,
    homeQ2: quarterField,
    awayQ2: quarterField,
    homeQ3: quarterField,
    awayQ3: quarterField,
    homeQ4: quarterField,
    awayQ4: quarterField,
    homeOt: quarterField,
    awayOt: quarterField,
  })
  .superRefine((data, ctx) => {
    if (data.mode === "score") {
      if (data.homeScore === undefined || data.awayScore === undefined) {
        ctx.addIssue({
          code: "custom",
          message: "Ingresa el marcador de ambos equipos.",
          path: ["homeScore"],
        });
      }
    }
  });

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type RecordMatchResultInput = z.infer<typeof recordMatchResultSchema>;
