import type { ReactNode } from "react";
import type { MediaItem, Person, Relationship } from "@shared/types";
import type { RelationSelection } from "@/features/relations/components/relation-tab/relation-tab";

export type SelectedObject = MediaItem | RelationSelection | null;

export type PendingDelete = {
  label: string;
  confirmText?: string;
  description?: ReactNode;
  confirmLabel?: string;
  successMessage?: string;
  run: () => Promise<void>;
} | null;

export interface ReturnTargetValue {
  id: string;
  name: string;
  tabId: string | null;
}

export interface RelationPersonEditValue {
  person: Person;
  relationship: Relationship;
  targetName: string;
}

export type ReturnTarget = ReturnTargetValue | null;
export type RelationPersonEdit = RelationPersonEditValue | null;
