import type { MouseEvent } from "react";
import type { ScreenPoint } from "@/features/map/map.types";

export function svgEventPoint(event: MouseEvent<SVGElement>): ScreenPoint {
  const svg = event.currentTarget.ownerSVGElement;
  const bounds = svg?.getBoundingClientRect();
  return {
    x: event.clientX - (bounds?.left ?? 0),
    y: event.clientY - (bounds?.top ?? 0),
  };
}
