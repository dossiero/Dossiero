import { lonLatToWorld } from "@/features/map/logic/geometry";
import { tileSize, type Camera, type MapTileStyle } from "@/features/map/map.types";
import "./raster-tile-layer.css";

export function RasterTileLayer({
  tileStyle,
  camera,
  size,
}: {
  tileStyle: MapTileStyle;
  camera: Camera;
  size: { width: number; height: number };
}) {
  if (tileStyle === "styled" || !size.width || !size.height) return null;
  const center = lonLatToWorld(camera.center, camera.zoom);
  const columns = 2 ** camera.zoom;
  const startX = Math.floor((center.x - size.width / 2) / tileSize) - 1;
  const endX = Math.floor((center.x + size.width / 2) / tileSize) + 1;
  const startY = Math.max(0, Math.floor((center.y - size.height / 2) / tileSize) - 1);
  const endY = Math.min(
    columns - 1,
    Math.floor((center.y + size.height / 2) / tileSize) + 1,
  );
  const tiles: Array<{
    x: number;
    y: number;
    wrappedX: number;
    left: number;
    top: number;
  }> = [];
  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      tiles.push({
        x,
        y,
        wrappedX: ((x % columns) + columns) % columns,
        left: x * tileSize - center.x + size.width / 2,
        top: y * tileSize - center.y + size.height / 2,
      });
    }
  }
  return (
    <div className="map-raster-map" aria-hidden="true">
      {tiles.flatMap((tile) => renderTile(tileStyle, camera.zoom, tile))}
    </div>
  );
}

function renderTile(
  tileStyle: MapTileStyle,
  zoom: number,
  tile: { x: number; y: number; wrappedX: number; left: number; top: number },
) {
  const key = `${zoom}-${tile.x}-${tile.y}`;
  const style = { left: tile.left, top: tile.top };
  if (tileStyle === "osm") {
    return (
      <img
        key={key}
        style={style}
        src={`https://tile.openstreetmap.org/${zoom}/${tile.wrappedX}/${tile.y}.png`}
        alt=""
        draggable={false}
      />
    );
  }
  if (tileStyle === "terrain") {
    return (
      <img
        key={key}
        style={style}
        src={`https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${zoom}/${tile.y}/${tile.wrappedX}`}
        alt=""
        draggable={false}
      />
    );
  }
  return [
    <img
      key={`${key}-imagery`}
      style={style}
      src={`https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${tile.y}/${tile.wrappedX}`}
      alt=""
      draggable={false}
    />,
    <img
      className="map-raster-labels"
      key={`${key}-labels`}
      style={style}
      src={`https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${zoom}/${tile.y}/${tile.wrappedX}`}
      alt=""
      draggable={false}
    />,
  ];
}
