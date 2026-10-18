import type { ScreenPoint } from "@/features/map/map.types";
import "./draft-shape.css";

export function DraftShape({
  points,
  cursor,
  showVertices = true,
}: {
  points: ScreenPoint[];
  cursor: ScreenPoint | null;
  showVertices?: boolean;
}) {
  const previewPoints = cursor ? [...points, cursor] : points;
  return (
    <g className="map-draft-shape">
      <polyline
        className="map-draft"
        points={previewPoints.map((point) => `${point.x},${point.y}`).join(" ")}
        fill="none"
      />
      {showVertices && points.map((point, index) => (
        <circle
          key={`${point.x}:${point.y}:${index}`}
          className="map-draft-point"
          cx={point.x}
          cy={point.y}
          r={index === 0 ? 6 : 5}
        />
      ))}
    </g>
  );
}
