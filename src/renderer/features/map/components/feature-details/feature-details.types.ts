import type { MapFeatureProperties } from "@shared/types";

export type MapFeatureKind = "pin" | "line" | "polygon";
export type MapPropertyChange = (
  key: keyof MapFeatureProperties,
  value: unknown,
) => void;
