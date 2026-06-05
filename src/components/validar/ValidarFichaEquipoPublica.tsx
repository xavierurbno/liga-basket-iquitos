"use client";

import { useMemo, useState } from "react";
import { FichaVistaPrevia } from "@/components/ficha/FichaVistaPrevia";
import type { FichaVistaPreviaProps } from "@/lib/types/ficha";
import type { PlayerStatus } from "@/lib/db/schema";
import {
  resolvePlayerValidationStatus,
} from "@/lib/validation/player-validation-status";
import { ValidationLiveChrome } from "@/components/validar/ValidationLiveChrome";

export type ValidarFichaEquipoPublicaProps = {
  ficha: FichaVistaPreviaProps;
  estadosPorJugador: Record<string, PlayerStatus | null | undefined>;
  verifiedAtLabel: string;
  leagueName?: string | null;
  accentColor?: string;
};

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function matchesSearch(
  player: FichaVistaPreviaProps["players"][number],
  query: string,
): boolean {
  if (!query) return true;
  const q = normalizeSearch(query);
  const name = normalizeSearch(`${player.lastname} ${player.name}`);
  if (name.includes(q)) return true;
  if (player.jerseyNumber != null && String(player.jerseyNumber).includes(q)) return true;
  return false;
}

export function ValidarFichaEquipoPublica({
  ficha,
  estadosPorJugador,
  verifiedAtLabel,
  leagueName,
  accentColor,
}: ValidarFichaEquipoPublicaProps) {
  const [search, setSearch] = useState("");

  const resumen = useMemo(() => {
    let habilitado = 0;
    let suspendido = 0;
    let noHabilitado = 0;
    for (const p of ficha.players) {
      const tone = resolvePlayerValidationStatus(estadosPorJugador[p.id]).tone;
      if (tone === "habilitado") habilitado += 1;
      else if (tone === "suspendido") suspendido += 1;
      else noHabilitado += 1;
    }
    return { habilitado, suspendido, noHabilitado, total: ficha.players.length };
  }, [ficha.players, estadosPorJugador]);

  const resaltarJugadorIds = useMemo(() => {
    if (!search.trim()) return ficha.players.map((p) => p.id);
    return ficha.players.filter((p) => matchesSearch(p, search)).map((p) => p.id);
  }, [ficha.players, search]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <ValidationLiveChrome
        mode="equipo"
        verifiedAtLabel={verifiedAtLabel}
        leagueName={leagueName}
        accentColor={accentColor}
        resumen={resumen}
        search={search}
        onSearchChange={setSearch}
      />

      <p className="text-center text-[10px] font-medium uppercase tracking-wide text-slate-400 md:hidden">
        Desliza la tabla para ver todas las columnas
      </p>

      <div className="shadow-2xl ring-1 ring-slate-200/80">
        <FichaVistaPrevia
          {...ficha}
          variant="validacion"
          estadosPorJugador={estadosPorJugador}
          resaltarJugadorIds={resaltarJugadorIds}
        />
      </div>
    </div>
  );
}
