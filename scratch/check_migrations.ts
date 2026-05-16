
import { db } from "../src/lib/db/client";
import { sql } from "drizzle-orm";

async function checkMigrations() {
  try {
    const result = await db.execute(sql`
      SELECT * FROM drizzle.__drizzle_migrations;
    `);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error checking migrations:", error);
  } finally {
    process.exit(0);
  }
}

checkMigrations();
