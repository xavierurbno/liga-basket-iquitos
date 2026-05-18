"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { createTournamentWithFixture } from "@/lib/actions/tournaments";
import {
  estimateGroupsMatchCount,
  estimateMatchCount,
} from "@/lib/tournaments/fixture-generator";
import type { CategoryPickOption } from "@/lib/tournaments/queries";
import { TournamentTeamPickerStep } from "@/components/tournaments/TournamentTeamPickerStep";
import { tournamentHubHref } from "@/lib/tournaments/tournament-hub-params";

type Format = "linear" | "home_and_away" | "groups" | "groups_playoffs";

const FORMAT_OPTIONS: {
  value: Format;
  title: string;
  description: string;
}[] = [
  {
    value: "linear",
    title: "Todos contra todos (una vez)",
    description: "Cada equipo juega una vez contra los demás. Ideal para copas cortas.",
  },
  {
    value: "home_and_away",
    title: "Todos contra todos (ida y vuelta)",
    description: "Local y visitante. Para temporadas más largas.",
  },
  {
    value: "groups",
    title: "Fase de grupos",
    description: "Varios grupos con round robin en cada uno. Mínimo 2 equipos por grupo.",
  },
  {
    value: "groups_playoffs",
    title: "Grupos + play-offs",
    description:
      "Fase de grupos y luego llave de eliminación (generas la llave cuando cierres la fase regular).",
  },
];

export function TournamentWizard({ teams }: { teams: CategoryPickOption[] }) {
  const router = useRouter();
  const isGroupsFormat = (f: Format) => f === "groups" || f === "groups_playoffs";
  const totalSteps = (f: Format) => (isGroupsFormat(f) ? 4 : 3);

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<Format>("linear");
  const [selected, setSelected] = useState<string[]>([]);
  const [numberOfGroups, setNumberOfGroups] = useState(2);
  const [shuffleGroups, setShuffleGroups] = useState(false);
  const [teamsPerGroupToAdvance, setTeamsPerGroupToAdvance] = useState(2);
  const [thirdPlaceMatch, setThirdPlaceMatch] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pointsWin, setPointsWin] = useState(2);
  const [pointsLoss, setPointsLoss] = useState(1);
  const [pointsWo, setPointsWo] = useState(2);
  const [rulesNote, setRulesNote] = useState("");
  const [useQuarters, setUseQuarters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = totalSteps(format);
  const groupsStep = isGroupsFormat(format) ? 3 : -1;
  const confirmStep = steps;

  const matchEstimate = useMemo(() => {
    if (format === "groups" || format === "groups_playoffs") {
      return estimateGroupsMatchCount(selected.length, numberOfGroups, shuffleGroups);
    }
    return estimateMatchCount(
      selected.length,
      format === "home_and_away" ? "home_and_away" : "linear"
    );
  }, [format, selected.length, numberOfGroups, shuffleGroups]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setError(null);
  };

  const selectMany = (ids: string[], add: boolean) => {
    setSelected((prev) => {
      if (add) {
        const next = new Set([...prev, ...ids]);
        return [...next];
      }
      const remove = new Set(ids);
      return prev.filter((id) => !remove.has(id));
    });
    setError(null);
  };

  const validateStep = useCallback(
    (s: number) => {
      if (s === 1 && !name.trim()) {
        setError("El nombre del torneo es obligatorio.");
        return false;
      }
      if (s === 2) {
        if (selected.length < 2) {
          setError("Selecciona al menos 2 equipos.");
          return false;
        }
        if (isGroupsFormat(format) && selected.length < numberOfGroups * 2) {
          setError(
            `Para ${numberOfGroups} grupos necesitas al menos ${numberOfGroups * 2} equipos.`
          );
          return false;
        }
      }
      setError(null);
      return true;
    },
    [name, selected.length, format, numberOfGroups]
  );

  const formatSummary = () => {
    if (format === "groups_playoffs") {
      return `Grupos (${numberOfGroups}) + play-offs · ${teamsPerGroupToAdvance} clasifican/grupo`;
    }
    if (format === "groups") return `Fase de grupos (${numberOfGroups})`;
    if (format === "home_and_away") return "Ida y vuelta";
    return "Una rueda";
  };

  const onSubmit = async () => {
    if (!validateStep(confirmStep)) return;
    setLoading(true);
    const res = await createTournamentWithFixture({
      name: name.trim(),
      format,
      categoryIds: selected,
      numberOfGroups: isGroupsFormat(format) ? numberOfGroups : undefined,
      shuffleGroups: isGroupsFormat(format) ? shuffleGroups : undefined,
      teamsPerGroupToAdvance:
        format === "groups_playoffs" ? teamsPerGroupToAdvance : undefined,
      thirdPlaceMatch: format === "groups_playoffs" ? thirdPlaceMatch : undefined,
      pointsWin: showAdvanced ? pointsWin : undefined,
      pointsLoss: showAdvanced ? pointsLoss : undefined,
      pointsWalkover: showAdvanced ? pointsWo : undefined,
      rulesNote: showAdvanced ? rulesNote : undefined,
      useQuarters: showAdvanced && useQuarters ? true : undefined,
    });
    setLoading(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Torneo creado con calendario generado");
    router.push(tournamentHubHref(res.tournamentId!, "config"));
    router.refresh();
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, steps));
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 1));
    setError(null);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/liga/torneos/" className="text-xs font-medium text-[#1B3A6B] hover:underline">
            ← Torneos
          </Link>
          <h1 className="mt-1 text-2xl font-black text-[#0f2040]">Nuevo torneo</h1>
        </div>
        <p className="text-sm text-slate-500">
          Paso {step} de {steps}
        </p>
      </div>

      <div className="rounded-2xl border border-[#BFDBFE] bg-white p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-5">
            <label className="block text-sm font-semibold text-slate-700">
              Nombre del torneo
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Copa Distrital 2026"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/15"
              />
            </label>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Formato</p>
              <FormatList format={format} onSelect={setFormat} />
            </div>
          </div>
        )}

        {step === 2 && (
          <TournamentTeamPickerStep
            teams={teams}
            selected={selected}
            onToggle={toggle}
            onSelectMany={selectMany}
            matchEstimate={matchEstimate}
            isGroupsFormat={isGroupsFormat(format)}
            numberOfGroups={numberOfGroups}
          />
        )}

        {step === groupsStep && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Número de grupos</p>
              <div className="flex gap-2">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNumberOfGroups(n)}
                    className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${
                      numberOfGroups === n
                        ? "border-[#1B3A6B] bg-[#1B3A6B]/5 text-[#1B3A6B]"
                        : "border-slate-200 text-slate-600 hover:border-[#1B3A6B]/30"
                    }`}
                  >
                    {n} grupos
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Reparto serpentina · mínimo {numberOfGroups * 2} equipos (tienes {selected.length})
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <input
                type="checkbox"
                checked={shuffleGroups}
                onChange={(e) => setShuffleGroups(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#1B3A6B]"
              />
              <span className="text-sm text-slate-700">
                Sorteo aleatorio antes del reparto en grupos
              </span>
            </label>
            {format === "groups_playoffs" && (
              <div className="space-y-3 rounded-xl border border-slate-100 p-4">
                <p className="text-sm font-semibold text-slate-700">Play-offs</p>
                <label className="block text-xs text-slate-600">
                  Clasificados por grupo
                  <select
                    value={teamsPerGroupToAdvance}
                    onChange={(e) => setTeamsPerGroupToAdvance(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
                  >
                    <option value={1}>1 equipo</option>
                    <option value={2}>2 equipos</option>
                  </select>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={thirdPlaceMatch}
                    onChange={(e) => setThirdPlaceMatch(e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  Partido por el 3.er puesto
                </label>
              </div>
            )}
            <p className="text-xs text-slate-500">~{matchEstimate} partidos en fase de grupos</p>
          </div>
        )}

        {step === confirmStep && (
          <div className="space-y-4">
            <div className="rounded-xl bg-linear-to-br from-[#1B3A6B] to-[#0f2444] p-5 text-white">
              <p className="text-xs uppercase tracking-widest text-blue-200">Resumen</p>
              <h2 className="text-xl font-bold">{name}</h2>
              <p className="mt-1 text-sm text-blue-100">
                {formatSummary()} · {selected.length} equipos · ~{matchEstimate} partidos
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Personalizar reglas (opcional)
              <span>{showAdvanced ? "▲" : "▼"}</span>
            </button>
            {showAdvanced && (
              <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-100 p-4">
                <label className="text-xs text-slate-600">
                  Pts victoria
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={pointsWin}
                    onChange={(e) => setPointsWin(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                  />
                </label>
                <label className="text-xs text-slate-600">
                  Pts derrota
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={pointsLoss}
                    onChange={(e) => setPointsLoss(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                  />
                </label>
                <label className="text-xs text-slate-600">
                  Pts W.O.
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={pointsWo}
                    onChange={(e) => setPointsWo(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                  />
                </label>
                <label className="col-span-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={useQuarters}
                    onChange={(e) => setUseQuarters(e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  Registrar marcador por cuartos en el acta
                </label>
                <label className="col-span-3 text-xs text-slate-600">
                  Notas del reglamento
                  <textarea
                    value={rulesNote}
                    onChange={(e) => setRulesNote(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium"
            >
              Atrás
            </button>
          ) : (
            <Link
              href="/liga/torneos/"
              className="rounded-xl px-4 py-2 text-sm text-slate-500"
            >
              Cancelar
            </Link>
          )}
          <WizardSpacer />
          {step < confirmStep ? (
            <button
              type="button"
              onClick={goNext}
              className="ml-auto rounded-xl bg-[#1B3A6B] px-6 py-2 text-sm font-semibold text-white"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={onSubmit}
              className="ml-auto rounded-xl bg-[#F5A623] px-6 py-2 text-sm font-semibold text-[#1B3A6B] disabled:opacity-50"
            >
              {loading ? "Creando…" : "Crear y generar calendario"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FormatList({
  format,
  onSelect,
}: {
  format: Format;
  onSelect: (f: Format) => void;
}) {
  return (
    <div className="space-y-2">
      {FORMAT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value)}
          className={`w-full rounded-xl border-2 p-4 text-left transition-colors ${
            format === opt.value
              ? "border-[#1B3A6B] bg-[#1B3A6B]/5"
              : "border-slate-200 hover:border-[#1B3A6B]/30"
          }`}
        >
          <p className="font-semibold text-[#0f2040]">{opt.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">{opt.description}</p>
        </button>
      ))}
    </div>
  );
}

function WizardSpacer() {
  return <div className="flex-1" />;
}
