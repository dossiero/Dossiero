import type { LinkItem } from "@shared/types";

export interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link?: LinkItem | null;
  onSave: (input: { label: string; url: string; notes?: string }) => Promise<void>;
}
