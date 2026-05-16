import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Cliente Admin (service role). Solo importar desde Server Actions o Server Components que no filtren datos sensibles al cliente. */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.trim()) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor para operaciones de Auth administradas.",
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
