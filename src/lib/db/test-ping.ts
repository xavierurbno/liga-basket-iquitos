import * as dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { db } from "./client";
import { clubs } from "./schema";

dotenv.config({ path: ".env.local" });

async function main() {
  const result = await db.select({ total: sql<number>`count(*)` }).from(clubs);
  const total = result[0]?.total ?? 0;
  console.log(`[test-ping] clubs registrados: ${total}`);
}

main()
  .catch((error) => {
    console.error("[test-ping] error:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
