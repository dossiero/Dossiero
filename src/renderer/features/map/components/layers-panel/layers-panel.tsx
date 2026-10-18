import {
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Check,
  Eye,
  EyeOff,
  FolderPlus,
  Layers3,
  PanelRightClose,
} from "lucide-react";
import type { MapFeature, MapLayerFolder } from "@shared/types";
import { Button } from "@/components/button/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/context-menu/context-menu";
import { Input } from "@/components/form-control/form-control";
import { Tooltip } from "@/components/tooltip/tooltip";
import { clamp } from "@/features/map/logic/geometry";
import {
  getLayerNodes,
  layerNodeId,
  mapFeatureName,
} from "@/features/map/logic/layer-order";
import { MapLayerRow } from "@/features/map/components/layer-row/layer-row";
import { MapLayerFolder as MapLayerFolderView } from "@/features/map/components/map-layer-folder/map-layer-folder";
import type {
  LayerDropEdge,
  LayerItemReference,
  LayerPlacement,
  MapLayerNode,
} from "@/features/map/map.types";
import "./layers-panel.css";

export interface MapLayersPanelProps {
  features: MapFeature[];
  folders: MapLayerFolder[];
  selectedId: string | null;
  onSelect: (feature: MapFeature) => void;
  onCreateFolder: (name: string) => void;
  onUpdateFolder: (folder: MapLayerFolder) => void;
  onRemoveFolder: (folderId: string) => void;
  onMoveFeatures: (featureIds: string[], placement?: LayerPlacement) => void;
  onMoveFolder: (folderId: string, placement?: LayerPlacement) => void;
  onToggleFeature: (feature: MapFeature) => void;
  onSetAllHidden: (hidden: boolean) => void;
  onEditFeature: (feature: MapFeature) => void;
  onRenameFeature: (feature: MapFeature, label: string) => void;
  onDeleteFeatures: (featureIds: string[]) => void;
  onClearSelection: () => void;
  onClose: () => void;
  width: number;
  onResize: (width: number) => void;
}

export function MapLayersPanel({
  features,
  folders,
  selectedId,
  onSelect,
  onCreateFolder,
  onUpdateFolder,
  onRemoveFolder,
  onMoveFeatures,
  onMoveFolder,
  onToggleFeature,
  onSetAllHidden,
  onEditFeature,
  onRenameFeature,
  onDeleteFeatures,
  onClearSelection,
  onClose,
  width,
  onResize,
}: MapLayersPanelProps) {
  const [creating, setCreating] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [renaming, setRenaming] = useState<LayerItemReference | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [dropTarget, setDropTarget] = useState<{
    key: string;
    edge: LayerDropEdge;
  } | null>(null);
  const lastSelectedId = useRef<string | null>(null);
  const draggedItems = useRef<LayerItemReference[]>([]);
  const allHidden = features.length + folders.length > 0 &&
    features.every((feature) => feature.properties.hidden) &&
    folders.every((folder) => folder.hidden);

  const beginCreateFolder = () => {
    setCreating(true);
    setFolderName("");
  };

  const nodesAtLevel = (parentId?: string) => getLayerNodes(features, folders, parentId);
  const collectVisibleFeatureIds = (parentId?: string): string[] => (
    nodesAtLevel(parentId).flatMap((node) => {
      if (node.kind === "feature") return [node.feature.id];
      if (collapsed.has(node.folder.id)) return [];
      return collectVisibleFeatureIds(node.folder.id);
    })
  );
  const visibleFeatureIds = collectVisibleFeatureIds();

  useEffect(() => {
    if (!selectedId) return;
    setSelectedIds((current) => current.has(selectedId) ? current : new Set([selectedId]));
    lastSelectedId.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    const availableIds = new Set(features.map((feature) => feature.id));
    setSelectedIds((current) => (
      new Set([...current].filter((featureId) => availableIds.has(featureId)))
    ));
  }, [features]);

  const submitFolder = (event: FormEvent) => {
    event.preventDefault();
    const name = folderName.trim();
    if (!name) return;
    onCreateFolder(name);
    setFolderName("");
    setCreating(false);
  };
  const beginRename = (item: LayerItemReference, value: string) => {
    setRenaming(item);
    setRenameValue(value);
  };
  const finishRename = () => {
    const value = renameValue.trim();
    if (value && renaming?.kind === "feature") {
      const feature = features.find((item) => item.id === renaming.id);
      if (feature) onRenameFeature(feature, value);
    }
    if (value && renaming?.kind === "folder") {
      const folder = folders.find((item) => item.id === renaming.id);
      if (folder) onUpdateFolder({ ...folder, name: value });
    }
    setRenaming(null);
  };
  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;
    const move = (pointer: PointerEvent) => {
      onResize(clamp(startWidth + startX - pointer.clientX, 210, 480));
    };
    const finish = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
  };
  const toggleCollapsed = (id: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectFeature = (event: React.MouseEvent, feature: MapFeature) => {
    const toggle = event.ctrlKey || event.metaKey;
    let next = new Set(selectedIds);
    if (event.shiftKey && lastSelectedId.current) {
      const startIndex = visibleFeatureIds.indexOf(lastSelectedId.current);
      const endIndex = visibleFeatureIds.indexOf(feature.id);
      if (startIndex >= 0 && endIndex >= 0) {
        const range = visibleFeatureIds.slice(
          Math.min(startIndex, endIndex),
          Math.max(startIndex, endIndex) + 1,
        );
        next = toggle ? new Set([...next, ...range]) : new Set(range);
      }
    } else if (toggle) {
      if (next.has(feature.id)) next.delete(feature.id);
      else next.add(feature.id);
    } else {
      next = new Set([feature.id]);
    }
    setSelectedIds(next);
    lastSelectedId.current = feature.id;
    if (next.has(feature.id)) {
      onSelect(feature);
      return;
    }
    const fallback = features.find((item) => next.has(item.id));
    if (fallback) onSelect(fallback);
    else onClearSelection();
  };

  const startFeatureDrag = (event: React.DragEvent, feature: MapFeature) => {
    const draggedIds = selectedIds.has(feature.id) ? [...selectedIds] : [feature.id];
    if (!selectedIds.has(feature.id)) {
      setSelectedIds(new Set([feature.id]));
      lastSelectedId.current = feature.id;
      onSelect(feature);
    }
    draggedItems.current = draggedIds.map((id) => ({ kind: "feature", id }));
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "application/x-dossier-map-features",
      JSON.stringify(draggedIds),
    );
    event.dataTransfer.setData("text/plain", draggedIds.join(","));
  };
  const startFolderDrag = (event: React.DragEvent, folder: MapLayerFolder) => {
    event.stopPropagation();
    draggedItems.current = [{ kind: "folder", id: folder.id }];
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-dossier-map-folder", folder.id);
    event.dataTransfer.setData("text/plain", folder.name);
  };
  const finishDrag = () => {
    draggedItems.current = [];
    setDropTarget(null);
  };
  const drop = (event: React.DragEvent, placement: LayerPlacement = {}) => {
    event.preventDefault();
    event.stopPropagation();
    const draggedFolder = draggedItems.current.find((item) => item.kind === "folder");
    const draggedFolderId = draggedFolder?.id ||
      event.dataTransfer.getData("application/x-dossier-map-folder");
    if (draggedFolderId) {
      onMoveFolder(draggedFolderId, placement);
      finishDrag();
      return;
    }
    const draggedFeatureIds = draggedItems.current
      .filter((item) => item.kind === "feature")
      .map((item) => item.id);
    const encodedIds = event.dataTransfer.getData("application/x-dossier-map-features");
    try {
      const featureIds = draggedFeatureIds.length
        ? draggedFeatureIds
        : encodedIds
        ? JSON.parse(encodedIds) as string[]
        : [];
      if (featureIds.length) onMoveFeatures(featureIds, placement);
    } catch {
      // Ignore drags that did not originate from the layers panel.
    }
    finishDrag();
  };
  const rowDropEdge = (event: React.DragEvent, acceptsChildren: boolean) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = (event.clientY - bounds.top) / bounds.height;
    if (acceptsChildren && position >= .25 && position <= .75) return "inside";
    return position < .5 ? "before" : "after";
  };
  const dragOverRow = (
    event: React.DragEvent,
    key: string,
    acceptsChildren: boolean,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setDropTarget({ key, edge: rowDropEdge(event, acceptsChildren) });
  };
  const dropOnRow = (
    event: React.DragEvent,
    node: MapLayerNode,
    parentId: string | undefined,
  ) => {
    const edge = rowDropEdge(event, node.kind === "folder");
    const placement: LayerPlacement = edge === "inside" && node.kind === "folder"
      ? { parentId: node.folder.id }
      : {
        parentId,
        targetId: layerNodeId(node),
        edge: edge === "before" ? "before" : "after",
      };
    drop(event, placement);
  };
  const renderLevel = (
    parentId: string | undefined,
    depth: number,
    parentHidden: boolean,
  ): React.ReactNode => nodesAtLevel(parentId).map((node) => {
    if (node.kind === "feature") {
      return (
        <MapLayerRow
          key={node.feature.id}
          feature={node.feature}
          selected={selectedIds.has(node.feature.id)}
          selectedIds={selectedIds}
          parentHidden={parentHidden}
          depth={depth}
          onSelect={selectFeature}
          onCreateFolder={beginCreateFolder}
          onEdit={onEditFeature}
          onDragStart={startFeatureDrag}
          onDragEnd={finishDrag}
          onDragOverRow={(event) => dragOverRow(event, `feature:${node.feature.id}`, false)}
          onDropRow={(event) => dropOnRow(event, node, parentId)}
          dropEdge={dropTarget?.key === `feature:${node.feature.id}`
            ? dropTarget.edge as Exclude<LayerDropEdge, "inside">
            : undefined}
          onToggle={onToggleFeature}
          onDelete={onDeleteFeatures}
          renaming={renaming?.kind === "feature" && renaming.id === node.feature.id}
          renameValue={renameValue}
          onBeginRename={() => beginRename(
            { kind: "feature", id: node.feature.id },
            mapFeatureName(node.feature),
          )}
          onRenameValue={setRenameValue}
          onFinishRename={finishRename}
          onCancelRename={() => setRenaming(null)}
        />
      );
    }
    return renderFolder(node.folder, parentId, depth, parentHidden);
  });

  const renderFolder = (
    folder: MapLayerFolder,
    parentId: string | undefined,
    depth: number,
    parentHidden: boolean,
  ) => {
    const isCollapsed = collapsed.has(folder.id);
    const hidden = parentHidden || folder.hidden;
    const childCount = nodesAtLevel(folder.id).length;
    const folderKey = `folder:${folder.id}`;
    const folderDropEdge = dropTarget?.key === folderKey ? dropTarget.edge : undefined;
    const folderNode: MapLayerNode = { kind: "folder", folder, order: folder.order ?? 0 };
    return (
      <MapLayerFolderView
        key={folder.id}
        folder={folder}
        depth={depth}
        hidden={hidden}
        collapsed={isCollapsed}
        childCount={childCount}
        dropEdge={folderDropEdge}
        renaming={renaming?.kind === "folder" && renaming.id === folder.id}
        renameValue={renameValue}
        onToggleCollapsed={() => toggleCollapsed(folder.id)}
        onToggleHidden={() => onUpdateFolder({ ...folder, hidden: !folder.hidden })}
        onBeginRename={() => beginRename({ kind: "folder", id: folder.id }, folder.name)}
        onRenameValue={setRenameValue}
        onFinishRename={finishRename}
        onCancelRename={() => setRenaming(null)}
        onCreateFolder={beginCreateFolder}
        onRemove={() => onRemoveFolder(folder.id)}
        onDragStart={(event) => startFolderDrag(event, folder)}
        onDragEnd={finishDrag}
        onDragOver={(event) => dragOverRow(event, folderKey, true)}
        onDrop={(event) => dropOnRow(event, folderNode, parentId)}
      >
        {renderLevel(folder.id, depth + 1, hidden)}
      </MapLayerFolderView>
    );
  };

  return (
    <aside className="map-layers-panel" style={{ width }} aria-label="Map layers">
      <div
        className="map-layers-resizer"
        onPointerDown={startResize}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize layers panel"
      />
      <header>
        <div>
          <Layers3 size={14} />
          <strong>LAYERS</strong>
          <span>{features.length}</span>
        </div>
        <Tooltip label="Hide layers">
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Hide layers">
            <PanelRightClose size={15} />
          </Button>
        </Tooltip>
      </header>
      {creating && (
        <form className="map-folder-form" onSubmit={submitFolder}>
          <Input
            autoFocus
            maxLength={80}
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            placeholder="Folder name"
          />
          <Button
            type="submit"
            variant="signal"
            size="icon"
            disabled={!folderName.trim()}
            aria-label="Add folder"
          >
            <Check size={13} />
          </Button>
        </form>
      )}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className="map-layer-list"
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDropTarget(null);
            }}
            onDrop={(event) => drop(event)}
          >
            {renderLevel(undefined, 0, false)}
            {!features.length && !folders.length && (
              <p className="map-layers-empty">Pins, lines, and polygons will appear here.</p>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={beginCreateFolder}>
            <FolderPlus size={13} /> Add folder
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <footer>
        <Tooltip label="Create folder">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (creating) {
                setCreating(false);
                return;
              }
              beginCreateFolder();
            }}
            aria-label="Create layer folder"
          >
            <FolderPlus size={15} />
          </Button>
        </Tooltip>
        <Tooltip label={allHidden ? "Show all layers" : "Hide all layers"}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSetAllHidden(!allHidden)}
            aria-label={allHidden ? "Show all layers" : "Hide all layers"}
          >
            {allHidden ? <EyeOff size={15} /> : <Eye size={15} />}
          </Button>
        </Tooltip>
      </footer>
    </aside>
  );
}
