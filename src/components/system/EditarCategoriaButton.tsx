"use client";

import { CategoryWizardModal } from "@/components/system/CategoryWizardModal";

interface Props {
  clubId: string;
  categoryId: string;
  name: string;
  description: string | null;
  coachName: string | null;
  coachLastname: string | null;
  coachDocumentType: string | null;
  coachDocumentNumber: string | null;
  coachBirthdate: Date | null;
  coachContact: string | null;
  coachEmail: string | null;
  coachPhotoUrl: string | null;
  delegateName: string | null;
  delegateLastname: string | null;
  delegateDocumentType: string | null;
  delegateDocumentNumber: string | null;
  delegateBirthdate: Date | null;
  delegateContact: string | null;
  delegateEmail: string | null;
  delegatePhotoUrl: string | null;
}

export function EditarCategoriaButton(props: Props) {
  return (
    <CategoryWizardModal
      clubId={props.clubId}
      mode="edit"
      triggerLabel="Editar"
      initialData={{
        categoryId: props.categoryId,
        name: props.name,
        description: props.description,
        coachName: props.coachName,
        coachLastname: props.coachLastname,
        coachDocumentType: props.coachDocumentType,
        coachDocumentNumber: props.coachDocumentNumber,
        coachBirthdate: props.coachBirthdate,
        coachContact: props.coachContact,
        coachEmail: props.coachEmail,
        coachPhotoUrl: props.coachPhotoUrl,
        delegateName: props.delegateName,
        delegateLastname: props.delegateLastname,
        delegateDocumentType: props.delegateDocumentType,
        delegateDocumentNumber: props.delegateDocumentNumber,
        delegateBirthdate: props.delegateBirthdate,
        delegateContact: props.delegateContact,
        delegateEmail: props.delegateEmail,
        delegatePhotoUrl: props.delegatePhotoUrl,
      }}
    />
  );
}
