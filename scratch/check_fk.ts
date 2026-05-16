
import { db } from "../src/lib/db/client";
import { sql } from "drizzle-orm";

async function main() {
  const res = await db.execute(sql`SELECT conname, confrelid::regclass, conrelid::regclass FROM pg_constraint WHERE conname = 'transactions_club_id_clubs_id_fk'`);
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
main();
