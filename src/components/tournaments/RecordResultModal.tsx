"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordMatchResult } from "@/lib/actions/tournaments";

export type TournamentMatchCard = {
  id: string;
  homeLabel: string;
  awayLabel: string;
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeQ1?: number | null;
  awayQ1?: number | null;
  homeQ2?: number | null;
  awayQ2?: number | null;
  homeQ3?: number | null;
  awayQ3?: number | null;
  homeQ4?: number | null;
  awayQ4?: number | null;
  homeOt?: number | null;
  awayOt?: number | null;
};

function qStr(v: number | null | undefined) {
  return v != null ? String(v) : "";
}

export function RecordResultModal({
  match,
  canManage,
  useQuarters = false,
}: {
  match: TournamentMatchCard;
  canManage: boolean;
  useQuarters?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [homeQ1, setHomeQ1] = useState("");
  const [awayQ1, setAwayQ1] = useState("");
  const [homeQ2, setHomeQ2] = useState("");
  const [awayQ2, setAwayQ2] = useState("");
  const [homeQ3, setHomeQ3] = useState("");
  const [awayQ3, setAwayQ3] = useState("");
  const [homeQ4, setHomeQ4] = useState("");
  const [awayQ4, setAwayQ4] = useState("");
  const [homeOt, setHomeOt] = useState("");
  const [awayOt, setAwayOt] = useState("");
  const [loading, setLoading] = useState(false);

  const isBye = match.homeLabel === "Descansa" || match.awayLabel === "Descansa";
  const isPending = match.homeLabel === "Por definir" || match.awayLabel === "Por definir";
  const hasResult = match.status === "finished" || match.status.startsWith("wo_");

  useEffect(() => setMounted(true), []);

  const loadFromMatch = () => {
    setHomeScore(match.homeScore != null ? String(match.homeScore) : "");
    setAwayScore(match.awayScore != null ? String(match.awayScore) : "");
    setHomeQ1(qStr(match.homeQ1));
    setAwayQ1(qStr(match.awayQ1));
    setHomeQ2(qStr(match.homeQ2));
    setAwayQ2(qStr(match.awayQ2));
    setHomeQ3(qStr(match.homeQ3));
    setAwayQ3(qStr(match.awayQ3));
    setHomeQ4(qStr(match.homeQ4));
    setAwayQ4(qStr(match.awayQ4));
    setHomeOt(qStr(match.homeOt));
    setAwayOt(qStr(match.awayOt));
  };

  if (!canManage || isBye || isPending) return null;

  const num = (s: string) => (s.trim() === "" ? undefined : Number(s));

  const submit = async (mode: "score" | "wo_home" | "wo_away" | "postpone") => {
    setLoading(true);
    const res = await recordMatchResult({
      matchId: match.id,
      mode,
      homeScore: mode === "score" ? Number(homeScore) : undefined,
      awayScore: mode === "score" ? Number(awayScore) : undefined,
      homeQ1: mode === "score" && useQuarters ? num(homeQ1) : undefined,
      awayQ1: mode === "score" && useQuarters ? num(awayQ1) : undefined,
      homeQ2: mode === "score" && useQuarters ? num(homeQ2) : undefined,
      awayQ2: mode === "score" && useQuarters ? num(awayQ2) : undefined,
      homeQ3: mode === "score" && useQuarters ? num(homeQ3) : undefined,
      awayQ3: mode === "score" && useQuarters ? num(awayQ3) : undefined,
      homeQ4: mode === "score" && useQuarters ? num(homeQ4) : undefined,
      awayQ4: mode === "score" && useQuarters ? num(awayQ4) : undefined,
      homeOt: mode === "score" && useQuarters ? num(homeOt) : undefined,
      awayOt: mode === "score" && useQuarters ? num(awayOt) : undefined,
    });
    setLoading(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Resultado guardado");
    setOpen(false);
    router.refresh();
  };

  const modal = (
    <ResultDialogOverlay onClose={() => !loading && setOpen(false)}>
      <h3 className="text-lg font-bold text-[#0f2040]">Resultado del partido</h3>
      <p className="mt-1 text-sm text-slate-600">
        {match.homeLabel} <span className="text-slate-400">vs</span> {match.awayLabel}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block text-xs font-medium text-slate-600">
          Local (total)
          <input
            type="number"
            min={0}
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Visitante (total)
          <input
            type="number"
            min={0}
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </div>

      {useQuarters && (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Acta por cuartos</p>
          <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-semibold text-slate-500">
            <span />
            <span>Q1</span>
            <span>Q2</span>
            <span>Q3</span>
            <span>Q4</span>
          </div>
          <div className="mt-1 grid grid-cols-5 gap-2 items-center">
            <span className="text-xs text-slate-600">Local</span>
            {[homeQ1, homeQ2, homeQ3, homeQ4].map((v, i) => (
              <input
                key={`h${i}`}
                type="number"
                min={0}
                value={[homeQ1, homeQ2, homeQ3, homeQ4][i]}
                onChange={(e) =>
                  [setHomeQ1, setHomeQ2, setHomeQ3, setHomeQ4][i](e.target.value)
                }
                className="w-full rounded border px-1 py-1 text-center text-xs"
              />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-5 gap-2 items-center">
            <span className="text-xs text-slate-600">Visit.</span>
            {[awayQ1, awayQ2, awayQ3, awayQ4].map((v, i) => (
              <input
                key={`a${i}`}
                type="number"
                min={0}
                value={[awayQ1, awayQ2, awayQ3, awayQ4][i]}
                onChange={(e) =>
                  [setAwayQ1, setAwayQ2, setAwayQ3, setAwayQ4][i](e.target.value)
                }
                className="w-full rounded border px-1 py-1 text-center text-xs"
              />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-600">
              OT local
              <input
                type="number"
                min={0}
                value={homeOt}
                onChange={(e) => setHomeOt(e.target.value)}
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              OT visitante
              <input
                type="number"
                min={0}
                value={awayOt}
                onChange={(e) => setAwayOt(e.target.value)}
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
              />
            </label>
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            Opcional: si completas cuartos, su suma + OT debe coincidir con el marcador total.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => submit("score")}
          className="w-full rounded-xl bg-[#F5A623] py-2.5 text-sm font-semibold text-[#1B3A6B] disabled:opacity-50"
        >
          Guardar marcador
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => submit("wo_home")}
            className="rounded-lg border border-slate-200 py-2 text-xs font-medium hover:bg-slate-50"
          >
            W.O. local
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => submit("wo_away")}
            className="rounded-lg border border-slate-200 py-2 text-xs font-medium hover:bg-slate-50"
          >
            W.O. visitante
          </button>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => submit("postpone")}
          className="text-xs text-slate-500 underline"
        >
          Aplazar partido
        </button>
      </div>
    </ResultDialogOverlay>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          loadFromMatch();
          setOpen(true);
        }}
        className="rounded-lg bg-[#1B3A6B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0f2444]"
      >
        {hasResult ? "Editar resultado" : "Cargar resultado"}
      </button>
      {mounted && open && createPortal(modal, document.body)}
    </>
  );
}

function ResultDialogOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <ResultDialogPanel onClick={(e) => e.stopPropagation()}>{children}</ResultDialogPanel>
    </div>
  );
}

function QuarterRow({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: Array<(v: string) => void>;
}) {
  return (
    <div className="mt-1 grid grid-cols-5 gap-2 items-center">
      <span className="text-xs text-slate-600">{label}</span>
      {values.map((v, i) => (
        <input
          key={`${label}-q${i}`}
          type="number"
          min={0}
          value={v}
          onChange={(e) => onChange[i](e.target.value)}
          className="w-full rounded border px-1 py-1 text-center text-xs"
        />
      ))}
    </div>
  );
}

function ResultDialogPanel({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      onClick={onClick}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}

