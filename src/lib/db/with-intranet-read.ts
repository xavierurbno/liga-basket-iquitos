import "server-only";

import { resolveIntranetAuthSession } from "@/lib/auth/auth-session";
import {
  withOperationalRead,
  type OperationalTx,
} from "@/lib/db/operational-db-access";

/** Lecturas intranet con JWT claims cuando `USE_APP_DB_ROLE=true`. */
export async function withIntranetRead<T>(
  fn: (tx: OperationalTx) => Promise<T>,
): Promise<T | null> {
  const auth = await resolveIntranetAuthSession();
  if (!auth) return null;
  return withOperationalRead(auth.user, auth.context, fn);
}
