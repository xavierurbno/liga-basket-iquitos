import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadAppEnv, resolveProjectRef } from "./load-env.mjs";
import { withPgbouncerParam } from "./resolve-db-url.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const prodLocal = join(root, ".env.production.local");

loadAppEnv("production");

const password = process.env.LIGA_APP_DB_PASSWORD?.trim();
if (!password) {
  console.error("Define LIGA_APP_DB_PASSWORD en el entorno.");
  process.exit(1);
}

const base =
  process.env.DATABASE_URL_POOLED?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  process.env.DATABASE_URL_DIRECT?.trim();
if (!base) {
  console.error("Falta DATABASE_URL en .env.production.local");
  process.exit(1);
}

const u = new URL(base.replace(/^postgresql:/, "http:"));
const ref = resolveProjectRef();
if (u.hostname.includes("pooler.supabase.com") && ref) {
  u.username = `liga_app.${ref}`;
} else {
  u.username = "liga_app";
}
u.password = password;
const appUrl = withPgbouncerParam(u.toString().replace(/^http:/, "postgresql:"));

let text = existsSync(prodLocal) ? readFileSync(prodLocal, "utf8") : "";
if (/^DATABASE_URL_APP=/m.test(text)) {
  text = text.replace(/^DATABASE_URL_APP=.*$/m, `DATABASE_URL_APP=${appUrl}`);
} else {
  text = `${text.trimEnd()}\nDATABASE_URL_APP=${appUrl}\n`;
}
writeFileSync(prodLocal, text, "utf8");
console.log("✓ .env.production.local actualizado (DATABASE_URL_APP)");
