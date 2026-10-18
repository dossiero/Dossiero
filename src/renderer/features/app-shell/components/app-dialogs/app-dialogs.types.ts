import type {
  AppSettings,
  CaseInput,
  DossierApi,
  LinkItem,
  MediaItem,
  Person,
  PersonBundle,
  PersonInput,
  PersonTab,
  Relationship,
} from "@shared/types";
import type {
  PendingDelete,
  RelationPersonEdit,
} from "@/app/app.types";

export interface AppDialogsProps {
  api: DossierApi;
  settings: AppSettings;
  bundle: PersonBundle | null;
  activeTab: PersonTab | null;
  personDialog: Person | "add" | null;
  caseDialogOpen: boolean;
  relationPersonTarget: Person | null;
  relationPersonEdit: RelationPersonEdit;
  relationEdit: Relationship | null;
  archiveTarget: Person | null;
  tabDialogOpen: boolean;
  tabEdit: PersonTab | null;
  tabRemove: PersonTab | null;
  nextTabAfterRemoval?: PersonTab;
  linkDialog: LinkItem | "new" | null;
  mediaEdit: MediaItem | null;
  deleteTarget: PendingDelete;
  lightbox: MediaItem | null;
  settingsOpen: boolean;
  onPersonDialogChange: (person: Person | "add" | null) => void;
  onCaseDialogOpenChange: (open: boolean) => void;
  onRelationPersonTargetChange: (person: Person | null) => void;
  onRelationPersonEditChange: (edit: RelationPersonEdit) => void;
  onRelationEditChange: (relationship: Relationship | null) => void;
  onArchiveTargetChange: (person: Person | null) => void;
  onTabDialogOpenChange: (open: boolean) => void;
  onTabEditChange: (tab: PersonTab | null) => void;
  onTabRemoveChange: (tab: PersonTab | null) => void;
  onLinkDialogChange: (link: LinkItem | "new" | null) => void;
  onMediaEditChange: (mediaItem: MediaItem | null) => void;
  onDeleteTargetChange: (target: PendingDelete) => void;
  onLightboxChange: (mediaItem: MediaItem | null) => void;
  onSettingsOpenChange: (open: boolean) => void;
  onSavePerson: (input: PersonInput) => Promise<void>;
  onSaveCase: (input: CaseInput) => Promise<void>;
  onConfirmArchive: () => void;
  onSettingsUpdate: (settings: Partial<AppSettings>) => Promise<void>;
  run: (action: () => Promise<unknown>, message: string) => Promise<void>;
}
