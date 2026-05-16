import { db } from './src/lib/db/client';
import { leagues, leagueSettings } from './src/lib/db/schema';

async function check() {
  const l = await db.select().from(leagues);
  console.log('Leagues:', l.length, l);
  const s = await db.select().from(leagueSettings);
  console.log('Settings:', s.length, s);
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
