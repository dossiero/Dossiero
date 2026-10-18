import type { MapTileStyle } from "@/features/map/map.types";

export const mapTileStyles: Array<{
  id: MapTileStyle;
  label: string;
  description: string;
}> = [
  { id: "styled", label: "Styled", description: "Dossiero-themed street map" },
  { id: "osm", label: "OSM", description: "Standard OpenStreetMap" },
  { id: "hybrid", label: "Hybrid", description: "Satellite imagery with labels" },
  { id: "terrain", label: "Terrain", description: "Topographic map" },
];

export function readMapTileStyle(storageKey: string): MapTileStyle {
  const storedStyle = localStorage.getItem(storageKey);
  const isKnownStyle = mapTileStyles.some((style) => style.id === storedStyle);
  return isKnownStyle ? storedStyle as MapTileStyle : "styled";
}
