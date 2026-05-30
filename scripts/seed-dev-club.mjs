/**
 * Crea club, categorías, jugadores activos con carnet en Supabase DEV (idempotente).
 *
 * Uso: npm run db:seed:dev-club
 */
import { loadAppEnv } from "./load-env.mjs";
import { assertSafeMigrationTarget } from "./assert-db-target.mjs";
import { connectPostgres } from "./connect-postgres.mjs";

loadAppEnv("development");
assertSafeMigrationTarget({ target: "development" });

const LEAGUE_SLUG = "lddbi";

const CLUB = {
  name: "Deportivo Selva Iquitos",
  slug: "dev-deportivo-selva",
  adminEmail: "delegado.dev@example.com",
  adminPhone: "965432100",
  colorPrimary: "#1e3a5f",
  colorSecondary: "#0d9488",
  courtAddress: "Av. La Marina 120, Iquitos",
  federationCode: "IQ-001",
};

/** @type {{ name: string; coachName: string; coachLastname: string; players: Array<{ name: string; lastname: string; documentNumber: string; birthdate: string; gender: "MASCULINO" | "FEMENINO"; jerseyNumber: number; photoSeed: string }> }[]} */
const CATEGORY_SEEDS = [
  {
    name: "U 13 Masculino",
    coachName: "Roberto",
    coachLastname: "Sánchez",
    players: [
      {
        name: "Carlos",
        lastname: "Mendoza López",
        documentNumber: "71234501",
        birthdate: "2013-05-12",
        gender: "MASCULINO",
        jerseyNumber: 7,
        photoSeed: "carlos-mendoza",
      },
      {
        name: "Diego",
        lastname: "Ríos Paredes",
        documentNumber: "71234502",
        birthdate: "2013-08-20",
        gender: "MASCULINO",
        jerseyNumber: 11,
        photoSeed: "diego-rios",
      },
    ],
  },
  {
    name: "U 15 Masculino",
    coachName: "Miguel",
    coachLastname: "Torres Vega",
    players: [
      {
        name: "Luis",
        lastname: "Torres Castillo",
        documentNumber: "71234503",
        birthdate: "2011-03-15",
        gender: "MASCULINO",
        jerseyNumber: 5,
        photoSeed: "luis-torres",
      },
      {
        name: "Andrés",
        lastname: "Flores Díaz",
        documentNumber: "71234504",
        birthdate: "2011-11-02",
        gender: "MASCULINO",
        jerseyNumber: 23,
        photoSeed: "andres-flores",
      },
    ],
  },
  {
    name: "U 17 Masculino",
    coachName: "Jorge",
    coachLastname: "Ruiz Campos",
    players: [
      {
        name: "Marco",
        lastname: "Ruiz Salazar",
        documentNumber: "71234505",
        birthdate: "2009-07-08",
        gender: "MASCULINO",
        jerseyNumber: 10,
        photoSeed: "marco-ruiz",
      },
      {
        name: "Kevin",
        lastname: "Vásquez Ortiz",
        documentNumber: "71234506",
        birthdate: "2009-01-25",
        gender: "MASCULINO",
        jerseyNumber: 3,
        photoSeed: "kevin-vasquez",
      },
    ],
  },
  {
    name: "Mayores Masculino",
    coachName: "Pedro",
    coachLastname: "Vargas Luna",
    players: [
      {
        name: "Pedro",
        lastname: "Vargas Luna",
        documentNumber: "71234507",
        birthdate: "1998-04-18",
        gender: "MASCULINO",
        jerseyNumber: 15,
        photoSeed: "pedro-vargas",
      },
      {
        name: "Ricardo",
        lastname: "Núñez Peña",
        documentNumber: "71234508",
        birthdate: "1995-12-30",
        gender: "MASCULINO",
        jerseyNumber: 8,
        photoSeed: "ricardo-nunez",
      },
    ],
  },
];

const FICHA_PREFIX_BY_CATEGORIA = {
  SUB_13: "U13",
  SUB_15: "U15",
  SUB_17: "U17",
  MAYORES: "MAY",
  VETERANOS: "VET",
};

const CLUB_CATEGORY_KEYWORDS = [
  ["VETERANOS", "VET"],
  ["VETERANO", "VET"],
  ["SUPERIOR", "SUP"],
  ["MAYORES", "MAY"],
  ["INFANTIL", "INF"],
  ["JUVENIL", "JUV"],
];

function calcularCategoria(birthdate, anioTorneo = new Date().getFullYear()) {
  const edad = anioTorneo - birthdate.getFullYear();
  if (edad <= 13) return "SUB_13";
  if (edad <= 15) return "SUB_15";
  if (edad <= 17) return "SUB_17";
  if (edad <= 39) return "MAYORES";
  return "VETERANOS";
}

function prefijoFichaDesdeCategoriaClub(categoryName, birthdate) {
  const uMatch = categoryName.match(/U\s*(\d{1,2})/i);
  if (uMatch) return `U${uMatch[1]}`;

  const upper = categoryName.toUpperCase();
  for (const [keyword, code] of CLUB_CATEGORY_KEYWORDS) {
    if (upper.includes(keyword)) return code;
  }

  const firstWord = upper.split(/\s+/)[0]?.replace(/[^A-Z]/g, "") ?? "";
  if (firstWord.length >= 3) return firstWord.slice(0, 3);

  return FICHA_PREFIX_BY_CATEGORIA[calcularCategoria(birthdate)];
}

function generarNumeroFicha(categoryName, birthdate, numero, anio = new Date().getFullYear(), leaguePrefix = "IQ") {
  const prefix = prefijoFichaDesdeCategoriaClub(categoryName, birthdate);
  const city = leaguePrefix.trim().toUpperCase() || "IQ";
  return `${city}-${anio}-${prefix}-${numero.toString().padStart(4, "0")}`;
}

/** Sin URL externa: next/image solo permite Supabase Storage en next.config. */
function playerPhotoUrl() {
  return null;
}

async function ensureCarnetSequence(sql) {
  await sql`
    CREATE SEQUENCE IF NOT EXISTS public.carnet_deportista_seq
      START WITH 1001
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1
  `;
}

async function upsertClub(sql, leagueId) {
  const existing = await sql`
    SELECT id, name, slug FROM public.clubs WHERE slug = ${CLUB.slug} LIMIT 1
  `;

  if (existing[0]?.id) {
    console.log(`○ Club ya existe: ${existing[0].name} · ${existing[0].id}`);
    return existing[0].id;
  }

  const inserted = await sql`
    INSERT INTO public.clubs (
      league_id,
      name,
      slug,
      admin_email,
      admin_phone,
      color_primary,
      color_secondary,
      court_address,
      federation_code,
      district,
      province,
      region,
      active_plan
    )
    VALUES (
      ${leagueId},
      ${CLUB.name},
      ${CLUB.slug},
      ${CLUB.adminEmail},
      ${CLUB.adminPhone},
      ${CLUB.colorPrimary},
      ${CLUB.colorSecondary},
      ${CLUB.courtAddress},
      ${CLUB.federationCode},
      'Iquitos',
      'Maynas',
      'Loreto',
      true
    )
    RETURNING id, name
  `;

  console.log(`✓ Club creado: ${inserted[0].name} · ${inserted[0].id}`);
  return inserted[0].id;
}

async function upsertCategory(sql, leagueId, clubId, seed) {
  const existing = await sql`
    SELECT id, name FROM public.categories
    WHERE club_id = ${clubId} AND name = ${seed.name}
    LIMIT 1
  `;

  if (existing[0]?.id) {
    return existing[0].id;
  }

  const inserted = await sql`
    INSERT INTO public.categories (
      league_id,
      club_id,
      name,
      coach_name,
      coach_lastname
    )
    VALUES (
      ${leagueId},
      ${clubId},
      ${seed.name},
      ${seed.coachName},
      ${seed.coachLastname}
    )
    RETURNING id, name
  `;

  console.log(`  ✓ Categoría: ${inserted[0].name}`);
  return inserted[0].id;
}

async function upsertPlayer(sql, opts) {
  const {
    leagueId,
    clubId,
    categoryId,
    categoryName,
    player,
  } = opts;

  const birthdate = new Date(`${player.birthdate}T12:00:00`);
  const categoriaEnum = calcularCategoria(birthdate);
  const photoUrl = playerPhotoUrl();

  const existing = await sql`
    SELECT id, carnet_number FROM public.players
    WHERE league_id = ${leagueId}
      AND document_type = 'DNI'
      AND document_number = ${player.documentNumber}
    LIMIT 1
  `;

  if (existing[0]?.id) {
    await sql`
      UPDATE public.players SET
        club_id = ${clubId},
        category_id = ${categoryId},
        name = ${player.name},
        lastname = ${player.lastname},
        birthdate = ${birthdate},
        gender = ${player.gender},
        category = ${categoriaEnum}::public.categoria,
        jersey_number = ${player.jerseyNumber},
        photo_url = ${photoUrl},
        status = 'ACTIVO'::public.estado_jugador,
        updated_at = now()
      WHERE id = ${existing[0].id}
    `;
    return { id: existing[0].id, carnetNumber: existing[0].carnet_number, updated: true };
  }

  const seqRow = await sql`SELECT nextval('public.carnet_deportista_seq') AS n`;
  const seq = Number(seqRow[0].n);
  const carnetNumber = generarNumeroFicha(categoryName, birthdate, seq);

  const inserted = await sql`
    INSERT INTO public.players (
      league_id,
      club_id,
      category_id,
      name,
      lastname,
      document_type,
      document_number,
      birthdate,
      gender,
      category,
      jersey_number,
      photo_url,
      status,
      carnet_number
    )
    VALUES (
      ${leagueId},
      ${clubId},
      ${categoryId},
      ${player.name},
      ${player.lastname},
      'DNI',
      ${player.documentNumber},
      ${birthdate},
      ${player.gender}::public.genero,
      ${categoriaEnum}::public.categoria,
      ${player.jerseyNumber},
      ${photoUrl},
      'ACTIVO'::public.estado_jugador,
      ${carnetNumber}
    )
    RETURNING id, carnet_number
  `;

  return { id: inserted[0].id, carnetNumber: inserted[0].carnet_number, updated: false };
}

async function enrichLeagueSettingsForCarnet(sql, leagueId) {
  await sql`
    UPDATE public.league_settings SET
      carnet_validity_label = COALESCE(NULLIF(trim(carnet_validity_label), ''), '03/2026 - 03/2027'),
      president_display_name = COALESCE(NULLIF(trim(president_display_name), ''), 'Lic. Juan Pérez García'),
      secretary_display_name = COALESCE(NULLIF(trim(secretary_display_name), ''), 'Mg. Ana Rodríguez Silva'),
      carnet_authorization_template = COALESCE(
        NULLIF(trim(carnet_authorization_template), ''),
        'La {ligaNombre} certifica que el deportista está habilitado para participar en competencias oficiales.'
      ),
      updated_at = now()
    WHERE league_id = ${leagueId}
  `;
}

async function main() {
  const sql = await connectPostgres();

  try {
    const leagueRows = await sql`
      SELECT id, name, slug FROM public.leagues WHERE lower(slug) = ${LEAGUE_SLUG} LIMIT 1
    `;
    if (!leagueRows[0]) {
      throw new Error(`No existe la liga «${LEAGUE_SLUG}». Ejecuta: npm run db:seed:dev-league`);
    }
    const league = leagueRows[0];

    await ensureCarnetSequence(sql);
    console.log("✓ Secuencia carnet_deportista_seq lista");

    const clubId = await upsertClub(sql, league.id);
    await enrichLeagueSettingsForCarnet(sql, league.id);
    console.log("✓ league_settings enriquecido para carnets");

    const playerLinks = [];

    for (const catSeed of CATEGORY_SEEDS) {
      const categoryId = await upsertCategory(sql, league.id, clubId, catSeed);

      for (const player of catSeed.players) {
        const result = await upsertPlayer(sql, {
          leagueId: league.id,
          clubId,
          categoryId,
          categoryName: catSeed.name,
          player,
        });
        const action = result.updated ? "○ Jugador actualizado" : "  ✓ Jugador";
        console.log(`${action}: ${player.name} ${player.lastname} · carnet ${result.carnetNumber}`);
        playerLinks.push({
          name: `${player.name} ${player.lastname}`,
          carnet: result.carnetNumber,
          url: `/liga/clubs/${clubId}/categories/${categoryId}/players/${result.id}/carnet/`,
        });
      }
    }

    console.log("\n── Resumen DEV ──");
    console.log(`  Liga: ${league.name} (${league.slug})`);
    console.log(`  Club: ${CLUB.name} · ${clubId}`);
    console.log(`  Categorías: ${CATEGORY_SEEDS.length}`);
    console.log(`  Jugadores: ${playerLinks.length} (ACTIVO + carnet)`);
    console.log("\n── Carnets (tras login en localhost:3001) ──");
    for (const p of playerLinks) {
      console.log(`  ${p.name} [${p.carnet}]`);
      console.log(`    http://localhost:3001${p.url}`);
    }
    console.log("\nNota: preset lddbi_template requiere PNG en public/carnet/lddbi-template/.");
    console.log("      Si faltan, cambia a lddbi_bold en Configuración de liga.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
