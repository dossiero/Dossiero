import type { Person, PersonInput } from "@shared/types";

export interface PersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: Person | null;
  onSave: (input: PersonInput) => Promise<void>;
}
