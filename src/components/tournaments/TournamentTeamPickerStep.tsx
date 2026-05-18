"use client";

import { useEffect, useMemo, useState } from "react";
import type { CategoryPickOption } from "@/lib/tournaments/queries";

function buildCategoryFilters(teams: CategoryPickOption[]) {
  const counts = new Map<string, number>();
  for (const t of teams) {
    counts.set(t.name, (counts.get(t.name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, teamCount]) => ({ name, teamCount }))
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
}

type Props = {
  teams: CategoryPickOption[];
  selected: string[];
  onToggle: (id: string) => void;
  onSelectMany: (ids: string[], selected: boolean) => void;
  matchEstimate: number;
  isGroupsFormat: boolean;
  numberOfGroups: number;
};

export function TournamentTeamPickerStep({
  teams,
  selected,
  onToggle,
  onSelectMany,
  matchEstimate,
  isGroupsFormat,
  numberOfGroups,
}: Props) {
  const categoryFilters = useMemo(() => buildCategoryFilters(teams), [teams]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [clubSearch, setClubSearch] = useState("");

  useEffect(() => {
    if (categoryFilters.length === 0) {
      setActiveCategory("");
      return;
    }
    setActiveCategory((prev) =>
      prev && categoryFilters.some((c) => c.name === prev) ? prev : categoryFilters[0].name
    );
  }, [categoryFilters]);

  const teamsInCategory = useMemo(() => {
    if (!activeCategory) return [];
    return teams
      .filter((t) => t.name === activeCategory)
      .sort((a, b) => a.clubName.localeCompare(b.clubName, "es", { sensitivity: "base" }));
  }, [teams, activeCategory]);

  const filteredTeams = useMemo(() => {
    const q = clubSearch.trim().toLowerCase();
    if (!q) return teamsInCategory;
    return teamsInCategory.filter((t) => t.clubName.toLowerCase().includes(q));
  }, [teamsInCategory, clubSearch]);

  const selectedInCategory = useMemo(
    () => teamsInCategory.filter((t) => selected.includes(t.id)).length,
    [teamsInCategory, selected]
  );

  const allInCategorySelected =
    teamsInCategory.length > 0 && teamsInCategory.every((t) => selected.includes(t.id));

  const toggleAllInCategory = () => {
    const ids = teamsInCategory.map((t) => t.id);
    onSelectMany(ids, !allInCategorySelected);
  };

  const onCategoryChange = (value: string) => {
    setActiveCategory(value);
    setClubSearch("");
  };

  if (teams.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        No hay categorías en la liga. Crea clubes y categorías primero.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF]/60 px-4 py-3">
        <p className="text-sm font-semibold text-[#0f2040]">
          {selected.length} equipos seleccionados · ~{matchEstimate} partidos estimados
          {isGroupsFormat && ` · ${numberOfGroups} grupos`}
        </p>
        {selected.length % 2 !== 0 && selected.length > 0 && !isGroupsFormat && (
          <p className="mt-1 text-xs text-amber-800">
            Número impar: se programará un descanso (bye) por jornada.
          </p>
        )}
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Categoría</span>
        <p className="mt-0.5 text-xs text-slate-500">
          Elige la categoría del torneo; debajo verás todos los equipos (clubes) registrados en
          ella.
        </p>
        <select
          value={activeCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="mt-2 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 bg-size-[1rem] bg-position-[right_0.75rem_center] bg-no-repeat px-4 py-2.5 pr-10 text-sm font-medium text-[#0f2040] focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/15"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231B3A6B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
          }}
        >
          {categoryFilters.map((cat) => {
            const selectedCount = teams.filter(
              (t) => t.name === cat.name && selected.includes(t.id)
            ).length;
            return (
              <option key={cat.name} value={cat.name}>
                {cat.name} — {cat.teamCount} equipo{cat.teamCount === 1 ? "" : "s"}
                {selectedCount > 0 ? ` · ${selectedCount} seleccionado${selectedCount === 1 ? "" : "s"}` : ""}
              </option>
            );
          })}
        </select>
      </label>

      {activeCategory && (
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-[#0f2040]">{selectedInCategory}</span> de{" "}
                {teamsInCategory.length} equipos seleccionados en esta categoría
              </p>
              {teamsInCategory.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAllInCategory}
                  className="shrink-0 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5 text-xs font-semibold text-[#1B3A6B] hover:bg-[#DBEAFE]"
                >
                  {allInCategorySelected ? "Quitar todos" : "Seleccionar todos"}
                </button>
              )}
            </div>
            {teamsInCategory.length > 4 && (
              <input
                value={clubSearch}
                onChange={(e) => setClubSearch(e.target.value)}
                placeholder="Buscar club…"
                className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/10"
              />
            )}
          </div>

          <ul className="max-h-72 space-y-1 overflow-y-auto p-2">
            {filteredTeams.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-500">
                {clubSearch.trim()
                  ? "Ningún club coincide con la búsqueda."
                  : "No hay equipos registrados en esta categoría."}
              </li>
            ) : (
              filteredTeams.map((t) => {
                const on = selected.includes(t.id);
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => onToggle(t.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        on
                          ? "border-[#1B3A6B] bg-[#1B3A6B]/5"
                          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                          on
                            ? "border-[#1B3A6B] bg-[#1B3A6B] text-white"
                            : "border-slate-300 bg-white text-transparent"
                        }`}
                        aria-hidden
                      >
                        ✓
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900">
                          {t.clubName}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
