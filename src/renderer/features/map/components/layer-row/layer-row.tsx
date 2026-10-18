import {
  Eye,
  EyeOff,
  FolderPlus,
  MapPin,
  Pencil,
  Pentagon,
  Route,
  Trash2,
} from "lucide-react";
import type { MapFeature } from "@shared/types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/context-menu/context-menu";
import { mapFeatureName } from "@/features/map/logic/layer-order";
import type { LayerDropEdge } from "@/features/map/map.types";
import "./layer-row.css";

export interface MapLayerRowProps {
  feature: MapFeature;
  selected: boolean;
  parentHidden?: boolean;
  onSelect: (event: React.MouseEvent, feature: MapFeature) => void;
  onCreateFolder: () => void;
  onEdit: (feature: MapFeature) => void;
  onDragStart: (event: React.DragEvent, feature: MapFeature) => void;
  onToggle: (feature: MapFeature) => void;
  onDelete: (featureIds: string[]) => void;
  selectedIds: Set<string>;
  depth: number;
  dropEdge?: Exclude<LayerDropEdge, "inside">;
  renaming: boolean;
  renameValue: string;
  onBeginRename: () => void;
  onRenameValue: (value: string) => void;
  onFinishRename: () => void;
  onCancelRename: () => void;
  onDragEnd: () => void;
  onDragOverRow: (event: React.DragEvent) => void;
  onDropRow: (event: React.DragEvent) => void;
}

export function MapLayerRow({
  feature,
  selected,
  parentHidden = false,
  onSelect,
  onCreateFolder,
  onEdit,
  onDragStart,
  onDragEnd,
  onDragOverRow,
  onDropRow,
  onToggle,
  onDelete,
  selectedIds,
  depth,
  dropEdge,
  renaming,
  renameValue,
  onBeginRename,
  onRenameValue,
  onFinishRename,
  onCancelRename,
}: MapLayerRowProps) {
  const kind = feature.geometry.type === "Point"
    ? "pin"
    : feature.geometry.type === "Polygon"
    ? "polygon"
    : "line";
  let Icon = Route;
  if (kind === "pin") {
    Icon = MapPin;
  } else if (kind === "polygon") {
    Icon = Pentagon;
  }
  const hidden = Boolean(feature.properties.hidden || parentHidden);
  const actionIds = selected ? [...selectedIds] : [feature.id];
  const selectionLabel = selected && selectedIds.size > 1
    ? `${selectedIds.size} selected elements`
    : kind;
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={`map-layer-row ${selected ? "is-selected" : ""} ${
            hidden ? "is-hidden" : ""
          } ${dropEdge ? `drop-${dropEdge}` : ""}`}
          style={{ paddingLeft: 5 + depth * 12 }}
          draggable
          onDragStart={(event) => onDragStart(event, feature)}
          onDragEnd={onDragEnd}
          onDragOver={onDragOverRow}
          onDrop={onDropRow}
          onDoubleClick={onBeginRename}
        >
          <button
            type="button"
            className="map-layer-main"
            onClick={(event) => onSelect(event, feature)}
            aria-pressed={selected}
          >
            <Icon size={13} />
            {renaming
              ? (
                <input
                  autoFocus
                  className="map-layer-rename"
                  value={renameValue}
                  onChange={(event) => onRenameValue(event.target.value)}
                  onBlur={onFinishRename}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onFinishRename();
                    if (event.key === "Escape") onCancelRename();
                  }}
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                />
              )
              : <span>{mapFeatureName(feature)}</span>}
          </button>
          <button
            type="button"
            className="map-layer-visibility"
            onClick={(event) => {
              event.stopPropagation();
              onToggle(feature);
            }}
            aria-label={feature.properties.hidden ? "Show layer" : "Hide layer"}
          >
            {feature.properties.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={onCreateFolder}>
          <FolderPlus size={13} /> Add folder
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => onEdit(feature)}>
          <Pencil size={13} /> Edit
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onDelete(actionIds)} danger>
          <Trash2 size={13} /> Remove {selectionLabel}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
