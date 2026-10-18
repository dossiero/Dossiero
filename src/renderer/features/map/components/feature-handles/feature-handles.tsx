import type { PointerEvent as ReactPointerEvent } from "react";
import type { ScreenPoint } from "@/features/map/map.types";
import "./feature-handles.css";

interface FeatureHandlesProps {
  points: ScreenPoint[];
  color: string;
  closed: boolean;
  onPointerDown: (
    event: ReactPointerEvent<SVGCircleElement>,
    vertexIndex: number,
    insert: boolean,
  ) => void;
}

export function FeatureHandles({
  points,
  color,
  closed,
  onPointerDown,
}: FeatureHandlesProps) {
  const segmentStartPoints = closed ? points : points.slice(0, -1);
  return (
    <g className="map-polygon-handles" aria-label="Feature edit points">
      {segmentStartPoints.map((point, index) => {
        const nextPoint = points[(index + 1) % points.length];
        return (
          <circle
            key={`midpoint-${index}`}
            className="map-polygon-handle map-polygon-midpoint"
            cx={(point.x + nextPoint.x) / 2}
            cy={(point.y + nextPoint.y) / 2}
            r={5}
            fill="rgb(var(--surface-raised))"
            stroke={color}
            onPointerDown={(event) => onPointerDown(event, index + 1, true)}
            onClick={(event) => event.stopPropagation()}
          />
        );
      })}
      {points.map((point, index) => (
        <circle
          key={`vertex-${index}`}
          className="map-polygon-handle map-polygon-vertex"
          cx={point.x}
          cy={point.y}
          r={7}
          fill="rgb(var(--surface-raised))"
          stroke={color}
          onPointerDown={(event) => onPointerDown(event, index, false)}
          onClick={(event) => event.stopPropagation()}
        />
      ))}
    </g>
  );
}
