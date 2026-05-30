import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import { existsSync } from "node:fs";

const target = process.env.APP_ENV?.trim() || "development";
const envFiles =
  target === "production"
    ? [".env.production.local", ".env.local"]
    : [".env.local", ".env.development.local"];

for (const file of envFiles) {
  if (existsSync(file)) {
    dotenv.config({ path: file, override: false });
  }
}

function resolveDrizzleUrl(): string {
  return (
    process.env.DATABASE_URL_DIRECT?.trim() ||
    process.env.DATABASE_URL_POOLED?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    ""
  );
}

const url = resolveDrizzleUrl();
if (!url) {
  throw new Error(
    "Define DATABASE_URL_DIRECT (recomendado) o DATABASE_URL en .env.local",
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
