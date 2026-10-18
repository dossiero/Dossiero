import type { MediaItem } from "@shared/types";

export interface MediaCardProps {
  item: MediaItem;
  url: string;
  index: number;
  onInspect: () => void;
  onShowInFolder: () => void;
  onDelete: () => void;
  onPreview: () => void;
  onSetProfilePhoto: () => void;
}
