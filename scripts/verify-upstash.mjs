/**
 * Verifica conexión Upstash (rate limit distribuido).
 * Uso: node scripts/verify-upstash.mjs
 * Carga .env.local y variables KV de Vercel si existen.
 */
import dotenv from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Redis } from "@upstash/redis";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env.local") });
dotenv.config({ path: join(root, ".env.production.local"), override: false });

const url =
  process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim();
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim();

if (!url || !token) {
  console.error("✗ Falta Upstash: define KV_REST_API_URL + KV_REST_API_TOKEN (Vercel)");
  console.error("  o UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN");
  process.exit(1);
}

const redis = new Redis({ url, token });
const key = `ops:ping:${Date.now()}`;

try {
  await redis.set(key, "ok", { ex: 30 });
  const value = await redis.get(key);
  await redis.del(key);
  if (value !== "ok") {
    console.error("✗ Upstash respondió pero el valor no coincide");
    process.exit(1);
  }
  console.log("✓ Upstash Redis OK");
  console.log(`  host: ${new URL(url).hostname}`);
  console.log(
    `  vars: ${process.env.KV_REST_API_URL ? "KV_REST_API_*" : "UPSTASH_REDIS_REST_*"}`,
  );
} catch (err) {
  console.error("✗ Error conectando a Upstash:", err instanceof Error ? err.message : err);
  process.exit(1);
}
