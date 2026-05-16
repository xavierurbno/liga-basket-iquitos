"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/db/client";
import { treasury } from "@/lib/db/schema";
import { assertClubExists, resolveTreasuryAccess } from "@/lib/auth/treasury-access";
import { createTreasuryTxSchema, type CreateTreasuryTxValues } from "@/lib/validations/treasury";

async function supabaseFromCookies() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
}

export async function createTreasuryTransaction(
  input: CreateTreasuryTxValues
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = createTreasuryTxSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await supabaseFromCookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Sesión requerida." };

  const access = await resolveTreasuryAccess(user.id, user.email);
  if (access.kind !== "full") {
    return { success: false, error: "No tienes permiso para registrar movimientos." };
  }

  const clubOk = await assertClubExists(parsed.data.clubId);
  if (!clubOk) return { success: false, error: "Club no válido." };

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
