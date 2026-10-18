import type { MapTileStyle } from "@/features/map/map.types";
import "./map-attribution.css";

export function MapAttribution({ tileStyle }: { tileStyle: MapTileStyle }) {
  if (tileStyle === "styled") {
    return (
      <div className="map-attribution">
        <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a>
        {" · "}
        <a href="https://photon.komoot.io" target="_blank" rel="noreferrer">Photon search</a>
        {" · © "}
        <a href="https://openmaptiles.org" target="_blank" rel="noreferrer">OpenMapTiles</a>
        {" · © "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap
        </a>
      </div>
    );
  }

  if (tileStyle === "osm") {
    return (
      <div className="map-attribution">
        <a href="https://photon.komoot.io" target="_blank" rel="noreferrer">Photon search</a>
        {" · © "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap contributors
        </a>
      </div>
    );
  }

  return (
    <div className="map-attribution">
      <a href="https://photon.komoot.io" target="_blank" rel="noreferrer">Photon search</a>
      {" · Tiles © "}
      <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a>
      {" and data providers"}
    </div>
  );
}
