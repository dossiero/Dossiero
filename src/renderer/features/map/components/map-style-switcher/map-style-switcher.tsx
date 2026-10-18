import type { MapTileStyle } from "@/features/map/map.types";
import { mapTileStyles } from "@/features/map/logic/map-tile-styles";
import "./map-style-switcher.css";

interface MapStyleSwitcherProps {
  tileStyle: MapTileStyle;
  onChange: (style: MapTileStyle) => void;
}

export function MapStyleSwitcher({ tileStyle, onChange }: MapStyleSwitcherProps) {
  const selectedStyle = mapTileStyles.find((style) => style.id === tileStyle)
    ?? mapTileStyles[0];

  return (
    <div
      className="map-style-switcher"
      role="radiogroup"
      aria-label="Map tile style"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className={`map-style-option preview-${selectedStyle.id} is-current`}
        role="radio"
        aria-checked="true"
        aria-label={`${selectedStyle.label} map style, current`}
        title={selectedStyle.description}
      >
        <span>{selectedStyle.label}</span>
      </button>
      <div className="map-style-variants">
        {mapTileStyles.filter((style) => style.id !== tileStyle).map((style) => (
          <button
            type="button"
            key={style.id}
            className={`map-style-option preview-${style.id}`}
            role="radio"
            aria-checked="false"
            aria-label={`${style.label} map style`}
            title={style.description}
            onClick={() => onChange(style.id)}
          >
            <span>{style.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
