
import { db } from "../src/lib/db/client";
import { sql } from "drizzle-orm";

async function main() {
  const res = await db.execute(sql`SELECT * FROM clubs`);
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
main();
