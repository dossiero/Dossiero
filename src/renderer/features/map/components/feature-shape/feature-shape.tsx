import type { PointerEvent as ReactPointerEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { GeoJsonPosition, MapFeature } from "@shared/types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/context-menu/context-menu";
import { featureAnchor, shouldShowFeatureHandles } from "@/features/map/logic/geometry";
import { FeatureHandles } from "@/features/map/components/feature-handles/feature-handles";
import { PointFeature } from "@/features/map/components/point-feature/point-feature";
import { svgEventPoint } from "./feature-shape.logic";
import type { ScreenPoint } from "@/features/map/map.types";
import "./feature-shape.css";

interface FeatureShapeProps {
  feature: MapFeature;
  project: (point: GeoJsonPosition) => ScreenPoint;
  selected: boolean;
  onSelect: (point: ScreenPoint) => void;
  onDelete: () => void;
  onPointerDown: (event: ReactPointerEvent<SVGElement>) => void;
  onPolygonPointDown: (
    event: ReactPointerEvent<SVGCircleElement>,
    vertexIndex: number,
    insert: boolean,
  ) => void;
}

export function FeatureShape({
  feature,
  project,
  selected,
  onSelect,
  onDelete,
  onPointerDown,
  onPolygonPointDown,
}: FeatureShapeProps) {
  const color = String(
    feature.properties.color ??
    feature.properties.fillColor ??
    feature.properties.strokeColor ??
    "#f0a52b",
  );
  const kind = feature.geometry.type === "Point"
    ? "pin"
    : feature.geometry.type === "Polygon"
    ? "polygon"
    : "line";
  const menu = (
    <ContextMenuContent>
      <ContextMenuItem onSelect={() => onSelect(project(featureAnchor(feature)))}>
        <Pencil size={13} /> Edit {kind}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onSelect={onDelete} danger>
        <Trash2 size={13} /> Delete {kind}
      </ContextMenuItem>
    </ContextMenuContent>
  );
  if (feature.geometry.type === "Point") {
    return (
      <PointFeature
        feature={feature}
        color={color}
        point={project(feature.geometry.coordinates)}
        selected={selected}
        menu={menu}
        onSelect={onSelect}
        onPointerDown={onPointerDown}
      />
    );
  }
  const points = feature.geometry.type === "LineString"
    ? feature.geometry.coordinates
    : feature.geometry.coordinates[0];
  const path = points
    .map((point, index) => `${index ? "L" : "M"} ${project(point).x} ${project(point).y}`)
    .join(" ") + (feature.geometry.type === "Polygon" ? " Z" : "");
  const lineStyle = String(feature.properties.lineStyle ?? "solid");
  let dash: string | undefined;
  if (lineStyle === "dashed") {
    dash = "10 7";
  } else if (lineStyle === "dotted") {
    dash = "2 6";
  }
  const fill = feature.geometry.type === "Polygon" ? `${color}55` : "none";
  const editableVertices = feature.geometry.type === "Polygon" ? points.slice(0, -1) : points;
  const editableScreenPoints = editableVertices.map(project);
  const showHandles = feature.properties.shape !== "freehand" &&
    shouldShowFeatureHandles(
      editableScreenPoints,
      feature.geometry.type === "Polygon",
    );
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <g
          className={`map-feature-group ${selected ? "is-selected" : ""}`}
          onPointerDown={onPointerDown}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(svgEventPoint(event));
          }}
          role="button"
          aria-label={String(feature.properties.label ?? `Map ${kind}`)}
        >
          <path
            className="map-feature-outline"
            d={path}
            strokeWidth={Number(feature.properties.lineWidth ?? 3) + 5}
            fill="none"
          />
          <path
            className="map-feature map-vector"
            d={path}
            stroke={color}
            strokeWidth={Number(feature.properties.lineWidth ?? 3)}
            strokeDasharray={dash}
            fill={fill}
            data-geometry={feature.geometry.type}
          />
          {showHandles && (
            <FeatureHandles
              points={editableScreenPoints}
              color={color}
              closed={feature.geometry.type === "Polygon"}
              onPointerDown={onPolygonPointDown}
            />
          )}
        </g>
      </ContextMenuTrigger>
      {menu}
    </ContextMenu>
  );
}
