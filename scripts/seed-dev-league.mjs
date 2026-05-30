/**
 * Crea liga de prueba LDDBI en Supabase DEV (idempotente).
 *
 * Uso: npm run db:seed:dev-league
 */
import { loadAppEnv } from "./load-env.mjs";
import { assertSafeMigrationTarget } from "./assert-db-target.mjs";
import { connectPostgres } from "./connect-postgres.mjs";

loadAppEnv("development");
assertSafeMigrationTarget({ target: "development" });

const LEAGUE = {
  name: "Liga Deportiva de Baloncesto de Iquitos",
  slug: "lddbi",
  seasonName: "Temporada 2026",
};

async function main() {
  const sql = await connectPostgres();

  try {
    const existing = await sql`
      SELECT id, name, slug FROM public.leagues WHERE lower(slug) = ${LEAGUE.slug} LIMIT 1
    `;

    let leagueId = existing[0]?.id;

    if (leagueId) {
      console.log(`○ Liga ya existe: ${existing[0].name} (${LEAGUE.slug}) · ${leagueId}`);
    } else {
      const inserted = await sql`
        INSERT INTO public.leagues (name, slug)
        VALUES (${LEAGUE.name}, ${LEAGUE.slug})
        RETURNING id, name, slug
      `;
      leagueId = inserted[0].id;
      console.log(`✓ Liga creada: ${inserted[0].name} (${inserted[0].slug}) · ${leagueId}`);
    }

    await sql`
      INSERT INTO public.league_settings (
        league_id,
        season_name,
        carnet_theme_preset,
        carnet_show_federation,
        carnet_federation_display_name,
        carnet_sport_label,
        portal_primary_color,
        portal_accent_color,
        banner_text,
        updated_at
      )
      VALUES (
        ${leagueId},
        ${LEAGUE.seasonName},
        'lddbi_template',
        true,
        'FEDERACIÓN DEPORTIVA PERUANA DE BASKETBALL',
        'BÁSQUET',
        '#1e3a5f',
        '#0d9488',
        'Liga de Baloncesto de Iquitos — entorno DEV',
        now()
      )
      ON CONFLICT (league_id) DO UPDATE SET
        season_name = EXCLUDED.season_name,
        carnet_theme_preset = EXCLUDED.carnet_theme_preset,
        carnet_show_federation = EXCLUDED.carnet_show_federation,
        carnet_federation_display_name = EXCLUDED.carnet_federation_display_name,
        carnet_sport_label = EXCLUDED.carnet_sport_label,
        portal_primary_color = EXCLUDED.portal_primary_color,
        portal_accent_color = EXCLUDED.portal_accent_color,
        banner_text = EXCLUDED.banner_text,
        updated_at = now()
    `;

    console.log("✓ league_settings configurado (lddbi_template)");

    const masterEmail = process.env.MASTER_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    if (masterEmail) {
      const updated = await sql`
        UPDATE auth.users
        SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
          || jsonb_build_object('active_league_id', ${leagueId}::text)
        WHERE lower(email) = ${masterEmail}
        RETURNING id, email
      `;
      if (updated[0]) {
        console.log(`✓ JWT active_league_id → ${masterEmail} (cierra sesión y vuelve a entrar)`);
      }
    }

    console.log("\n── Accesos sugeridos ──");
    console.log(`  Portal: http://localhost:3001/l/${LEAGUE.slug}/`);
    console.log(`  Intranet: http://localhost:3001/liga/`);
    console.log(`  Super admin: elige «${LEAGUE.name}» en «Liga activa» (barra superior)`);
    console.log(`  League ID: ${leagueId}`);
    console.log("\nOpcional en .env.local:");
    console.log(`  NEXT_PUBLIC_DEFAULT_LEAGUE_ID=${leagueId}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
