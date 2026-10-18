import type { CSSProperties } from "react";
import type { MapFeatureProperties } from "@shared/types";
import { MapColorPalette } from "@/features/map/components/color-palette/color-palette";
import type { MapPropertyChange } from "@/features/map/components/feature-details/feature-details.types";
import "./line-fields.css";

export function LineFields({
  properties,
  onPropertyChange,
}: {
  properties: MapFeatureProperties;
  onPropertyChange: MapPropertyChange;
}) {
  const lineWidth = Number(properties.lineWidth ?? 3);
  const rangeProgress = `${((lineWidth - 1) / 11) * 100}%`;
  return (
    <>
      <MapColorPalette
        label="LINE COLOR"
        value={String(properties.color ?? "#f0a52b")}
        onChange={(color) => onPropertyChange("color", color)}
      />
      <label>
        LINE TYPE
        <select
          className="ui-input"
          value={String(properties.lineStyle ?? "solid")}
          onChange={(event) => onPropertyChange("lineStyle", event.target.value)}
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </label>
      <label>
        LINE SIZE
        <input
          className="map-line-size"
          type="range"
          min="1"
          max="12"
          value={lineWidth}
          style={{ "--range-progress": rangeProgress } as CSSProperties}
          onChange={(event) => onPropertyChange("lineWidth", Number(event.target.value))}
        />
        <span>{lineWidth} px</span>
      </label>
    </>
  );
}
