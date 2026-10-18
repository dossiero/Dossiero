import type {
  MediaItem,
  PersonTab,
  UploadFile,
} from "@shared/types";

export interface MediaTabProps {
  tab: PersonTab;
  items: MediaItem[];
  mediaUrl: (item: MediaItem) => string;
  onFiles: (files: UploadFile[]) => void;
  onNativePick: () => void;
  onInspect: (item: MediaItem) => void;
  onShowInFolder: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onPreview: (item: MediaItem) => void;
  onSetProfilePhoto: (item: MediaItem) => void;
  desktop: boolean;
}
