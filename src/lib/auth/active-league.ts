/** Cookie httpOnly: liga operativa para SUPER_ADMIN en /liga/* */
export const ACTIVE_LEAGUE_COOKIE = "active_league_id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidLeagueUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

export function getActiveLeagueIdFromCookies(cookieStore: CookieReader): string | null {
  const raw = cookieStore.get(ACTIVE_LEAGUE_COOKIE)?.value?.trim();
  if (!raw || !isValidLeagueUuid(raw)) return null;
  return raw;
}
