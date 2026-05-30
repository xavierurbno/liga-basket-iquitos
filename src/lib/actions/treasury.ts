"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/lib/db/client";
import { treasury } from "@/lib/db/schema";
import {
  assertTreasuryWriteClubAccess,
  resolveTreasuryAccess,
} from "@/lib/auth/treasury-access";
import { resolveOperationalLeagueId } from "@/lib/auth/resolve-league-id";
import { requireAuth } from "@/lib/auth/require-auth";
import { createTreasuryTxSchema, type CreateTreasuryTxValues } from "@/lib/validations/treasury";

export async function createTreasuryTransaction(
  input: CreateTreasuryTxValues,
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = createTreasuryTxSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const auth = await requireAuth(["SUPER_ADMIN", "LEAGUE_ADMIN"], [
    { clubId: parsed.data.clubId },
  ]);
  if (auth.denied) {
    return { success: false, error: auth.error };
  }

  const access = await resolveTreasuryAccess(auth.user.id, auth.user.email);
  if (access.kind !== "full") {
    return { success: false, error: "No tienes permiso para registrar movimientos." };
  }

  const cookieStore = await cookies();
  const operationalLeagueId = resolveOperationalLeagueId(auth.user, cookieStore);

  const scope = await assertTreasuryWriteClubAccess(
    auth.user.id,
    auth.user.email,
    parsed.data.clubId,
    operationalLeagueId,
  );
  if (!scope.ok) return { success: false, error: scope.error };

  await db.insert(treasury).values({
    clubId: parsed.data.clubId,
    type: parsed.data.type,
    amount: String(parsed.data.amount.toFixed(2)),
    concept: parsed.data.concept,
    paymentChannel: parsed.data.paymentChannel,
    transactionDate: parsed.data.transactionDate,
    notes: parsed.data.notes?.trim() || null,
  });

  revalidatePath("/liga/tesoreria/", "page");
  return { success: true };
}
