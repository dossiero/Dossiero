import type { MapFeature } from "@shared/types";
import { Tooltip } from "@/components/tooltip/tooltip";
import {
  formatArea,
  formatDistance,
  pathLengthMeters,
  polygonAreaSquareMeters,
} from "@/features/map/logic/geometry";
import "./feature-measurements.css";

export function FeatureMeasurements({ feature }: { feature: MapFeature }) {
  if (feature.geometry.type === "LineString") {
    return (
      <div className="map-polygon-measurements" aria-label="Line measurements">
        <Tooltip label="Line length: total distance along this line">
          <span className="map-measurement" tabIndex={0}>
            <span className="map-measure-line" aria-hidden="true" />
            <strong>{formatDistance(pathLengthMeters(feature.geometry.coordinates))}</strong>
          </span>
        </Tooltip>
      </div>
    );
  }
  if (feature.geometry.type !== "Polygon") {
    return null;
  }
  const polygonRing = feature.geometry.coordinates[0];
  return (
    <div className="map-polygon-measurements" aria-label="Polygon measurements">
      <Tooltip label="Area: surface enclosed by this shape">
        <span className="map-measurement" tabIndex={0}>
          <span className="map-measure-area" aria-hidden="true" />
          <strong>{formatArea(polygonAreaSquareMeters(polygonRing))}</strong>
        </span>
      </Tooltip>
      <Tooltip label="Perimeter: total distance around this shape">
        <span className="map-measurement" tabIndex={0}>
          <span className="map-measure-perimeter" aria-hidden="true" />
          <strong>{formatDistance(pathLengthMeters(polygonRing))}</strong>
        </span>
      </Tooltip>
    </div>
  );
}
