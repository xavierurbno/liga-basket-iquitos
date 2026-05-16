
import { db } from "../src/lib/db/client";
import { sql } from "drizzle-orm";

async function checkTables() {
  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error checking tables:", error);
  } finally {
    process.exit(0);
  }
}

checkTables();
