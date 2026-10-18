import type { DragEvent, ReactNode } from "react";
import type { MapLayerFolder } from "@shared/types";
import type { LayerDropEdge } from "@/features/map/map.types";

export interface MapLayerFolderProps {
  folder: MapLayerFolder;
  depth: number;
  hidden: boolean;
  collapsed: boolean;
  childCount: number;
  dropEdge?: LayerDropEdge;
  renaming: boolean;
  renameValue: string;
  children: ReactNode;
  onToggleCollapsed: () => void;
  onToggleHidden: () => void;
  onBeginRename: () => void;
  onRenameValue: (value: string) => void;
  onFinishRename: () => void;
  onCancelRename: () => void;
  onCreateFolder: () => void;
  onRemove: () => void;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}
