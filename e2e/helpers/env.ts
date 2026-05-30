export function requireE2eEnv() {
  const email = process.env.E2E_DELEGATE_EMAIL?.trim();
  const password = process.env.E2E_DELEGATE_PASSWORD?.trim();
  const leagueSlug = process.env.E2E_LEAGUE_SLUG?.trim();
  const foreignClubId = process.env.E2E_FOREIGN_CLUB_ID?.trim();

  if (!email || !password || !leagueSlug) {
    return null;
  }

  return { email, password, leagueSlug, foreignClubId };
}
