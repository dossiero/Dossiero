import { type FormEvent, useState } from "react";
import type { MapFeatureProperties } from "@shared/types";
import { sanitizeInlineRichText } from "@/lib/rich-text";
import { Button } from "@/components/button/button";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/dropdown-menu/dropdown-menu";
import { Input } from "@/components/form-control/form-control";
import { iconChoices, markerChoices } from "@/features/map/logic/marker-options";
import { InlineEditor } from "@/features/map/components/inline-editor/inline-editor";
import { MapColorPalette } from "@/features/map/components/color-palette/color-palette";
import type { ScreenPoint } from "@/features/map/map.types";
import "./pin-dropdown.css";

interface PinDropdownProps {
  draft: { screen: ScreenPoint };
  onAdd: (properties: MapFeatureProperties) => void;
  onCancel: () => void;
}

export function PinDropdown({ draft, onAdd, onCancel }: PinDropdownProps) {
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("pin");
  const [color, setColor] = useState("#d84a45");
  const [markerStyle, setMarkerStyle] = useState<MapFeatureProperties["markerStyle"]>("pin");
  const [description, setDescription] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onAdd({
      label: label.trim(),
      icon,
      color,
      markerStyle,
      description: sanitizeInlineRichText(description),
    });
  };
  return (
    <Dropdown
      open
      modal={false}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DropdownTrigger asChild>
        <button
          className="map-pin-anchor"
          style={{ left: draft.screen.x, top: draft.screen.y }}
          aria-label="Pin properties"
        />
      </DropdownTrigger>
      <DropdownContent onWheel={(event) => event.stopPropagation()}>
        <form
          className="map-pin-form"
          onSubmit={submit}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <strong>ADD MAP PIN</strong>
          <label>
            TITLE<Input
              autoFocus
              maxLength={160}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Location title"
            />
          </label>
          <label>
            PIN FORM<div className="map-icon-picker">
              {markerChoices.map(({ value, Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={markerStyle === value ? "is-active" : ""}
                  onClick={() => setMarkerStyle(value)}
                  aria-label={`${value} pin`}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </label>
          <label>
            ICON<div className="map-icon-picker">
              {iconChoices.map(({ value, Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={icon === value ? "is-active" : ""}
                  onClick={() => setIcon(value)}
                  aria-label={value}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </label>
          <MapColorPalette label="COLOR" value={color} onChange={setColor} />
          <label>
            CONTENT<InlineEditor value={description} onChange={setDescription} />
          </label>
          <div className="map-form-actions">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
            <Button type="submit" variant="signal" size="sm">Add pin</Button>
          </div>
        </form>
      </DropdownContent>
    </Dropdown>
  );
}
