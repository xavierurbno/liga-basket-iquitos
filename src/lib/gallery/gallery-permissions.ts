/** Subida a galería institucional (no delegados de club). */
export function canUploadInstitutionalGallery(role: string | undefined | null): boolean {
  return role === "SUPER_ADMIN" || role === "LEAGUE_ADMIN";
}

export function canUploadClubGallery(role: string | undefined | null): boolean {
  return role === "SUPER_ADMIN" || role === "LEAGUE_ADMIN" || role === "CLUB_DELEGATE";
}
