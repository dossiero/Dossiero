import { Edit3, X } from "lucide-react";
import type { MapFeature } from "@shared/types";
import { Button } from "@/components/button/button";
import { FeatureMeasurements } from "@/features/map/components/feature-measurements/feature-measurements";
import type { MapFeatureKind } from "@/features/map/components/feature-details/feature-details.types";
import { sanitizeInlineRichText } from "@/lib/rich-text";
import "./feature-view.css";

interface FeatureViewProps {
  feature: MapFeature;
  kind: MapFeatureKind;
  label: string;
  description: string;
  onClose: () => void;
  onEdit: () => void;
}

export function FeatureView({
  feature,
  kind,
  label,
  description,
  onClose,
  onEdit,
}: FeatureViewProps) {
  return (
    <div className="map-feature-view">
      <header>
        <div>
          <strong>{label || `Untitled ${kind}`}</strong>
          <div
            className="map-feature-description"
            dangerouslySetInnerHTML={{
              __html: sanitizeInlineRichText(description) || "<span>No content yet.</span>",
            }}
          />
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X size={15} />
        </Button>
      </header>
      <footer className="map-detail-footer">
        <FeatureMeasurements feature={feature} />
        <Button
          className="map-detail-edit"
          variant="quiet"
          size="icon"
          onClick={onEdit}
          aria-label={`Edit ${kind}`}
        >
          <Edit3 size={13} />
        </Button>
      </footer>
    </div>
  );
}
