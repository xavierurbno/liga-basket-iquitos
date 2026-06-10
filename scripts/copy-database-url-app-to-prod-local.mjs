import { readFileSync, appendFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(root, ".env.vercel.production.tmp");
const prodLocal = join(root, ".env.production.local");

if (!existsSync(tmp)) {
  console.error("Falta .env.vercel.production.tmp — ejecuta vercel env pull primero.");
  process.exit(1);
}

const text = readFileSync(tmp, "utf8");
const match = text.match(/DATABASE_URL_APP="([^"]+)"/);
if (!match) {
  console.error("No se encontró DATABASE_URL_APP en el pull de Vercel.");
  process.exit(1);
}

const url = match[1].replace(/\r\n/g, "").trim();
appendFileSync(prodLocal, `\nDATABASE_URL_APP=${url}\n`);
console.log("✓ DATABASE_URL_APP añadido a .env.production.local");
