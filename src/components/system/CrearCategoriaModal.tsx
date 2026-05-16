"use client";

import { CategoryWizardModal } from "@/components/system/CategoryWizardModal";

export function CrearCategoriaModal({ clubId }: { clubId: string }) {
  return <CategoryWizardModal clubId={clubId} mode="create" />;
}
