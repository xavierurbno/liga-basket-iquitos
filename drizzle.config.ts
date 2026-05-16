import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Forzamos la carga del archivo .env.local
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_POOLED || "",
  },
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
