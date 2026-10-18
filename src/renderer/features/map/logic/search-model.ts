import type { GeoJsonPosition } from "@shared/types";
import type { MapSearchResult } from "@/features/map/map.types";

export const mapSearchUrl = "https://photon.komoot.io/api/";

export function parsePhotonResults(value: unknown): MapSearchResult[] {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as { features?: unknown }).features)
  ) return [];
  return (value as { features: unknown[] }).features.flatMap((entry, index) => {
    if (!entry || typeof entry !== "object") return [];
    const feature = entry as {
      geometry?: { type?: unknown; coordinates?: unknown };
      properties?: Record<string, unknown>;
    };
    const coordinates = feature.geometry?.coordinates;
    if (
      feature.geometry?.type !== "Point" ||
      !Array.isArray(coordinates) ||
      coordinates.length < 2 ||
      !Number.isFinite(coordinates[0]) ||
      !Number.isFinite(coordinates[1])
    ) return [];
    const properties = feature.properties ?? {};
    const name = stringValue(properties.name) ||
      stringValue(properties.street) ||
      "Unnamed place";
    const house = stringValue(properties.housenumber);
    const primary = house && !name.startsWith(house) ? `${house} ${name}` : name;
    const detail = [
      stringValue(properties.district),
      stringValue(properties.city),
      stringValue(properties.state),
      stringValue(properties.country),
    ].filter((part, partIndex, parts) => (
      part && parts.indexOf(part) === partIndex
    )).join(", ");
    const layer = stringValue(properties.type) ||
      stringValue(properties.osm_value) ||
      stringValue(properties.osm_key);
    return [{
      id: `${stringValue(properties.osm_type)}:${stringValue(properties.osm_id) || index}`,
      label: primary,
      detail,
      coordinate: [Number(coordinates[0]), Number(coordinates[1])] as GeoJsonPosition,
      zoom: searchZoom(layer),
    }];
  });
}

function stringValue(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function searchZoom(layer: string) {
  if (/house|address|entrance/.test(layer)) return 19;
  if (/street|road|pedestrian/.test(layer)) return 17;
  if (/locality|neighbourhood|suburb/.test(layer)) return 15;
  if (/district|borough/.test(layer)) return 13;
  if (/city|town|village/.test(layer)) return 11;
  if (/county/.test(layer)) return 9;
  if (/state|region/.test(layer)) return 7;
  if (/country/.test(layer)) return 5;
  return 16;
}
