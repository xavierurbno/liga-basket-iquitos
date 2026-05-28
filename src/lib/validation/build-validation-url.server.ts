import {
  buildPublicValidationUrl,
  type ValidationEntityKind,
} from "@/lib/validation/entity-validation-token";

export function buildPlayerValidationUrl(
  playerId: string,
  baseOrigin = "",
): string | null {
  return buildPublicValidationUrl(playerId, "player", baseOrigin);
}

export function buildCategoryValidationUrl(
  categoryId: string,
  baseOrigin = "",
): string | null {
  return buildPublicValidationUrl(categoryId, "category", baseOrigin);
}

export function buildEntityValidationUrl(
  entityId: string,
  kind: ValidationEntityKind,
  baseOrigin = "",
): string | null {
  return buildPublicValidationUrl(entityId, kind, baseOrigin);
}
