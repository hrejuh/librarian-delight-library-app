import { AddInstitutionModal } from "./AddInstitutionModal";
import { Institution } from "@/lib/data-types";

interface EditInstitutionModalProps {
  institution: Institution;
  onClose: () => void;
  onSave: (institution: Omit<Institution, "id" | "created_at" | "created_by">) => void;
}

export const EditInstitutionModal = ({ institution, onClose, onSave }: EditInstitutionModalProps) => {
  return (
    <AddInstitutionModal
      existingInstitution={institution}
      onClose={onClose}
      onSave={onSave}
    />
  );
}; 