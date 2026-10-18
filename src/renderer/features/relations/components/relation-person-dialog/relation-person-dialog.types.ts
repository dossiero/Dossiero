import type { Person, PersonInput } from "@shared/types";

export interface RelationPersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetName: string;
  person?: Person | null;
  initialRelationType?: string;
  onSave: (relationType: string, input: PersonInput) => Promise<void>;
}
