import type { MediaItem } from "@shared/types";
import type { MediaUpdateInput } from "@/features/inspector/inspector.types";

export interface MediaDetailsProps {
  item: MediaItem;
  onUpdate?: (item: MediaItem, input: MediaUpdateInput) => Promise<MediaItem>;
  onExport?: (item: MediaItem) => void;
  onClose?: () => void;
}
