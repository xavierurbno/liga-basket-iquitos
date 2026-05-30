import { categoryRepository } from "@/repositories/categoryRepository";
import { playerRepository } from "@/repositories/playerRepository";

export async function loadPlayerValidation(entityId: string) {
  return playerRepository.findValidationById(entityId);
}

export async function loadCategoryValidation(entityId: string) {
  return categoryRepository.findValidationById(entityId);
}
