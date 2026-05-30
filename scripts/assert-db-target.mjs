/**
 * Bloquea migraciones accidentales contra producción.
 *
 * Prod conocido: jfgnwtkmqayzhlwfxidz
 * Dev conocido:  txmnlszmumayyrisqeby
 */
import { loadAppEnv, resolveProjectRef } from "./load-env.mjs";

/** Refs de proyectos Supabase PROD — ampliar si hay más instancias productivas. */
export const PROD_PROJECT_REFS = new Set([
  "jfgnwtkmqayzhlwfxidz",
]);

export function isProdProjectRef(ref) {
  if (!ref?.trim()) return false;
  const normalized = ref.trim().toLowerCase();
  if (PROD_PROJECT_REFS.has(normalized)) return true;
  const extra = process.env.ALLOWED_PROD_PROJECT_REF?.trim().toLowerCase();
  return Boolean(extra && normalized === extra);
}

/**
 * @param {{ target?: "development" | "production", forceProd?: boolean }} [opts]
 */
export function assertSafeMigrationTarget(opts = {}) {
  loadAppEnv(opts.target ?? process.env.APP_ENV?.trim() ?? "development");

  const ref = resolveProjectRef();
  const forceProd =
    opts.forceProd ||
    process.argv.includes("--force-prod") ||
    process.env.FORCE_PROD_DB === "1";

  if (!ref) {
    console.error(
      "No se detectó SUPABASE_PROJECT_REF ni ref en NEXT_PUBLIC_SUPABASE_URL / DATABASE_URL.",
    );
    console.error("Define SUPABASE_PROJECT_REF en .env.local (dev) o .env.production.local.");
    process.exit(1);
  }

  const prod = isProdProjectRef(ref);

  if (prod && !forceProd) {
    console.error(`\n⛔ Bloqueado: el ref "${ref}" es PRODUCCIÓN.`);
    console.error("Para migrar prod desde local:");
    console.error(
      "  CONFIRM_PROD_MIGRATE=yes npm run db:migrate:prod -- --force-prod",
    );
    console.error("Recomendado: aplicar SQL en Supabase Dashboard → SQL Editor (prod).");
    process.exit(1);
  }

  if (prod && forceProd && process.env.CONFIRM_PROD_MIGRATE !== "yes") {
    console.error(
      '\n⛔ Falta CONFIRM_PROD_MIGRATE=yes para ejecutar contra producción.',
    );
    process.exit(1);
  }

  console.log(`✓ Entorno DB: ref=${ref} ${prod ? "(PROD — confirmado)" : "(no prod)"}`);
  return { ref, prod };
}
