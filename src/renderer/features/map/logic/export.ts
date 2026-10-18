import type { GeoJsonPosition, MapFeature } from "@shared/types";
import { mapFeatureName } from "./layer-order";

export function exportGeoJson(features: MapFeature[], mapName: string) {
  const blob = new Blob([
    JSON.stringify({ type: "FeatureCollection", features }, null, 2),
  ], { type: "application/geo+json" });
  downloadBlob(blob, `${fileSafeName(mapName)}.geojson`);
}

export function exportKmz(features: MapFeature[], mapName: string) {
  const placemarks = features.map((feature) => {
    const name = escapeXml(mapFeatureName(feature));
    const description = String(feature.properties.description ?? "")
      .replaceAll("]]>", "]]]]><![CDATA[>");
    const geometry = feature.geometry.type === "Point"
      ? `<Point><coordinates>${kmlCoordinate(feature.geometry.coordinates)}</coordinates></Point>`
      : feature.geometry.type === "LineString"
      ? `<LineString><tessellate>1</tessellate><coordinates>${
        feature.geometry.coordinates.map(kmlCoordinate).join(" ")
      }</coordinates></LineString>`
      : `<Polygon><outerBoundaryIs><LinearRing><coordinates>${
        feature.geometry.coordinates[0].map(kmlCoordinate).join(" ")
      }</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
    return `<Placemark><name>${name}</name><description><![CDATA[${description}]]></description>${
      geometry
    }</Placemark>`;
  }).join("");
  const kml = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${
    escapeXml(mapName)
  }</name>${placemarks}</Document></kml>`;
  const archive = createStoredZip("doc.kml", new TextEncoder().encode(kml));
  downloadBlob(
    new Blob([archive], { type: "application/vnd.google-earth.kmz" }),
    `${fileSafeName(mapName)}.kmz`,
  );
}

function kmlCoordinate([longitude, latitude]: GeoJsonPosition) {
  return `${longitude},${latitude},0`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function fileSafeName(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "map";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createStoredZip(filename: string, contents: Uint8Array) {
  const name = new TextEncoder().encode(filename);
  const checksum = crc32(contents);
  const localSize = 30 + name.length + contents.length;
  const centralSize = 46 + name.length;
  const archive = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(archive.buffer);
  let offset = 0;
  view.setUint32(offset, 0x04034b50, true);
  view.setUint16(offset + 4, 20, true);
  view.setUint16(offset + 6, 0x0800, true);
  view.setUint32(offset + 14, checksum, true);
  view.setUint32(offset + 18, contents.length, true);
  view.setUint32(offset + 22, contents.length, true);
  view.setUint16(offset + 26, name.length, true);
  archive.set(name, offset + 30);
  archive.set(contents, offset + 30 + name.length);
  offset = localSize;
  view.setUint32(offset, 0x02014b50, true);
  view.setUint16(offset + 4, 20, true);
  view.setUint16(offset + 6, 20, true);
  view.setUint16(offset + 8, 0x0800, true);
  view.setUint32(offset + 16, checksum, true);
  view.setUint32(offset + 20, contents.length, true);
  view.setUint32(offset + 24, contents.length, true);
  view.setUint16(offset + 28, name.length, true);
  archive.set(name, offset + 46);
  offset += centralSize;
  view.setUint32(offset, 0x06054b50, true);
  view.setUint16(offset + 8, 1, true);
  view.setUint16(offset + 10, 1, true);
  view.setUint32(offset + 12, centralSize, true);
  view.setUint32(offset + 16, localSize, true);
  return archive;
}

function crc32(contents: Uint8Array) {
  let crc = 0xffffffff;
  for (const value of contents) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
