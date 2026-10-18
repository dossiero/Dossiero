import { useState } from "react";
import type { ScreenPoint } from "@/features/map/map.types";

export function useMapSelection(removeFeatures: (featureIds: string[]) => void) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [detailsAnchor, setDetailsAnchor] = useState<ScreenPoint | null>(null);
  const resetSelection = () => {
    setSelectedId(null);
    setDetailsId(null);
    setDetailsAnchor(null);
  };
  const deleteFeature = (featureId: string) => {
    removeFeatures([featureId]);
    setSelectedId((current) => current === featureId ? null : current);
    setDetailsId((current) => current === featureId ? null : current);
  };
  const deleteFeatures = (featureIds: string[]) => {
    const deletedIds = new Set(featureIds);
    removeFeatures(featureIds);
    setSelectedId((current) => current && deletedIds.has(current) ? null : current);
    setDetailsId((current) => current && deletedIds.has(current) ? null : current);
  };
  return { selectedId, setSelectedId, detailsId, setDetailsId, detailsAnchor, setDetailsAnchor, resetSelection, deleteFeature, deleteFeatures };
}
