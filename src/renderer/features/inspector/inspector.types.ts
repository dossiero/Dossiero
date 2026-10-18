import type { DossierApi, LinkItem, MediaItem } from "@shared/types";
import type { RelationSelection } from "@/features/relations/components/relation-tab/relation-tab";

export type MediaUpdateInput = Parameters<DossierApi["updateMedia"]>[1];

export interface InspectorPanelProps {
  selected: MediaItem | LinkItem | RelationSelection | null;
  onClose?: () => void;
  onMediaUpdate?: (item: MediaItem, input: MediaUpdateInput) => Promise<MediaItem>;
  onMediaExport?: (item: MediaItem) => void;
  onOpenPerson?: (personId: string) => void;
}

export interface MediaProperties {
  width?: number;
  height?: number;
  duration?: number;
}

export interface ExifState {
  status: "idle" | "loading" | "ready" | "error";
  entries: ExifEntry[];
  message?: string;
}

export interface ExifEntry {
  label: string;
  value: string;
}
