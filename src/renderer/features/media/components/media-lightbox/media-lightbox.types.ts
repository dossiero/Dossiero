import type { MediaItem } from "@shared/types";

export interface MediaLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MediaItem | null;
  items: MediaItem[];
  mediaUrl: (item: MediaItem) => string;
  onItemChange: (item: MediaItem) => void;
}
