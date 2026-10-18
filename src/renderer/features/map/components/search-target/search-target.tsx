import type { MapSearchResult, ScreenPoint } from "@/features/map/map.types";
import "./search-target.css";

interface SearchTargetProps {
  result: MapSearchResult;
  point: ScreenPoint;
}

export function SearchTarget({ result, point }: SearchTargetProps) {
  return (
    <g
      className="map-search-target"
      transform={`translate(${point.x} ${point.y})`}
      aria-label={`Search result: ${result.label}`}
    >
      <circle r="12" />
      <path d="M-18 0H18M0-18V18" />
      <text y="29">{result.label}</text>
    </g>
  );
}
