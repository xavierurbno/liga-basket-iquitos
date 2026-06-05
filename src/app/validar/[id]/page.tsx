import { redirect } from "next/navigation";
import { ValidarJugadorCredencial } from "@/components/validar/ValidarJugadorCredencial";
import { ValidarPlantillaEquipo } from "@/components/validar/ValidarPlantillaEquipo";
import {
  loadCategoryRosterValidation,
  loadPlayerValidation,
} from "@/lib/loaders/validation.loader";
import { lineaCategoriaInstitucional } from "@/lib/utils/categoriaFicha";
import {
  formatCarnetNumberForLeague,
  resolveLeagueCarnetPrefix,
} from "@/lib/leagues/league-carnet-prefix";
import { resolvePublicImageUrl } from "@/lib/validar/resolve-public-image-url";
import {
  isLegacyValidationUuid,
  verifyEntityValidationToken,
} from "@/lib/validation/entity-validation-token";
import { logValidarView } from "@/lib/observability/pii-access-log";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Validar credencial",
};

function formatNow(): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date());
}

function resolveValidationTarget(segment: string): {
  entityId: string;
  lookup: "player" | "category";
} | null {
  const raw = decodeURIComponent(segment).trim();
  if (!raw) return null;

  const verified = verifyEntityValidationToken(raw);
  if (verified) {
    return {
      entityId: verified.entityId,
      lookup: verified.kind === "player" ? "player" : "category",
    };
  }

  if (isLegacyValidationUuid(raw)) {
    return { entityId: raw, lookup: "player" };
  }

  return null;
}

export default async function ValidarFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const target = resolveValidationTarget(id);
  if (!target) {
    await logValidarView({ tokenSegment: id, outcome: "invalid_token" });
    redirect("/");
  }

  const { entityId, lookup } = target;

  if (lookup === "player") {
    const jugador = await loadPlayerValidation(entityId);

    if (jugador) {
      const catLine = jugador.categoriaNombre
        ? lineaCategoriaInstitucional(jugador.categoriaNombre, [jugador.gender])
        : "—";
      const cityPrefix = resolveLeagueCarnetPrefix({
        slug: jugador.leagueSlug,
        name: jugador.leagueName,
      });
      const carnetDisplay = formatCarnetNumberForLeague(jugador.carnetNumber, cityPrefix);

      await logValidarView({
        tokenSegment: id,
        lookup,
        entityId,
        outcome: "found",
        playerStatus: jugador.status,
      });

      return (
        <main className="min-h-screen bg-linear-to-b from-slate-100 via-white to-slate-50 px-4 py-6 text-slate-900 sm:py-8">
          <ValidarJugadorCredencial
            leagueName={jugador.leagueName}
            clubName={jugador.clubName}
            categoriaNombre={catLine}
            playerName={`${jugador.lastname}, ${jugador.name}`}
            carnetDisplay={carnetDisplay}
            carnetNumber={jugador.carnetNumber}
            jerseyNumber={jugador.jerseyNumber}
            photoUrl={resolvePublicImageUrl(jugador.photoUrl)}
            status={jugador.status}
            verifiedAtLabel={formatNow()}
          />
        </main>
      );
    }
  }

  const plantilla = await loadCategoryRosterValidation(entityId);

  if (!plantilla) {
    await logValidarView({
      tokenSegment: id,
      lookup: lookup === "player" ? "category" : lookup,
      entityId,
      outcome: "not_found",
    });
    redirect("/");
  }

  await logValidarView({
    tokenSegment: id,
    lookup: "category",
    entityId,
    outcome: "found",
    rosterCount: plantilla.players.length,
  });

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-100 via-white to-slate-50 px-4 py-6 text-slate-900 sm:py-8">
      <ValidarPlantillaEquipo
        leagueName={plantilla.leagueName}
        clubName={plantilla.clubName}
        categoriaNombre={plantilla.categoriaDisplay}
        verifiedAtLabel={formatNow()}
        players={plantilla.players}
      />
    </main>
  );
}
