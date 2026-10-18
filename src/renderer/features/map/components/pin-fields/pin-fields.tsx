import type { MapFeatureProperties } from "@shared/types";
import { MapColorPalette } from "@/features/map/components/color-palette/color-palette";
import type { MapPropertyChange } from "@/features/map/components/feature-details/feature-details.types";
import { iconChoices, markerChoices } from "@/features/map/logic/marker-options";
import "./pin-fields.css";

export function PinFields({
  properties,
  onPropertyChange,
}: {
  properties: MapFeatureProperties;
  onPropertyChange: MapPropertyChange;
}) {
  return (
    <>
      <label>
        ICON
        <div className="map-icon-picker">
          {iconChoices.map(({ value, Icon }) => (
            <button
              key={value}
              type="button"
              className={properties.icon === value ? "is-active" : ""}
              onClick={() => onPropertyChange("icon", value)}
              aria-label={value}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </label>
      <label>
        PIN FORM
        <div className="map-icon-picker">
          {markerChoices.map(({ value, Icon }) => (
            <button
              key={value}
              type="button"
              className={(properties.markerStyle ?? "pin") === value ? "is-active" : ""}
              onClick={() => onPropertyChange("markerStyle", value)}
              aria-label={`${value} pin`}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </label>
      <MapColorPalette
        label="PIN COLOR"
        value={String(properties.color ?? "#d84a45")}
        onChange={(color) => onPropertyChange("color", color)}
      />
    </>
  );
}
