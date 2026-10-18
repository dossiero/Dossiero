import type { MediaItem } from "@shared/types";

export interface MediaEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MediaItem | null;
  onSave: (input: { caption?: string; notes?: string; tags?: string[] }) => Promise<void>;
}
