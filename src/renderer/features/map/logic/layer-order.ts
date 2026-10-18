import type { MapFeature, MapLayerFolder } from "@shared/types";
import type {
  LayerItemReference,
  LayerPlacement,
  MapLayerNode,
} from "@/features/map/map.types";

export function getLayerNodes(
  features: MapFeature[],
  folders: MapLayerFolder[],
  parentId?: string,
): MapLayerNode[] {
  const folderIds = new Set(folders.map((folder) => folder.id));
  const belongsAtLevel = (candidateParentId?: string) => parentId
    ? candidateParentId === parentId
    : !candidateParentId || !folderIds.has(candidateParentId);
  const folderNodes: MapLayerNode[] = folders
    .filter((folder) => belongsAtLevel(folder.parentId))
    .map((folder, index) => ({
      kind: "folder",
      folder,
      order: folder.order ?? index,
    }));
  const featureNodes: MapLayerNode[] = features
    .filter((feature) => belongsAtLevel(feature.properties.folderId))
    .map((feature, index) => ({
      kind: "feature",
      feature,
      order: feature.properties.layerOrder ?? folders.length + index,
    }));
  return [...folderNodes, ...featureNodes].sort((left, right) => left.order - right.order);
}

export function getMapStackFeatures(
  features: MapFeature[],
  folders: MapLayerFolder[],
) {
  const featuresById = new Map(features.map((feature) => [feature.id, feature]));
  return flattenLayerItems(features, folders)
    .flatMap((item) => item.kind === "feature" ? [featuresById.get(item.id)] : [])
    .filter((feature): feature is MapFeature => Boolean(feature))
    .reverse();
}

export function moveLayerItems(
  features: MapFeature[],
  folders: MapLayerFolder[],
  movedItems: LayerItemReference[],
  placement: LayerPlacement,
): [MapFeature[], MapLayerFolder[]] {
  const movedKeys = new Set(movedItems.map(layerItemKey));
  if (placement.targetId) {
    const targetIsMoving = movedItems.some((item) => item.id === placement.targetId);
    if (targetIsMoving) return [features, folders];
  }
  const treeOrder = new Map(
    flattenLayerItems(features, folders).map((item, index) => [layerItemKey(item), index]),
  );
  const orderedItems = [...movedItems].sort((left, right) => (
    (treeOrder.get(layerItemKey(left)) ?? Number.MAX_SAFE_INTEGER) -
    (treeOrder.get(layerItemKey(right)) ?? Number.MAX_SAFE_INTEGER)
  ));
  let nextFeatures = features.map((feature) => (
    movedKeys.has(layerItemKey({ kind: "feature", id: feature.id }))
      ? {
        ...feature,
        properties: { ...feature.properties, folderId: placement.parentId },
      }
      : feature
  ));
  let nextFolders = folders.map((folder) => (
    movedKeys.has(layerItemKey({ kind: "folder", id: folder.id }))
      ? { ...folder, parentId: placement.parentId }
      : folder
  ));
  const destinationItems = getLayerNodes(
    nextFeatures,
    nextFolders,
    placement.parentId,
  ).map(layerNodeReference).filter((item) => !movedKeys.has(layerItemKey(item)));
  const targetIndex = placement.targetId
    ? destinationItems.findIndex((item) => item.id === placement.targetId)
    : -1;
  const insertionIndex = targetIndex < 0
    ? destinationItems.length
    : targetIndex + (placement.edge === "after" ? 1 : 0);
  const orderedDestination = [
    ...destinationItems.slice(0, insertionIndex),
    ...orderedItems,
    ...destinationItems.slice(insertionIndex),
  ];
  const orderByKey = new Map(
    orderedDestination.map((item, index) => [layerItemKey(item), index]),
  );
  nextFeatures = nextFeatures.map((feature) => {
    const order = orderByKey.get(layerItemKey({ kind: "feature", id: feature.id }));
    return order === undefined
      ? feature
      : { ...feature, properties: { ...feature.properties, layerOrder: order } };
  });
  nextFolders = nextFolders.map((folder) => {
    const order = orderByKey.get(layerItemKey({ kind: "folder", id: folder.id }));
    return order === undefined ? folder : { ...folder, order };
  });
  return [nextFeatures, nextFolders];
}

export function nextLayerOrder(
  features: MapFeature[],
  folders: MapLayerFolder[],
  parentId?: string,
) {
  const orders = getLayerNodes(features, folders, parentId).map((node) => node.order);
  return orders.length ? Math.max(...orders) + 1 : 0;
}

export function isFolderDescendant(
  folders: MapLayerFolder[],
  folderId: string | undefined,
  ancestorId: string,
  includeSelf = false,
) {
  if (!folderId) return false;
  if (includeSelf && folderId === ancestorId) return true;
  const foldersById = new Map(folders.map((folder) => [folder.id, folder]));
  const visited = new Set<string>();
  let current = foldersById.get(folderId);
  while (current?.parentId && !visited.has(current.id)) {
    if (current.parentId === ancestorId) return true;
    visited.add(current.id);
    current = foldersById.get(current.parentId);
  }
  return false;
}

export function isFeatureVisible(feature: MapFeature, folders: MapLayerFolder[]) {
  if (feature.properties.hidden) return false;
  const foldersById = new Map(folders.map((folder) => [folder.id, folder]));
  const visited = new Set<string>();
  let currentId = feature.properties.folderId;
  while (currentId && !visited.has(currentId)) {
    const folder = foldersById.get(currentId);
    if (!folder) return true;
    if (folder.hidden) return false;
    visited.add(currentId);
    currentId = folder.parentId;
  }
  return true;
}

export function mapFeatureName(feature: MapFeature) {
  const label = typeof feature.properties.label === "string"
    ? feature.properties.label.trim()
    : "";
  if (label) return label;
  if (feature.geometry.type === "Point") return "Untitled pin";
  if (feature.geometry.type === "Polygon") return "Untitled polygon";
  return "Untitled line";
}

export function layerNodeId(node: MapLayerNode) {
  return node.kind === "folder" ? node.folder.id : node.feature.id;
}

function layerNodeReference(node: MapLayerNode): LayerItemReference {
  return { kind: node.kind, id: layerNodeId(node) };
}

function layerItemKey(item: LayerItemReference) {
  return `${item.kind}:${item.id}`;
}

function flattenLayerItems(
  features: MapFeature[],
  folders: MapLayerFolder[],
  parentId?: string,
  visited = new Set<string>(),
): LayerItemReference[] {
  return getLayerNodes(features, folders, parentId).flatMap((node) => {
    const reference = layerNodeReference(node);
    if (node.kind === "feature" || visited.has(node.folder.id)) return [reference];
    const nextVisited = new Set(visited).add(node.folder.id);
    return [
      reference,
      ...flattenLayerItems(features, folders, node.folder.id, nextVisited),
    ];
  });
}
