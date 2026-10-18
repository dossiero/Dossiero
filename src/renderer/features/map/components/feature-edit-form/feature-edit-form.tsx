import { X } from "lucide-react";
import type { MapFeatureProperties } from "@shared/types";
import { Button } from "@/components/button/button";
import { Input } from "@/components/form-control/form-control";
import { InlineEditor } from "@/features/map/components/inline-editor/inline-editor";
import { LineFields } from "@/features/map/components/line-fields/line-fields";
import { MapColorPalette } from "@/features/map/components/color-palette/color-palette";
import { PinFields } from "@/features/map/components/pin-fields/pin-fields";
import type {
  MapFeatureKind,
  MapPropertyChange,
} from "@/features/map/components/feature-details/feature-details.types";
import "./feature-edit-form.css";

interface FeatureEditFormProps {
  kind: MapFeatureKind;
  label: string;
  description: string;
  properties: MapFeatureProperties;
  onLabelChange: (label: string) => void;
  onDescriptionChange: (description: string) => void;
  onPropertyChange: MapPropertyChange;
  onCancel: () => void;
  onSave: () => void;
}

export function FeatureEditForm({
  kind,
  label,
  description,
  properties,
  onLabelChange,
  onDescriptionChange,
  onPropertyChange,
  onCancel,
  onSave,
}: FeatureEditFormProps) {
  return (
    <form
      className="map-feature-edit"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <header>
        <div>
          <span className="eyebrow">// EDIT {kind.toUpperCase()}</span>
          <strong>Properties</strong>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          aria-label="Cancel editing"
        >
          <X size={15} />
        </Button>
      </header>
      <label>
        TITLE
        <Input
          autoFocus
          maxLength={160}
          value={label}
          onChange={(event) => onLabelChange(event.target.value)}
        />
      </label>
      <label>
        CONTENT
        <InlineEditor value={description} onChange={onDescriptionChange} />
      </label>
      {kind === "pin" && (
        <PinFields properties={properties} onPropertyChange={onPropertyChange} />
      )}
      {kind === "line" && (
        <LineFields properties={properties} onPropertyChange={onPropertyChange} />
      )}
      {kind === "polygon" && (
        <MapColorPalette
          label="COLOR"
          value={String(properties.color ?? properties.fillColor ?? "#f0a52b")}
          onChange={(color) => onPropertyChange("color", color)}
        />
      )}
      <div className="map-form-actions">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="signal" size="sm">Save</Button>
      </div>
    </form>
  );
}
