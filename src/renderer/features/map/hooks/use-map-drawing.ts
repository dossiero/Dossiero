import { useEffect, useState } from "react";
import type { GeoJsonPosition, MapFeature, MapFeatureProperties } from "@shared/types";
import { makeFeature } from "@/features/map/logic/geometry";
import type { ScreenPoint, Tool } from "@/features/map/map.types";

export function useMapDrawing(addFeature: (feature: MapFeature) => void) {
  const [tool, setTool] = useState<Tool>("pan");
  const [draft, setDraft] = useState<GeoJsonPosition[]>([]);
  const [draftCursor, setDraftCursor] = useState<ScreenPoint | null>(null);
  const [pinDraft, setPinDraft] = useState<{ coordinate: GeoJsonPosition; screen: ScreenPoint } | null>(null);
  const resetDrawing = () => {
    setDraft([]);
    setDraftCursor(null);
    setPinDraft(null);
    setTool("pan");
  };
  const finishPath = (closePolygon = false) => {
    if (draft.length < 2) {
      resetDrawing();
      return;
    }
    const polygon = closePolygon && draft.length >= 3;
    const geometry: MapFeature["geometry"] = polygon
      ? { type: "Polygon", coordinates: [[...draft, draft[0]]] }
      : { type: "LineString", coordinates: draft };
    const properties: MapFeatureProperties = {
      shape: polygon ? "polygon" : "line",
      label: polygon ? "Untitled polygon" : "Untitled line",
      description: "",
      color: "#f0a52b",
      lineStyle: "solid",
      lineWidth: 3,
    };
    addFeature(makeFeature(geometry, properties));
    resetDrawing();
  };
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") resetDrawing();
      if (event.key === "Enter" && tool === "line") finishPath();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });
  return { tool, setTool, draft, setDraft, draftCursor, setDraftCursor, pinDraft, setPinDraft, resetDrawing, finishPath };
}
