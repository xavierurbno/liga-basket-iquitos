import {
  carnetSignatureModeRequiresPresident,
  carnetSignatureModeRequiresSecretary,
  parseCarnetSignatureMode,
} from "@/lib/carnet/carnetSignatureMode";
import { leaguePortalHome } from "@/lib/portal/league-portal-paths";

const FICHA_COPY_LINK_HASH = "#league-public-link";

export type LeagueOnboardingChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href?: string;
  hint?: string;
};

export function buildLeagueOnboardingChecklist(input: {
  slug: string;
  adminCount: number;
  clubCount: number;
  seasonName?: string | null;
  loginLogoUrl?: string | null;
  presidentSignatureUrl?: string | null;
  secretarySignatureUrl?: string | null;
  carnetValidityLabel?: string | null;
  carnetSignatureMode?: string | null;
}): LeagueOnboardingChecklistItem[] {
  const signatureMode = parseCarnetSignatureMode(input.carnetSignatureMode);
  const portalHref = leaguePortalHome(input.slug);
  const seasonOk = Boolean(input.seasonName?.trim());
  const logoOk = Boolean(input.loginLogoUrl?.trim());

  return [
    {
      id: "copy-link",
      label: "Copiar enlace público",
      done: true,
      href: FICHA_COPY_LINK_HASH,
      hint: "Usa el botón «Copiar enlace» en esta ficha",
    },
    {
      id: "portal",
      label: "Portal público activo",
      done: true,
      href: portalHref,
      hint: portalHref,
    },
    {
      id: "admin",
      label: "Invitar administrador de liga (LEAGUE_ADMIN)",
      done: input.adminCount > 0,
      href: "#league-admin-form",
      hint:
        input.adminCount > 0
          ? `${input.adminCount} asignado(s)`
          : "Formulario en esta ficha o /liga/perfiles/ con la liga activa",
    },
    {
      id: "season",
      label: "Nombre de temporada configurado",
      done: seasonOk,
      hint: seasonOk ? input.seasonName! : "Define la temporada en ajustes de la liga",
    },
    {
      id: "clubs",
      label: "Al menos un club registrado",
      done: input.clubCount > 0,
      href: "/liga/clubs/",
      hint: input.clubCount > 0 ? `${input.clubCount} club(es)` : "Registra clubes en el panel operativo",
    },
    {
      id: "logo",
      label: "Logo de login / portal (carnet y PDF)",
      done: logoOk,
      href: "#carnet-settings",
      hint: logoOk ? "Logo cargado" : "Sube el logo en configuración de la liga",
    },
    {
      id: "carnet-vigencia",
      label: "Vigencia del carnet configurada",
      done: Boolean(input.carnetValidityLabel?.trim()),
      href: "#carnet-settings",
      hint: input.carnetValidityLabel?.trim() || "Ej. 03/2026 - 03/2027",
    },
    ...(carnetSignatureModeRequiresPresident(signatureMode)
      ? [
          {
            id: "carnet-firma-presidente",
            label: "Firma del presidente (reverso carnet)",
            done: Boolean(input.presidentSignatureUrl?.trim()),
            href: "#carnet-settings",
          },
        ]
      : []),
    ...(carnetSignatureModeRequiresSecretary(signatureMode)
      ? [
          {
            id: "carnet-firma-secretario",
            label: "Firma del secretario (reverso carnet)",
            done: Boolean(input.secretarySignatureUrl?.trim()),
            href: "#carnet-settings",
          },
        ]
      : []),
  ];
}

export function checklistProgress(items: LeagueOnboardingChecklistItem[]): {
  done: number;
  total: number;
  percent: number;
} {
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}
