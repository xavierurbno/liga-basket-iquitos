/**
 * Carga variables de entorno según APP_ENV (development | production).
 * No imprime secretos.
 */
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @param {"development" | "production"} [target]
 */
export function loadAppEnv(target = process.env.APP_ENV?.trim() || "development") {
  const normalized = target === "production" ? "production" : "development";
  const files =
    normalized === "production"
      ? [".env.production.local", ".env.local"]
      : [".env.local", ".env.development.local"];

  for (const file of files) {
    const path = join(root, file);
    if (existsSync(path)) {
      dotenv.config({ path, override: false });
    }
  }

  if (!process.env.APP_ENV?.trim()) {
    process.env.APP_ENV = normalized;
  }

  return {
    appEnv: process.env.APP_ENV.trim(),
    projectRef: process.env.SUPABASE_PROJECT_REF?.trim() || "",
    root,
  };
}

export function refFromSupabaseUrl(url) {
  if (!url?.trim()) return "";
  const match = url.trim().match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1]?.toLowerCase() ?? "";
}

export function refFromDatabaseUrl(url) {
  if (!url?.trim()) return "";
  const match = url.match(/postgres(?:ql)?:\/\/postgres\.([a-z0-9]+):/i);
  return match?.[1]?.toLowerCase() ?? "";
}

export function resolveProjectRef() {
  const explicit = process.env.SUPABASE_PROJECT_REF?.trim().toLowerCase();
  if (explicit) return explicit;
  return (
    refFromSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    refFromDatabaseUrl(process.env.DATABASE_URL) ||
    refFromDatabaseUrl(process.env.DATABASE_URL_DIRECT) ||
    ""
  );
}
