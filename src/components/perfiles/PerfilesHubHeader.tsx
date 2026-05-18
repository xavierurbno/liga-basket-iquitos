"use client";

import { UserPlus } from "lucide-react";
import { ManageProfileModal } from "./ManageProfileModal";

export type DelegateClubPickerOption = {
  id: string;
  name: string;
  slug: string;
};

type PerfilesHubHeaderProps = {
  canInviteStaff: boolean;
  clubOptions: DelegateClubPickerOption[];
  defaultLeagueId?: string | null;
  leagueName?: string | null;
  actorRole?: string;
};

export function PerfilesHubHeader({
  canInviteStaff,
  clubOptions,
  defaultLeagueId,
  leagueName,
  actorRole,
}: PerfilesHubHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-black tracking-tight text-[#0f2040] md:text-3xl">Perfiles</h1>
      {canInviteStaff ? (
        <ManageProfileModal
          clubOptions={clubOptions}
          defaultLeagueId={defaultLeagueId}
          leagueName={leagueName}
          actorRole={actorRole}
          renderTrigger={(open) => (
            <button
              type="button"
              onClick={open}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold tracking-wide text-primary-foreground shadow-[0_10px_20px_-10px_rgba(0,92,238,0.7)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CEE]"
            >
              <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
              Añadir al Personal
            </button>
          )}
        />
      ) : null}
    </div>
  );
}
