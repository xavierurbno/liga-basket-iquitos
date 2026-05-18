/** Escudo del club (solo si existe `logo_url` en el club). */
export function ClubMatchLogo({ url, label }: { url: string | null | undefined; label: string }) {
  if (!url?.trim()) return null;
  return (
    <img
      src={url}
      alt=""
      className="h-7 w-7 shrink-0 rounded-full border border-slate-200 bg-white object-contain p-0.5"
      loading="lazy"
      title={label}
    />
  );
}

type Props = {
  homeLabel: string;
  awayLabel: string;
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
  className?: string;
};

export function StandingsTeamCell({
  clubName,
  categoryName,
  clubLogoUrl,
}: {
  clubName: string;
  categoryName: string;
  clubLogoUrl?: string | null;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <ClubMatchLogo url={clubLogoUrl} label={clubName} />
      <span className="min-w-0">
        <span className="font-medium">{clubName}</span>
        <span className="text-slate-500"> · {categoryName}</span>
      </span>
    </span>
  );
}

export function TournamentMatchTeams({
  homeLabel,
  awayLabel,
  homeLogoUrl,
  awayLogoUrl,
  className = "",
}: Props) {
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-[#0f2040] ${className}`.trim()}>
      <span className="inline-flex min-w-0 items-center gap-2">
        <ClubMatchLogo url={homeLogoUrl} label={homeLabel} />
        <span className="min-w-0">{homeLabel}</span>
      </span>
      <span className="font-normal text-slate-400">vs</span>
      <span className="inline-flex min-w-0 items-center gap-2">
        <ClubMatchLogo url={awayLogoUrl} label={awayLabel} />
        <span className="min-w-0">{awayLabel}</span>
      </span>
    </p>
  );
}
