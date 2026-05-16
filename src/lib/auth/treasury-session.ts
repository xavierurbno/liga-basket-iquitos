import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { resolveTreasuryAccess, type TreasuryAccess } from "@/lib/auth/treasury-access";

export type TreasurySession = {
  userId: string;
  email: string | undefined;
  access: TreasuryAccess;
};

export const getTreasurySession = cache(async (): Promise<TreasurySession | null> => {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll() {},
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const access = await resolveTreasuryAccess(user.id, user.email);
  return { userId: user.id, email: user.email ?? undefined, access };
});
