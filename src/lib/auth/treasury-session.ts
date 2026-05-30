import { cache } from "react";
import { createSupabaseServerFromCookies } from "@/lib/supabase/server";
import { resolveTreasuryAccess, type TreasuryAccess } from "@/lib/auth/treasury-access";

export type TreasurySession = {
  userId: string;
  email: string | undefined;
  access: TreasuryAccess;
};

export const getTreasurySession = cache(async (): Promise<TreasurySession | null> => {
  const supabase = await createSupabaseServerFromCookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const access = await resolveTreasuryAccess(user.id, user.email);
  return { userId: user.id, email: user.email ?? undefined, access };
});
