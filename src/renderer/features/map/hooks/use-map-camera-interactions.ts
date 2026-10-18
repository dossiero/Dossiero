import { type Dispatch, type RefObject, type SetStateAction, type WheelEvent, useEffect, useRef } from "react";
import type { GeoJsonPosition } from "@shared/types";
import { clamp, distancePixels, lonLatToWorld, relativePoint, screenToCoordinate, worldToLonLat } from "@/features/map/logic/geometry";
import { maxMapZoom, minMapZoom, type Camera, type MapViewportSize } from "@/features/map/map.types";

const CAMERA_ANIMATION_DURATION_MS = 240;
const CAMERA_ANIMATION_DISTANCE_VIEWPORTS = 2.5;

interface Options {
  board: RefObject<HTMLDivElement | null>;
  camera: Camera;
  setCamera: Dispatch<SetStateAction<Camera>>;
  size: MapViewportSize;
}

export function useMapCameraInteractions({ board, camera, setCamera, size }: Options) {
  const animationRef = useRef<number | null>(null);
  const cancelCameraAnimation = () => {
    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };
  useEffect(() => cancelCameraAnimation, []);

  const moveCameraTo = (center: GeoJsonPosition) => {
    cancelCameraAnimation();
    const startWorld = lonLatToWorld(camera.center, camera.zoom);
    const endWorld = lonLatToWorld(center, camera.zoom);
    const threshold = Math.max(size.width, size.height) * CAMERA_ANIMATION_DISTANCE_VIEWPORTS;
    if (!size.width || distancePixels(startWorld, endWorld) > threshold) {
      setCamera((current) => ({ ...current, center }));
      return;
    }
    const startedAt = performance.now();
    const animate = (timestamp: number) => {
      const progress = clamp((timestamp - startedAt) / CAMERA_ANIMATION_DURATION_MS, 0, 1);
      const eased = 1 - (1 - progress) ** 3;
      const worldPoint = {
        x: startWorld.x + (endWorld.x - startWorld.x) * eased,
        y: startWorld.y + (endWorld.y - startWorld.y) * eased,
      };
      setCamera((current) => ({ ...current, center: worldToLonLat(worldPoint, current.zoom) }));
      animationRef.current = progress < 1 ? window.requestAnimationFrame(animate) : null;
    };
    animationRef.current = window.requestAnimationFrame(animate);
  };

  const wheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    cancelCameraAnimation();
    const cursor = relativePoint(event, board.current);
    setCamera((current) => {
      const zoom = clamp(current.zoom + (event.deltaY > 0 ? -1 : 1), minMapZoom, maxMapZoom);
      if (zoom === current.zoom) return current;
      const anchorWorld = lonLatToWorld(screenToCoordinate(cursor, current, size), zoom);
      return {
        center: worldToLonLat({
          x: anchorWorld.x - cursor.x + size.width / 2,
          y: anchorWorld.y - cursor.y + size.height / 2,
        }, zoom),
        zoom,
      };
    });
  };

  return { cancelCameraAnimation, moveCameraTo, wheel };
}
