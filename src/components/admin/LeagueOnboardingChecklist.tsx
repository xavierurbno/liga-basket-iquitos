import Link from "next/link";
import { Check, Circle } from "lucide-react";
import {
  buildLeagueOnboardingChecklist,
  checklistProgress,
  type LeagueOnboardingChecklistItem,
} from "@/lib/leagues/league-onboarding-checklist";

export function LeagueOnboardingChecklist({
  slug,
  adminCount,
  clubCount,
  seasonName,
  loginLogoUrl,
  presidentSignatureUrl,
  secretarySignatureUrl,
  carnetValidityLabel,
  carnetSignatureMode,
  carnetShowFederation,
  carnetThemePreset,
  documentSerialPrefix,
  portalPrimaryColor,
  transferPeriodEnd,
  isManualOverride,
}: {
  slug: string;
  adminCount: number;
  clubCount: number;
  seasonName?: string | null;
  loginLogoUrl?: string | null;
  presidentSignatureUrl?: string | null;
  secretarySignatureUrl?: string | null;
  carnetValidityLabel?: string | null;
  carnetSignatureMode?: string | null;
  carnetShowFederation?: boolean | null;
  carnetThemePreset?: string | null;
  documentSerialPrefix?: string | null;
  portalPrimaryColor?: string | null;
  transferPeriodEnd?: Date | string | null;
  isManualOverride?: boolean | null;
}) {
  const items = buildLeagueOnboardingChecklist({
    slug,
    adminCount,
    clubCount,
    seasonName,
    loginLogoUrl,
    presidentSignatureUrl,
    secretarySignatureUrl,
    carnetValidityLabel,
    carnetSignatureMode,
    carnetShowFederation,
    carnetThemePreset,
    documentSerialPrefix,
    portalPrimaryColor,
    transferPeriodEnd,
    isManualOverride,
  });
  const progress = checklistProgress(items);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900">Checklist de puesta en marcha</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {progress.done} de {progress.total} completados ({progress.percent}%)
          </p>
        </div>
        <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <ChecklistRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

function ChecklistRow({ item }: { item: LeagueOnboardingChecklistItem }) {
  const Icon = item.done ? Check : Circle;
  const iconClass = item.done
    ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : "text-slate-300 bg-slate-50 border-slate-200";

  const content = (
    <>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${iconClass}`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-800">{item.label}</span>
        {item.hint ? (
          <span className="mt-0.5 block text-xs font-medium text-slate-500">{item.hint}</span>
        ) : null}
      </span>
    </>
  );

  if (item.href) {
    return (
      <li>
        <Link
          href={item.href}
          target={item.href.startsWith("/l/") ? "_blank" : undefined}
          rel={item.href.startsWith("/l/") ? "noopener noreferrer" : undefined}
          className="flex items-start gap-3 rounded-2xl border border-transparent px-2 py-2 transition hover:border-slate-100 hover:bg-slate-50"
          scroll={item.href.startsWith("#")}
        >
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 rounded-2xl px-2 py-2">
      {content}
    </li>
  );
}
