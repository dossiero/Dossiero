import type {
  AppSettings,
  DossierApi,
  MediaItem,
  Person,
  PersonBundle,
  PersonTab,
  Relationship,
} from "@shared/types";
import type { PendingDelete, SelectedObject } from "@/app/app.types";

export interface ActiveTabContentProps {
  api: DossierApi;
  bundle: PersonBundle;
  tab: PersonTab;
  settings: AppSettings;
  run: (action: () => Promise<unknown>, message: string) => Promise<void>;
  desktopAction: (action: () => Promise<{ ok: boolean; message: string }>) => Promise<void>;
  onBundleChange: (updater: (bundle: PersonBundle) => PersonBundle) => void;
  onInspect: (selection: Exclude<SelectedObject, null>) => void;
  onRelationAdd: (person: Person) => void;
  onRelationPersonEdit: (person: Person, relationship?: Relationship) => void;
  onRelationEdit: (relationship: Relationship) => void;
  onRelatedPersonOpen: (person: Person) => void;
  onPersonArchive: (person: Person) => void;
  onRelationshipDelete: (relationship: Relationship, relatedName: string) => void;
  onRelationMove: (personId: string, x: number, y: number) => void;
  onNewLink: () => void;
  onEditLink: (link: PersonBundle["links"][number]) => void;
  onDeleteRequest: (request: Exclude<PendingDelete, null>) => void;
  onPreview: (item: MediaItem) => void;
}
