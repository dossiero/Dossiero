import { useRef } from "react";
import { Download, Import, MoreHorizontal } from "lucide-react";
import type { MapFeature } from "@shared/types";
import { Button } from "@/components/button/button";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from "@/components/dropdown-menu/dropdown-menu";
import { Tooltip } from "@/components/tooltip/tooltip";
import { ProfileContentHeader } from "@/components/profile-content-header/profile-content-header";
import { exportGeoJson, exportKmz } from "@/features/map/logic/export";
import "./map-header.css";

interface MapHeaderProps {
  features: MapFeature[];
  saveState: "saved" | "saving" | "error";
  title: string;
  onImport: (file: File) => void;
}

export function MapHeader({ features, saveState, title, onImport }: MapHeaderProps) {
  const importInputRef = useRef<HTMLInputElement>(null);

  return (
    <ProfileContentHeader
      className="map-head"
      eyebrow={
        <>GEOSPATIAL_CANVAS / FEATURES:{String(features.length).padStart(2, "0")}</>
      }
      title={title}
      actions={(
        <div className="map-head-actions">
        {saveState !== "saved" && (
          <span className={`document-save-state is-${saveState}`}>
            {saveState === "saving" ? "Saving…" : "Import or save failed"}
          </span>
        )}
        <input
          ref={importInputRef}
          hidden
          type="file"
          accept=".geojson,.json,.kml,.kmz,application/geo+json,application/json,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImport(file);
            }
            event.target.value = "";
          }}
        />
        <Dropdown>
          <Tooltip label="Map actions">
            <DropdownTrigger asChild>
              <Button
                className="map-actions-button"
                variant="quiet"
                size="icon"
                aria-label="Map actions"
              >
                <MoreHorizontal size={15} />
              </Button>
            </DropdownTrigger>
          </Tooltip>
          <DropdownContent align="end">
            <DropdownItem onSelect={() => importInputRef.current?.click()}>
              <Import size={13} /> Import
            </DropdownItem>
            <DropdownItem onSelect={() => exportGeoJson(features, title)}>
              <Download size={13} /> Export GeoJSON
            </DropdownItem>
            <DropdownItem onSelect={() => exportKmz(features, title)}>
              <Download size={13} /> Export KMZ
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
        </div>
      )}
    />
  );
}
