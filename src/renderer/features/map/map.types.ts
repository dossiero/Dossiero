import type { GeoJsonPosition, MapFeature, MapLayerFolder } from "@shared/types";

export type Tool = "pan" | "pin" | "pen" | "line";
export type MapTileStyle = "styled" | "osm" | "hybrid" | "terrain";
export type Camera = { center: GeoJsonPosition; zoom: number };
export type ScreenPoint = { x: number; y: number };
export type MapViewportSize = { width: number; height: number };
export type LayerDropEdge = "before" | "inside" | "after";
export type LayerItemReference = { kind: "feature" | "folder"; id: string };
export type LayerPlacement = {
  parentId?: string;
  targetId?: string;
  edge?: Exclude<LayerDropEdge, "inside">;
};
export type MapSearchResult = {
  id: string;
  label: string;
  detail: string;
  coordinate: GeoJsonPosition;
  zoom: number;
};
export type MapLayerNode =
  | { kind: "feature"; feature: MapFeature; order: number }
  | { kind: "folder"; folder: MapLayerFolder; order: number };

export const tileSize = 256;
export const minMapZoom = 3;
export const maxMapZoom = 19;
export const defaultCamera: Camera = { center: [0, 24], zoom: 3 };
