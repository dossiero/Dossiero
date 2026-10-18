import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import type { MapFeature } from "@shared/types";
import {
  ContextMenu,
  ContextMenuTrigger,
} from "@/components/context-menu/context-menu";
import { MarkerGraphic } from "@/features/map/components/marker-graphic/marker-graphic";
import { svgEventPoint } from "@/features/map/components/feature-shape/feature-shape.logic";
import { iconChoices } from "@/features/map/logic/marker-options";
import type { ScreenPoint } from "@/features/map/map.types";
import "./point-feature.css";

interface PointFeatureProps {
  feature: MapFeature;
  color: string;
  point: ScreenPoint;
  selected: boolean;
  menu: ReactNode;
  onSelect: (point: ScreenPoint) => void;
  onPointerDown: (event: ReactPointerEvent<SVGElement>) => void;
}

export function PointFeature({
  feature,
  color,
  point,
  selected,
  menu,
  onSelect,
  onPointerDown,
}: PointFeatureProps) {
  const Icon = iconChoices.find(({ value }) => value === feature.properties.icon)?.Icon
    ?? iconChoices[0].Icon;
  const markerStyle = feature.properties.markerStyle ?? "pin";
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <g
          className={`map-feature map-marker ${selected ? "is-selected" : ""}`}
          transform={`translate(${point.x} ${point.y})`}
          onPointerDown={onPointerDown}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(svgEventPoint(event));
          }}
          role="button"
          aria-label={String(feature.properties.label ?? "Map pin")}
        >
          <MarkerGraphic style={markerStyle} color={color} Icon={Icon} />
        </g>
      </ContextMenuTrigger>
      {menu}
    </ContextMenu>
  );
}
