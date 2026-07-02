"use client";

import { useState, useTransition } from "react";
import {
  anonymizePlayerArcoAction,
  exportPlayerArcoAction,
  type PlayerArcoActionState,
} from "@/lib/actions/player-arco.actions";

type Props = {
  playerId: string;
  clubId: string;
  categoryId: string;
  playerLabel: string;
};

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function PlayerArcoActions({ playerId, clubId, categoryId, playerLabel }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  function handleResult(result: PlayerArcoActionState) {
    if (!result.success) {
      setError(result.error);
      setMessage(null);
      return;
    }
    setError(null);
    if (result.export) {
      const stamp = new Date().toISOString().slice(0, 10);
      downloadJson(`arco-export-${playerId.slice(0, 8)}-${stamp}.json`, result.export);
      setMessage("Exportación ARCO descargada.");
    } else if (result.message) {
      setMessage(result.message);
      setShowConfirm(false);
      setConfirmText("");
    }
  }

  function runExport() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("playerId", playerId);
      fd.set("clubId", clubId);
      fd.set("categoryId", categoryId);
      const result = await exportPlayerArcoAction(fd);
      handleResult(result);
    });
  }

  function runAnonymize() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("playerId", playerId);
      fd.set("clubId", clubId);
      fd.set("categoryId", categoryId);
      fd.set("confirm", confirmText);
      const result = await anonymizePlayerArcoAction(fd);
      handleResult(result);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={pending}
          onClick={runExport}
          className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800 hover:bg-violet-100 disabled:opacity-50"
          title="Derecho de acceso ARCO (Ley 29733)"
        >
          Exportar ARCO
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setShowConfirm((v) => !v);
            setError(null);
            setMessage(null);
          }}
          className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
          title="Cancelación / anonimización ARCO"
        >
          Anonimizar ARCO
        </button>
      </div>

      {showConfirm && (
        <div className="mt-1 max-w-xs rounded-lg border border-amber-200 bg-amber-50/80 p-2 text-xs text-amber-950">
          <p className="mb-2 font-medium">
            Anonimizar a {playerLabel}. Esta acción no se puede deshacer.
          </p>
          <label className="mb-2 block">
            Escribe <strong>ANONIMIZAR</strong> para confirmar:
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-1 w-full rounded border border-amber-300 px-2 py-1 text-xs"
              autoComplete="off"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || confirmText !== "ANONIMIZAR"}
              onClick={runAnonymize}
              className="rounded bg-amber-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-40"
            >
              Confirmar anonimización
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setShowConfirm(false);
                setConfirmText("");
                setError(null);
              }}
              className="rounded border border-amber-300 bg-white px-2 py-1 text-xs font-semibold text-amber-900"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {message && <p className="text-[10px] text-emerald-700">{message}</p>}
      {error && <p className="text-[10px] text-red-700">{error}</p>}
    </div>
  );
}
