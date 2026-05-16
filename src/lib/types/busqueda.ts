export type PlayerDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
  fullName: string;
  poloNumber: number | null;
  clubName: string;
  categoryLabel: string;
};
