import type {
  GeoJsonPosition,
  MapFeature,
  MapFeatureProperties,
} from "@shared/types";
import {
  maxMapZoom,
  minMapZoom,
  tileSize,
  type Camera,
  type MapViewportSize,
  type ScreenPoint,
} from "@/features/map/map.types";

export function makeFeature(
  geometry: MapFeature["geometry"],
  properties: MapFeatureProperties,
): MapFeature {
  return { type: "Feature", id: crypto.randomUUID(), geometry, properties };
}

export function relativePoint(
  event: { clientX: number; clientY: number },
  node: HTMLElement | null,
): ScreenPoint {
  const rect = node?.getBoundingClientRect();
  return {
    x: event.clientX - (rect?.left ?? 0),
    y: event.clientY - (rect?.top ?? 0),
  };
}

export function distancePixels(left: ScreenPoint, right: ScreenPoint) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

export function shouldShowFeatureHandles(points: ScreenPoint[], closed: boolean) {
  if (points.length < 2) return false;

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  const extent = Math.hypot(width, height);
  if (extent < 96) return false;

  const segmentCount = closed ? points.length : points.length - 1;
  const pathLength = points.reduce((total, point, index) => {
    if (index === 0) return total;
    return total + distancePixels(points[index - 1], point);
  }, 0) + (closed ? distancePixels(points.at(-1)!, points[0]) : 0);
  if (pathLength / segmentCount < 24) return false;

  if (!closed || points.length < 3) return true;

  const doubledArea = points.reduce((area, point, index) => {
    const nextPoint = points[(index + 1) % points.length];
    return area + point.x * nextPoint.y - nextPoint.x * point.y;
  }, 0);
  return Math.abs(doubledArea) / 2 >= 2_400;
}

export function featureAnchor(feature: MapFeature): GeoJsonPosition {
  if (feature.geometry.type === "Point") return feature.geometry.coordinates;
  const points = feature.geometry.type === "LineString"
    ? feature.geometry.coordinates
    : feature.geometry.coordinates[0];
  const unique = feature.geometry.type === "Polygon" ? points.slice(0, -1) : points;
  return unique.reduce<GeoJsonPosition>(
    (sum, point) => [
      sum[0] + point[0] / unique.length,
      sum[1] + point[1] / unique.length,
    ],
    [0, 0],
  );
}

export function translateFeature(
  feature: MapFeature,
  [longitudeDelta, latitudeDelta]: GeoJsonPosition,
): MapFeature {
  const move = ([longitude, latitude]: GeoJsonPosition): GeoJsonPosition => [
    ((longitude + longitudeDelta + 540) % 360) - 180,
    clamp(latitude + latitudeDelta, -85.05112878, 85.05112878),
  ];
  const geometry: MapFeature["geometry"] = feature.geometry.type === "Point"
    ? { type: "Point", coordinates: move(feature.geometry.coordinates) }
    : feature.geometry.type === "LineString"
    ? { type: "LineString", coordinates: feature.geometry.coordinates.map(move) }
    : {
      type: "Polygon",
      coordinates: feature.geometry.coordinates.map((ring) => ring.map(move)),
    };
  return { ...feature, geometry };
}

export function updateFeaturePoint(
  feature: MapFeature,
  vertexIndex: number,
  coordinate: GeoJsonPosition,
  insert: boolean,
): MapFeature {
  if (feature.geometry.type === "LineString") {
    const coordinates = [...feature.geometry.coordinates];
    if (insert) {
      coordinates.splice(vertexIndex, 0, coordinate);
    } else {
      coordinates[vertexIndex] = coordinate;
    }
    return {
      ...feature,
      geometry: {
        type: "LineString",
        coordinates,
      },
    };
  }
  if (feature.geometry.type !== "Polygon") return feature;
  const [outerRing, ...innerRings] = feature.geometry.coordinates;
  const vertices = outerRing.slice(0, -1);
  if (insert) vertices.splice(vertexIndex, 0, coordinate);
  else vertices[vertexIndex] = coordinate;
  return {
    ...feature,
    geometry: {
      type: "Polygon",
      coordinates: [[...vertices, vertices[0]], ...innerRings],
    },
  };
}

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function lonLatToWorld([longitude, latitude]: GeoJsonPosition, zoom: number): ScreenPoint {
  const scale = tileSize * 2 ** zoom;
  const safeLatitude = clamp(latitude, -85.05112878, 85.05112878);
  const sine = Math.sin(safeLatitude * Math.PI / 180);
  return {
    x: (longitude + 180) / 360 * scale,
    y: (.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * scale,
  };
}

export function worldToLonLat(point: ScreenPoint, zoom: number): GeoJsonPosition {
  const scale = tileSize * 2 ** zoom;
  const longitude = point.x / scale * 360 - 180;
  const mercatorLatitude = Math.PI - 2 * Math.PI * point.y / scale;
  return [
    ((longitude + 540) % 360) - 180,
    180 / Math.PI * Math.atan(Math.sinh(mercatorLatitude)),
  ];
}

export function projectToScreen(
  coordinate: GeoJsonPosition,
  camera: Camera,
  size: { width: number; height: number },
): ScreenPoint {
  const world = lonLatToWorld(coordinate, camera.zoom);
  const center = lonLatToWorld(camera.center, camera.zoom);
  return {
    x: world.x - center.x + size.width / 2,
    y: world.y - center.y + size.height / 2,
  };
}

export function screenToCoordinate(
  point: ScreenPoint,
  camera: Camera,
  size: { width: number; height: number },
): GeoJsonPosition {
  const center = lonLatToWorld(camera.center, camera.zoom);
  return worldToLonLat({
    x: center.x + point.x - size.width / 2,
    y: center.y + point.y - size.height / 2,
  }, camera.zoom);
}

export function resizeCameraFromTopLeft(
  camera: Camera,
  previousSize: MapViewportSize,
  nextSize: MapViewportSize,
): Camera {
  const center = lonLatToWorld(camera.center, camera.zoom);
  return {
    ...camera,
    center: worldToLonLat({
      x: center.x + (nextSize.width - previousSize.width) / 2,
      y: center.y + (nextSize.height - previousSize.height) / 2,
    }, camera.zoom),
  };
}

export function readCamera(key: string, fallback: Camera): Camera {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "null") as Camera | null;
    if (
      parsed &&
      Array.isArray(parsed.center) &&
      parsed.center.length === 2 &&
      Number.isFinite(parsed.center[0]) &&
      Number.isFinite(parsed.center[1]) &&
      Number.isInteger(parsed.zoom)
    ) {
      return {
        center: parsed.center,
        zoom: clamp(parsed.zoom, minMapZoom, maxMapZoom),
      };
    }
  } catch {
    return fallback;
  }
  return fallback;
}

export function readCameraViewport(key: string): MapViewportSize | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "null") as {
      viewport?: Partial<MapViewportSize>;
    } | null;
    if (
      parsed?.viewport &&
      Number.isFinite(parsed.viewport.width) &&
      Number.isFinite(parsed.viewport.height) &&
      Number(parsed.viewport.width) > 0 &&
      Number(parsed.viewport.height) > 0
    ) {
      return {
        width: Number(parsed.viewport.width),
        height: Number(parsed.viewport.height),
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function polygonAreaSquareMeters(points: GeoJsonPosition[]) {
  if (points.length < 4) return 0;
  const earthRadius = 6_371_008.8;
  let sum = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const [longitude1, latitude1] = points[index];
    const [longitude2, latitude2] = points[index + 1];
    sum += degreesToRadians(longitude2 - longitude1) * (
      2 +
      Math.sin(degreesToRadians(latitude1)) +
      Math.sin(degreesToRadians(latitude2))
    );
  }
  return Math.abs(sum * earthRadius * earthRadius / 2);
}

export function pathLengthMeters(points: GeoJsonPosition[]) {
  return points.slice(1).reduce((total, point, index) => {
    return total + distanceMeters(points[index], point);
  }, 0);
}

function distanceMeters(left: GeoJsonPosition, right: GeoJsonPosition) {
  const earthRadius = 6_371_008.8;
  const latitude1 = degreesToRadians(left[1]);
  const latitude2 = degreesToRadians(right[1]);
  const latitudeDelta = degreesToRadians(right[1] - left[1]);
  const longitudeDelta = degreesToRadians(right[0] - left[0]);
  const haversine = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function degreesToRadians(value: number) {
  return value * Math.PI / 180;
}

export function formatArea(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(3)} km²`;
  return `${Math.round(value).toLocaleString()} m²`;
}

export function formatDistance(value: number) {
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)} km`;
  return `${Math.round(value).toLocaleString()} m`;
}
