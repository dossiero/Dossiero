import { dossierColorChoices } from "@/lib/color-palette";
import "./color-palette.css";

interface MapColorPaletteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const mapColorChoices = dossierColorChoices;

export function MapColorPalette({ label, value, onChange }: MapColorPaletteProps) {
  return (
    <fieldset className="map-color-field">
      <legend>{label}</legend>
      <div className="map-color-palette" role="radiogroup" aria-label={label}>
        {mapColorChoices.map((choice) => (
          <button
            key={choice.value}
            type="button"
            className={`map-color-swatch ${value === choice.value ? "is-active" : ""}`}
            style={{ backgroundColor: choice.value }}
            onClick={() => onChange(choice.value)}
            role="radio"
            aria-checked={value === choice.value}
            aria-label={choice.label}
            title={choice.label}
          />
        ))}
      </div>
    </fieldset>
  );
}
