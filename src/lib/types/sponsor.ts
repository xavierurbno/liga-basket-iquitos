export type Sponsor = {
  id: string;
  leagueId: string;
  name: string;
  category: "SOCIOS_PATROCINADORES" | "PATR_TECNICO" | "PATROCINADORES_OFICIALES" | "PROVEEDORES" | "INSTITUCIONALES";
  logoUrl: string;
  websiteUrl: string | null;
  displayOrder: number;
  createdAt: Date;
};
