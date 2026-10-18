import {
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type SetStateAction,
  useRef,
} from "react";
import type { GeoJsonPosition, MapFeature } from "@shared/types";
import { distancePixels, lonLatToWorld, makeFeature, projectToScreen, relativePoint, screenToCoordinate, worldToLonLat } from "@/features/map/logic/geometry";
import { useMapCameraInteractions } from "@/features/map/hooks/use-map-camera-interactions";
import { useMapDrawing } from "@/features/map/hooks/use-map-drawing";
import { useMapFeatureDrag } from "@/features/map/hooks/use-map-feature-drag";
import { useMapSelection } from "@/features/map/hooks/use-map-selection";
import type { Camera, MapViewportSize, ScreenPoint } from "@/features/map/map.types";

const POINTER_DRAG_THRESHOLD_PX = 3;
const POLYGON_CLOSE_DISTANCE_PX = 10;

interface Options {
  board: RefObject<HTMLDivElement | null>;
  camera: Camera;
  setCamera: Dispatch<SetStateAction<Camera>>;
  size: MapViewportSize;
  features: MapFeature[];
  setFeatures: Dispatch<SetStateAction<MapFeature[]>>;
  addFeature: (feature: MapFeature) => void;
  removeFeatures: (featureIds: string[]) => void;
  commit: (features: MapFeature[]) => void;
}

export function useMapInteractions(options: Options) {
  const { board, camera, setCamera, size, features, setFeatures, addFeature, removeFeatures, commit } = options;
  const suppressFeatureClickRef = useRef(false);
  const drawing = useMapDrawing(addFeature);
  const selection = useMapSelection(removeFeatures);
  const cameraInteractions = useMapCameraInteractions({ board, camera, setCamera, size });
  const project = (coordinate: GeoJsonPosition) => projectToScreen(coordinate, camera, size);
  const unproject = (point: ScreenPoint) => screenToCoordinate(point, camera, size);
  const featureDrag = useMapFeatureDrag({
    board,
    camera,
    size,
    features,
    setFeatures,
    commit,
    selectedId: selection.selectedId,
    setSelectedId: selection.setSelectedId,
    suppressFeatureClickRef,
  });

  const resetInteraction = () => {
    selection.resetSelection();
    drawing.resetDrawing();
  };

  const panFromPointer = (event: ReactPointerEvent<HTMLDivElement>, onClick?: () => void) => {
    cameraInteractions.cancelCameraAnimation();
    const origin = camera;
    const originWorld = lonLatToWorld(origin.center, origin.zoom);
    let moved = false;
    const move = (pointer: PointerEvent) => {
      const horizontalDelta = pointer.clientX - event.clientX;
      const verticalDelta = pointer.clientY - event.clientY;
      if (Math.hypot(horizontalDelta, verticalDelta) > POINTER_DRAG_THRESHOLD_PX) moved = true;
      if (!moved) return;
      suppressFeatureClickRef.current = true;
      setCamera({
        ...origin,
        center: worldToLonLat({
          x: originWorld.x - horizontalDelta,
          y: originWorld.y - verticalDelta,
        }, origin.zoom),
      });
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cleanup);
    };
    const finish = () => {
      cleanup();
      if (!moved) onClick?.();
      else window.requestAnimationFrame(() => {
        suppressFeatureClickRef.current = false;
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cleanup);
  };

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const control = (event.target as Element).closest(
      ".map-search,.map-tools,.map-pin-form,.map-detail-card,.map-style-switcher,.map-zoom",
    );
    if (event.button !== 0 || control) return;
    const startScreen = relativePoint(event, board.current);
    const startCoordinate = unproject(startScreen);
    if (drawing.tool === "pin") {
      panFromPointer(event, () => drawing.setPinDraft({ coordinate: startCoordinate, screen: startScreen }));
      return;
    }
    if (drawing.tool === "line") {
      if (event.detail > 1) return;
      panFromPointer(event, () => {
        const firstPoint = drawing.draft[0];
        const closesPolygon = drawing.draft.length >= 3
          && firstPoint
          && distancePixels(project(firstPoint), startScreen) <= POLYGON_CLOSE_DISTANCE_PX;
        if (closesPolygon) drawing.finishPath(true);
        else {
          drawing.setDraft((current) => [...current, startCoordinate]);
          drawing.setDraftCursor(startScreen);
        }
      });
      return;
    }
    if (drawing.tool === "pan") {
      selection.setSelectedId(null);
      selection.setDetailsId(null);
      panFromPointer(event);
      return;
    }
    drawing.setDraft([startCoordinate]);
    const points = [startCoordinate];
    const move = (pointer: PointerEvent) => {
      const point = unproject(relativePoint(pointer, board.current));
      const lastPoint = points.at(-1)!;
      if (distancePixels(project(lastPoint), project(point)) < POINTER_DRAG_THRESHOLD_PX) return;
      points.push(point);
      drawing.setDraft([...points]);
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
    };
    const finish = (pointer: PointerEvent) => {
      move(pointer);
      cleanup();
      drawing.setDraft([]);
      if (points.length > 1) {
        addFeature(makeFeature({ type: "LineString", coordinates: points }, {
          shape: "freehand",
          label: "Untitled line",
          description: "",
          color: "#f0a52b",
          lineStyle: "solid",
          lineWidth: 3,
        }));
      }
    };
    const cancel = () => {
      cleanup();
      drawing.setDraft([]);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cancel);
  };

  return {
    suppressFeatureClickRef,
    ...drawing,
    ...selection,
    project,
    resetInteraction,
    moveCameraTo: cameraInteractions.moveCameraTo,
    pointerDown,
    wheel: cameraInteractions.wheel,
    ...featureDrag,
  };
}
