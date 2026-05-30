export type LeagueSocialNetwork =
  | "facebook"
  | "instagram"
  | "youtube"
  | "tiktok"
  | "whatsapp";

export type LeagueSocialLink = {
  id: LeagueSocialNetwork;
  label: string;
  href: string;
};

export type LeagueSocialSettings = {
  socialFacebookUrl?: string | null;
  socialInstagramUrl?: string | null;
  socialYoutubeUrl?: string | null;
  socialTiktokUrl?: string | null;
  socialWhatsappUrl?: string | null;
};

const SOCIAL_LABELS: Record<LeagueSocialNetwork, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
};

function trimOrNull(value: string | null | undefined): string | null {
  const t = value?.trim();
  return t ? t : null;
}

function normalizeHttpUrl(raw: string, hostPattern: RegExp): string | null {
  let candidate = raw.trim();
  if (!candidate) return null;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate.replace(/^\/+/, "")}`;
  }
  try {
    const url = new URL(candidate);
    if (!hostPattern.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Acepta URL wa.me o número peruano (9 dígitos móvil o con +51). */
export function normalizeWhatsappUrl(raw: string | null | undefined): string | null {
  const t = trimOrNull(raw ?? "");
  if (!t) return null;

  if (/^https?:\/\//i.test(t)) {
    try {
      const url = new URL(t);
      if (/wa\.me$/i.test(url.hostname) || /whatsapp\.com$/i.test(url.hostname)) {
        return url.toString();
      }
    } catch {
      return null;
    }
    return null;
  }

  const digits = t.replace(/\D/g, "");
  if (digits.length < 9) return null;
  const withCountry = digits.startsWith("51") ? digits : `51${digits}`;
  return `https://wa.me/${withCountry}`;
}

export function normalizeSocialNetworkUrl(
  network: LeagueSocialNetwork,
  raw: string | null | undefined,
): string | null {
  const t = trimOrNull(raw ?? "");
  if (!t) return null;

  switch (network) {
    case "facebook":
      return normalizeHttpUrl(t, /(^|\.)facebook\.com$|(^|\.)fb\.com$/i);
    case "instagram":
      return normalizeHttpUrl(t, /(^|\.)instagram\.com$/i);
    case "youtube":
      return normalizeHttpUrl(t, /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i);
    case "tiktok":
      return normalizeHttpUrl(t, /(^|\.)tiktok\.com$/i);
    case "whatsapp":
      return normalizeWhatsappUrl(t);
    default:
      return null;
  }
}

export function normalizeLeagueSocialSettings(input: {
  socialFacebookUrl?: string | null;
  socialInstagramUrl?: string | null;
  socialYoutubeUrl?: string | null;
  socialTiktokUrl?: string | null;
  socialWhatsappUrl?: string | null;
}): LeagueSocialSettings {
  return {
    socialFacebookUrl: normalizeSocialNetworkUrl("facebook", input.socialFacebookUrl),
    socialInstagramUrl: normalizeSocialNetworkUrl("instagram", input.socialInstagramUrl),
    socialYoutubeUrl: normalizeSocialNetworkUrl("youtube", input.socialYoutubeUrl),
    socialTiktokUrl: normalizeSocialNetworkUrl("tiktok", input.socialTiktokUrl),
    socialWhatsappUrl: normalizeSocialNetworkUrl("whatsapp", input.socialWhatsappUrl),
  };
}

export function buildLeagueSocialLinks(
  settings: LeagueSocialSettings | null | undefined,
): LeagueSocialLink[] {
  if (!settings) return [];

  const entries: Array<[LeagueSocialNetwork, string | null | undefined]> = [
    ["facebook", settings.socialFacebookUrl],
    ["instagram", settings.socialInstagramUrl],
    ["youtube", settings.socialYoutubeUrl],
    ["tiktok", settings.socialTiktokUrl],
    ["whatsapp", settings.socialWhatsappUrl],
  ];

  return entries.flatMap(([id, href]) => {
    const normalized = href?.trim();
    if (!normalized) return [];
    return [{ id, label: SOCIAL_LABELS[id], href: normalized }];
  });
}

export const LEAGUE_SOCIAL_FORM_FIELDS: Array<{
  name: keyof LeagueSocialSettings;
  network: LeagueSocialNetwork;
  label: string;
  placeholder: string;
  hint: string;
}> = [
  {
    name: "socialFacebookUrl",
    network: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/tu-liga",
    hint: "Página oficial de la liga en Facebook.",
  },
  {
    name: "socialInstagramUrl",
    network: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/tu_liga",
    hint: "Perfil oficial en Instagram.",
  },
  {
    name: "socialYoutubeUrl",
    network: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@tu-liga",
    hint: "Canal o playlist oficial.",
  },
  {
    name: "socialTiktokUrl",
    network: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@tu_liga",
    hint: "Perfil oficial en TikTok.",
  },
  {
    name: "socialWhatsappUrl",
    network: "whatsapp",
    label: "WhatsApp",
    placeholder: "965432100 o https://wa.me/51965432100",
    hint: "Número móvil peruano o enlace wa.me para contacto.",
  },
];
