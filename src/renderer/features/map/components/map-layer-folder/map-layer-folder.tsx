import { ChevronDown, ChevronRight, Eye, EyeOff, Folder, FolderPlus, Pencil, Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/context-menu/context-menu";
import "./map-layer-folder.css";
import type { MapLayerFolderProps } from "./map-layer-folder.types";

export function MapLayerFolder({
  folder,
  depth,
  hidden,
  collapsed,
  childCount,
  dropEdge,
  renaming,
  renameValue,
  children,
  onToggleCollapsed,
  onToggleHidden,
  onBeginRename,
  onRenameValue,
  onFinishRename,
  onCancelRename,
  onCreateFolder,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: MapLayerFolderProps) {
  return (
    <section className={`map-layer-folder ${hidden ? "is-hidden" : ""}`}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={`map-layer-folder-row ${dropEdge ? `drop-${dropEdge}` : ""}`}
            style={{ paddingLeft: 2 + depth * 12 }}
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDoubleClick={onBeginRename}
          >
            <button
              type="button"
              className="map-layer-collapse"
              onClick={onToggleCollapsed}
              aria-label={`${collapsed ? "Expand" : "Collapse"} ${folder.name}`}
            >
              {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
            </button>
            <Folder size={14} />
            {renaming ? (
              <input
                autoFocus
                className="map-layer-rename"
                value={renameValue}
                onChange={(event) => onRenameValue(event.target.value)}
                onBlur={onFinishRename}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onFinishRename();
                  }
                  if (event.key === "Escape") {
                    onCancelRename();
                  }
                }}
                onPointerDown={(event) => event.stopPropagation()}
              />
            ) : (
              <span title={folder.name}>{folder.name}</span>
            )}
            <small>{childCount}</small>
            <button
              type="button"
              className="map-layer-visibility"
              onClick={onToggleHidden}
              aria-label={folder.hidden ? `Show ${folder.name}` : `Hide ${folder.name}`}
            >
              {folder.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={onCreateFolder}>
            <FolderPlus size={13} /> Add folder
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={onBeginRename}>
            <Pencil size={13} /> Edit
          </ContextMenuItem>
          <ContextMenuItem onSelect={onRemove} danger>
            <Trash2 size={13} /> Remove
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {!collapsed && children}
    </section>
  );
}
