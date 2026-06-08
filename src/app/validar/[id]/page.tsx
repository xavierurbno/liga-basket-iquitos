import { redirect } from "next/navigation";
import { ValidarCarnetPublico } from "@/components/validar/ValidarCarnetPublico";
import { ValidarFichaEquipoPublica } from "@/components/validar/ValidarFichaEquipoPublica";
import {
  loadCategoryFichaValidation,
  loadPlayerCarnetValidation,
} from "@/lib/validar/build-validation-presentation.server";
import { logValidarView } from "@/lib/observability/pii-access-log";
import {
  verifyEntityValidationToken,
} from "@/lib/validation/entity-validation-token";

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
  const verifiedAtLabel = formatNow();

  if (lookup === "player") {
    const loaded = await loadPlayerCarnetValidation(entityId);

    if (loaded) {
      await logValidarView({
        tokenSegment: id,
        lookup,
        entityId,
        outcome: "found",
        playerStatus: loaded.status,
      });

      return (
        <main className="min-h-screen bg-linear-to-b from-slate-100 via-white to-slate-50 px-4 py-6 text-slate-900 sm:py-8">
          <ValidarCarnetPublico
            carnetProps={loaded.carnetProps}
            status={loaded.status}
            verifiedAtLabel={verifiedAtLabel}
            leagueName={loaded.leagueName}
            accentColor={loaded.accentColor}
          />
        </main>
      );
    }
  }

  const plantilla = await loadCategoryFichaValidation(entityId);

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
    rosterCount: plantilla.ficha.players.length,
  });

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-100 via-white to-slate-50 px-4 py-6 text-slate-900 sm:py-8">
      <ValidarFichaEquipoPublica
        ficha={plantilla.ficha}
        estadosPorJugador={plantilla.estadosPorJugador}
        verifiedAtLabel={verifiedAtLabel}
        leagueName={plantilla.leagueName}
        accentColor={plantilla.accentColor}
      />
    </main>
  );
}
