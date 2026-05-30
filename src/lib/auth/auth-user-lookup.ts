import { getSupabaseAdmin } from "@/lib/supabase/admin-server";

const LIST_PAGE_SIZE = 200;
const MAX_PAGES = 10;

/**
 * Busca el UUID de Auth por correo vía Admin API (sin SQL directo a `auth.users`).
 */
export async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const admin = getSupabaseAdmin();

  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: LIST_PAGE_SIZE,
    });

    if (error) {
      console.error("[findAuthUserIdByEmail] listUsers:", error.message);
      return null;
    }

    const match = data.users.find(
      (u) => (u.email ?? "").trim().toLowerCase() === normalized,
    );
    if (match?.id) return match.id;

    const lastPage = data.lastPage ?? page;
    if (page >= lastPage || data.users.length < LIST_PAGE_SIZE) break;
  }

  return null;
}
