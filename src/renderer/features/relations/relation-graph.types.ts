import type { Person, PersonTab, RelationPosition, Relationship } from "@shared/types";

export type RelationSelection = {
  kind: "relation-person";
  person: Person;
  relationship?: Relationship;
};

export type RelationViewMode = "graph" | "list";
export type RelationPoint = { x: number; y: number };
export type RelationCamera = { x: number; y: number; scale: number };

export interface RelationTabProps {
  tab: PersonTab;
  person: Person;
  people: Person[];
  relationships: Relationship[];
  positions: RelationPosition[];
  avatarUrl: (person: Person) => string | undefined;
  onAdd: () => void;
  onAddConnection: (person: Person) => void;
  onInspect: (selection: RelationSelection) => void;
  onOpenPerson: (person: Person) => void;
  onEditPerson: (person: Person, relationship?: Relationship) => void;
  onEditRelationship: (relationship: Relationship) => void;
  onDeleteRelationship: (relationship: Relationship) => void;
  onRemovePerson: (person: Person) => void;
  onMove: (personId: string, x: number, y: number) => void;
}
