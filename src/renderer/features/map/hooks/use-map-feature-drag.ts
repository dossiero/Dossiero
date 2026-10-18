import type { Dispatch, MutableRefObject, PointerEvent as ReactPointerEvent, RefObject, SetStateAction } from "react";
import type { MapFeature } from "@shared/types";
import { distancePixels, relativePoint, screenToCoordinate, translateFeature, updateFeaturePoint } from "@/features/map/logic/geometry";
import type { Camera, MapViewportSize } from "@/features/map/map.types";

const FEATURE_DRAG_THRESHOLD_PX = 2;

interface Options {
  board: RefObject<HTMLDivElement | null>;
  camera: Camera;
  size: MapViewportSize;
  features: MapFeature[];
  setFeatures: Dispatch<SetStateAction<MapFeature[]>>;
  commit: (features: MapFeature[]) => void;
  selectedId: string | null;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  suppressFeatureClickRef: MutableRefObject<boolean>;
}

export function useMapFeatureDrag(options: Options) {
  const { board, camera, size, features, setFeatures, commit, selectedId, setSelectedId, suppressFeatureClickRef } = options;
  const unproject = (point: { x: number; y: number }) => screenToCoordinate(point, camera, size);

  const dragFeature = (event: ReactPointerEvent<SVGElement>, feature: MapFeature) => {
    const instantlyDraggable = feature.geometry.type === "Point";
    if (event.button !== 0 || (feature.id !== selectedId && !instantlyDraggable)) return;
    event.preventDefault();
    event.stopPropagation();
    if (instantlyDraggable) setSelectedId(feature.id);
    const startScreen = relativePoint(event, board.current);
    const startCoordinate = unproject(startScreen);
    const originalFeature = feature;
    let latestFeature = feature;
    let moved = false;
    const move = (pointer: PointerEvent) => {
      const screenPoint = relativePoint(pointer, board.current);
      const coordinate = unproject(screenPoint);
      moved = moved || distancePixels(screenPoint, startScreen) > FEATURE_DRAG_THRESHOLD_PX;
      if (moved) suppressFeatureClickRef.current = true;
      latestFeature = translateFeature(originalFeature, [
        coordinate[0] - startCoordinate[0],
        coordinate[1] - startCoordinate[1],
      ]);
      setFeatures((current) => current.map((candidate) => (
        candidate.id === feature.id ? latestFeature : candidate
      )));
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
    };
    const finish = () => {
      cleanup();
      if (!moved) return;
      commit(features.map((candidate) => candidate.id === feature.id ? latestFeature : candidate));
      window.requestAnimationFrame(() => {
        suppressFeatureClickRef.current = false;
      });
    };
    const cancel = () => {
      cleanup();
      setFeatures((current) => current.map((candidate) => (
        candidate.id === feature.id ? originalFeature : candidate
      )));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cancel);
  };

  const dragFeaturePoint = (
    event: ReactPointerEvent<SVGCircleElement>,
    feature: MapFeature,
    vertexIndex: number,
    insert: boolean,
  ) => {
    if (event.button !== 0 || feature.geometry.type === "Point") return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(feature.id);
    const originalFeature = feature;
    const startScreen = relativePoint(event, board.current);
    const startCoordinate = unproject(startScreen);
    let latestFeature = insert
      ? updateFeaturePoint(originalFeature, vertexIndex, startCoordinate, true)
      : originalFeature;
    let moved = false;
    if (insert) {
      setFeatures((current) => current.map((candidate) => (
        candidate.id === feature.id ? latestFeature : candidate
      )));
    }
    const move = (pointer: PointerEvent) => {
      const screenPoint = relativePoint(pointer, board.current);
      moved = moved || distancePixels(screenPoint, startScreen) > FEATURE_DRAG_THRESHOLD_PX;
      latestFeature = updateFeaturePoint(latestFeature, vertexIndex, unproject(screenPoint), false);
      setFeatures((current) => current.map((candidate) => (
        candidate.id === feature.id ? latestFeature : candidate
      )));
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
    };
    const finish = () => {
      cleanup();
      if (insert || moved) {
        commit(features.map((candidate) => candidate.id === feature.id ? latestFeature : candidate));
      }
    };
    const cancel = () => {
      cleanup();
      setFeatures((current) => current.map((candidate) => (
        candidate.id === feature.id ? originalFeature : candidate
      )));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cancel);
  };

  return { dragFeature, dragFeaturePoint };
}
