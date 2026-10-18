import { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  setWorkerUrl,
  type StyleSpecification,
} from "maplibre-gl";
import mapLibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { toast } from "sonner";
import type { Camera, MapTileStyle } from "@/features/map/map.types";
import {
  emptyVectorStyle,
  readThemePalette,
  styleMatrixVectorMap,
  vectorStyleUrl,
} from "@/features/map/logic/vector-style";

setWorkerUrl(mapLibreWorkerUrl);

interface UseMapViewportOptions {
  camera: Camera;
  themeKey: string;
  tileStyle: MapTileStyle;
  tabId: string;
}

export function useMapViewport({
  camera,
  themeKey,
  tileStyle,
  tabId,
}: UseMapViewportOptions) {
  const boardRef = useRef<HTMLDivElement>(null);
  const vectorContainerRef = useRef<HTMLDivElement>(null);
  const vectorMapRef = useRef<MapLibreMap | null>(null);
  const baseVectorStyleRef = useRef<StyleSpecification | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = boardRef.current;
    if (!node) {
      return;
    }

    let resizeTimer: number | undefined;
    let animationFrame: number | undefined;
    let measured = false;

    const updateSize = (width: number, height: number) => {
      setSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height }
      );
    };
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);

      if (!measured) {
        measured = true;
        updateSize(width, height);
        return;
      }

      window.clearTimeout(resizeTimer);
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = undefined;
      }

      resizeTimer = window.setTimeout(() => {
        animationFrame = window.requestAnimationFrame(() => {
          animationFrame = undefined;
          updateSize(width, height);
        });
      }, 140);
    });

    observer.observe(node);
    return () => {
      observer.disconnect();
      window.clearTimeout(resizeTimer);
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  useEffect(() => {
    if (!vectorContainerRef.current) {
      return;
    }

    const map = new MapLibreMap({
      container: vectorContainerRef.current,
      style: emptyVectorStyle(),
      center: camera.center,
      zoom: camera.zoom - 1,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
    });

    vectorMapRef.current = map;
    return () => {
      vectorMapRef.current = null;
      map.remove();
    };
  }, [tabId]);

  useEffect(() => {
    vectorMapRef.current?.jumpTo({
      center: camera.center,
      zoom: camera.zoom - 1,
    });
  }, [camera]);

  useEffect(() => {
    vectorMapRef.current?.resize();
  }, [size]);

  useEffect(() => {
    let cancelled = false;
    const apply = (style: StyleSpecification) => {
      if (!cancelled && vectorMapRef.current) {
        vectorMapRef.current.setStyle(style);
      }
    };

    if (tileStyle !== "styled") {
      apply(emptyVectorStyle());
      return () => {
        cancelled = true;
      };
    }

    const applyStyled = (style: StyleSpecification) => {
      apply(styleMatrixVectorMap(style, readThemePalette()));
    };

    if (baseVectorStyleRef.current) {
      applyStyled(baseVectorStyleRef.current);
      return () => {
        cancelled = true;
      };
    }

    void fetch(vectorStyleUrl)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Vector map style unavailable");
        }
        return await response.json() as StyleSpecification;
      })
      .then((style) => {
        baseVectorStyleRef.current = style;
        applyStyled(style);
      })
      .catch((error) => {
        if (!cancelled) {
          const message = error instanceof Error
            ? error.message
            : "Vector map failed to load";
          toast.error(`! ${message}`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [themeKey, tabId, tileStyle]);

  return {
    boardRef,
    size,
    vectorContainerRef,
  };
}
