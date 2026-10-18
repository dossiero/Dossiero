import { useEffect, useRef, useState } from "react";
import type {
  MapDocument,
  MapFeature,
  MapLayerFolder,
} from "@shared/types";
import {
  isFolderDescendant,
  moveLayerItems,
  nextLayerOrder,
} from "@/features/map/logic/layer-order";
import type { LayerPlacement } from "@/features/map/map.types";

type SaveState = "saved" | "saving" | "error";

interface UseMapDocumentOptions {
  document?: MapDocument;
  onSave: (features: MapFeature[], folders: MapLayerFolder[]) => Promise<MapDocument>;
}

export function useMapDocument({ document, onSave }: UseMapDocumentOptions) {
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const [features, setFeatures] = useState<MapFeature[]>(document?.features ?? []);
  const [folders, setFolders] = useState<MapLayerFolder[]>(document?.folders ?? []);
  const [saveState, setSaveState] = useState<SaveState>("saved");

  useEffect(() => {
    setFeatures(document?.features ?? []);
    setFolders(document?.folders ?? []);
    setSaveState("saved");
  }, [document?.updatedAt]);

  const commit = (nextFeatures: MapFeature[], nextFolders = folders) => {
    setFeatures(nextFeatures);
    setFolders(nextFolders);
    setSaveState("saving");

    const operation = saveQueue.current
      .catch(() => undefined)
      .then(() => onSave(nextFeatures, nextFolders));

    saveQueue.current = operation;
    void operation
      .then(() => setSaveState("saved"))
      .catch(() => setSaveState("error"));
  };

  const addFeature = (feature: MapFeature) => {
    const orderedFeature = feature.properties.layerOrder === undefined
      ? {
        ...feature,
        properties: {
          ...feature.properties,
          layerOrder: nextLayerOrder(features, folders, feature.properties.folderId),
        },
      }
      : feature;

    commit([...features, orderedFeature]);
  };

  const updateFeature = (feature: MapFeature) => {
    const nextFeatures = features.map((item) => item.id === feature.id ? feature : item);
    commit(nextFeatures);
  };

  const deleteFeatures = (featureIds: string[]) => {
    const deletedIds = new Set(featureIds);
    commit(features.filter((item) => !deletedIds.has(item.id)));
  };

  const createFolder = (name: string) => {
    commit(features, [
      ...folders,
      {
        id: crypto.randomUUID(),
        name,
        hidden: false,
        order: nextLayerOrder(features, folders),
      },
    ]);
  };

  const updateFolder = (folder: MapLayerFolder) => {
    const nextFolders = folders.map((item) => item.id === folder.id ? folder : item);
    commit(features, nextFolders);
  };

  const removeFolder = (folderId: string) => {
    const removedFolder = folders.find((folder) => folder.id === folderId);
    const nextFeatures = features.map((feature) =>
      feature.properties.folderId === folderId
        ? {
          ...feature,
          properties: {
            ...feature.properties,
            folderId: removedFolder?.parentId,
          },
        }
        : feature
    );
    const nextFolders = folders
      .filter((folder) => folder.id !== folderId)
      .map((folder) =>
        folder.parentId === folderId
          ? { ...folder, parentId: removedFolder?.parentId }
          : folder
      );

    commit(nextFeatures, nextFolders);
  };

  const moveFeatures = (featureIds: string[], placement: LayerPlacement = {}) => {
    const movedItems = featureIds.map((id) => ({ kind: "feature", id }) as const);
    const [nextFeatures, nextFolders] = moveLayerItems(
      features,
      folders,
      movedItems,
      placement,
    );

    commit(nextFeatures, nextFolders);
  };

  const moveFolder = (folderId: string, placement: LayerPlacement = {}) => {
    const { parentId } = placement;
    const wouldMoveIntoSelf = folderId === parentId;
    const wouldMoveIntoDescendant = parentId
      ? isFolderDescendant(folders, parentId, folderId)
      : false;

    if (wouldMoveIntoSelf || wouldMoveIntoDescendant) {
      return;
    }

    const [nextFeatures, nextFolders] = moveLayerItems(
      features,
      folders,
      [{ kind: "folder", id: folderId }],
      placement,
    );

    commit(nextFeatures, nextFolders);
  };

  const toggleFeature = (feature: MapFeature) => {
    updateFeature({
      ...feature,
      properties: {
        ...feature.properties,
        hidden: !feature.properties.hidden,
      },
    });
  };

  return {
    addFeature,
    commit,
    createFolder,
    deleteFeatures,
    features,
    folders,
    moveFeatures,
    moveFolder,
    removeFolder,
    saveState,
    setSaveState,
    setFeatures,
    toggleFeature,
    updateFeature,
    updateFolder,
  };
}
