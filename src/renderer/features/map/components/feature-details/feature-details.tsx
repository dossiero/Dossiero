import { useEffect, useRef, useState } from "react";
import type { MapFeature, MapFeatureProperties } from "@shared/types";
import { sanitizeInlineRichText } from "@/lib/rich-text";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/dropdown-menu/dropdown-menu";
import { FeatureEditForm } from "@/features/map/components/feature-edit-form/feature-edit-form";
import { FeatureView } from "@/features/map/components/feature-view/feature-view";
import type { ScreenPoint } from "@/features/map/map.types";
import "./feature-details.css";

interface FeatureDetailsProps {
  feature: MapFeature;
  anchor: ScreenPoint;
  collisionBoundary: HTMLElement | null;
  onPreview: (feature: MapFeature) => void;
  onSave: (feature: MapFeature) => void;
  onClose: () => void;
}

export function FeatureDetails({
  feature,
  anchor,
  collisionBoundary,
  onPreview,
  onSave,
  onClose,
}: FeatureDetailsProps) {
  const original = useRef(feature);
  const liveGeometry = useRef(feature.geometry);
  const editingRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [properties, setProperties] = useState<MapFeatureProperties>(feature.properties);

  useEffect(() => {
    original.current = feature;
    liveGeometry.current = feature.geometry;
    editingRef.current = false;
    setEditing(false);
    setLabel(String(feature.properties.label ?? ""));
    setDescription(String(feature.properties.description ?? ""));
    setProperties(feature.properties);
    return () => {
      if (editingRef.current) {
        onPreview({
          ...original.current,
          geometry: liveGeometry.current,
        });
      }
    };
    // Preview cleanup tracks feature identity, not the callback recreated by the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature.id]);

  liveGeometry.current = feature.geometry;

  const preview = (
    nextLabel: string,
    nextDescription: string,
    nextProperties: MapFeatureProperties,
  ) => {
    onPreview({
      ...original.current,
      properties: {
        ...nextProperties,
        label: nextLabel,
        description: sanitizeInlineRichText(nextDescription),
      },
    });
  };
  const setProperty = (key: keyof MapFeatureProperties, value: unknown) => {
    const next = { ...properties, [key]: value };
    setProperties(next);
    preview(label, description, next);
  };
  const cancel = () => {
    const originalProperties = original.current.properties;
    setLabel(String(originalProperties.label ?? ""));
    setDescription(String(originalProperties.description ?? ""));
    setProperties(originalProperties);
    onPreview({
      ...original.current,
      geometry: liveGeometry.current,
    });
    editingRef.current = false;
    setEditing(false);
  };
  const save = () => {
    const next = {
      ...original.current,
      geometry: liveGeometry.current,
      properties: {
        ...properties,
        label: label.trim(),
        description: sanitizeInlineRichText(description),
      },
    };
    original.current = next;
    editingRef.current = false;
    onSave(next);
    setEditing(false);
  };
  const kind = feature.geometry.type === "Point"
    ? "pin"
    : feature.geometry.type === "Polygon"
    ? "polygon"
    : "line";
  const close = () => {
    if (editing) {
      onPreview({
        ...original.current,
        geometry: liveGeometry.current,
      });
    }
    editingRef.current = false;
    onClose();
  };
  const startEditing = () => {
    editingRef.current = true;
    setEditing(true);
  };

  return (
    <Dropdown
      open
      modal={false}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DropdownTrigger asChild>
        <button
          className="map-feature-anchor"
          style={{ left: anchor.x, top: anchor.y }}
          aria-label={`${kind} details`}
        />
      </DropdownTrigger>
      <DropdownContent
        className="map-detail-card"
        align="center"
        side="top"
        sideOffset={kind === "pin" ? 58 : 10}
        avoidCollisions
        collisionBoundary={collisionBoundary}
        collisionPadding={8}
        sticky="always"
        onPointerDown={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
        onPointerDownOutside={(event) => {
          if (event.target instanceof Element && event.target.closest(".map-feature")) {
            event.preventDefault();
          }
        }}
      >
        {editing
          ? (
            <FeatureEditForm
              kind={kind}
              label={label}
              description={description}
              properties={properties}
              onLabelChange={(value) => {
                setLabel(value);
                preview(value, description, properties);
              }}
              onDescriptionChange={(value) => {
                setDescription(value);
                preview(label, value, properties);
              }}
              onPropertyChange={setProperty}
              onCancel={cancel}
              onSave={save}
            />
          )
          : (
            <FeatureView
              feature={feature}
              kind={kind}
              label={label}
              description={description}
              onClose={close}
              onEdit={startEditing}
            />
          )}
      </DropdownContent>
    </Dropdown>
  );
}
