export type ThemeName = "terminal";
export type Appearance = "light" | "dark" | "system";
export type PersonStatus = "active" | "archived";
export type PersonType = "default" | "related";
export type TabKind = "text" | "media" | "links" | "relation" | "map";
export type TabIcon =
  | "file-text"
  | "images"
  | "link"
  | "user"
  | "book"
  | "briefcase"
  | "calendar"
  | "map-pin"
  | "star"
  | "tag"
  | "folder"
  | "camera"
  | "globe"
  | "shield";
export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "x"
  | "tiktok"
  | "linkedin"
  | "reddit"
  | "other";

export interface Capabilities {
  desktop: boolean;
  platform: "darwin" | "win32" | "linux" | "web";
  nativeFileDialog: boolean;
  showInFolder: boolean;
  openMediaFolder: boolean;
  persistentServer: boolean;
  secureCredentialStorage: boolean;
  loginItems: boolean;
  menuBarIcon: boolean;
}

export interface ExternalBrowser {
  name: string;
  path: string;
}

export type ExternalBrowserPreference =
  | { kind: "system" }
  | { kind: "application"; name: string; path: string };

export interface Person {
  id: string;
  caseId: string;
  name: string;
  aliases: string[];
  birthDate: string | null;
  summary: string;
  profilePhotoId: string | null;
  status: PersonStatus;
  type: PersonType;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CaseSummary {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CaseInput {
  title: string;
  description: string;
}

export interface PersonInput {
  name: string;
  aliases?: string[];
  birthDate?: string | null;
  summary?: string;
  profilePhoto?: UploadFile;
  profileThumbnail?: UploadFile;
}

export interface PersonTab {
  id: string;
  personId: string;
  name: string;
  kind: TabKind;
  icon: TabIcon;
  position: number;
  isDefault: boolean;
  createdAt: string;
}

export interface TextDocument {
  personId: string;
  tabId: string;
  content: EditorDocumentData;
  body: string;
  updatedAt: string;
}

export interface EditorBlock {
  id?: string;
  type: string;
  data: Record<string, unknown>;
  tunes?: Record<string, unknown>;
}

export interface EditorDocumentData {
  time?: number;
  blocks: EditorBlock[];
  version?: string;
}

export interface MediaItem {
  id: string;
  personId: string;
  tabId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  caption: string;
  notes: string;
  sourceUrl: string;
  tags: string[];
  importedAt: string;
}

export interface LinkItem {
  id: string;
  personId: string;
  tabId: string;
  label: string;
  url: string;
  notes: string;
  syncStatus: "unsupported" | "ready";
  syncMetadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  tabId: string;
  ownerPersonId: string;
  relatedPersonId: string;
  relationType: string;
  createdAt: string;
  updatedAt: string;
}

export interface RelationPosition {
  viewPersonId: string;
  tabId: string;
  personId: string;
  x: number;
  y: number;
}

export type GeoJsonPosition = [number, number];
export type MapGeometry =
  | { type: "Point"; coordinates: GeoJsonPosition }
  | { type: "LineString"; coordinates: GeoJsonPosition[] }
  | { type: "Polygon"; coordinates: GeoJsonPosition[][] };

export interface MapFeatureProperties {
  label?: string;
  description?: string;
  color?: string;
  fillColor?: string;
  strokeColor?: string;
  lineStyle?: "solid" | "dashed" | "dotted";
  lineWidth?: number;
  icon?: string;
  markerStyle?: "pin" | "circle" | "square" | "star" | "triangle";
  folderId?: string;
  hidden?: boolean;
  layerOrder?: number;
  shape?: "pin" | "freehand" | "line" | "rectangle" | "polygon";
  [key: string]: unknown;
}

export interface MapFeature {
  type: "Feature";
  id: string;
  geometry: MapGeometry;
  properties: MapFeatureProperties;
}

export interface MapDocument {
  type: "FeatureCollection";
  personId: string;
  tabId: string;
  features: MapFeature[];
  folders: MapLayerFolder[];
  updatedAt: string;
}

export interface MapLayerFolder {
  id: string;
  name: string;
  hidden: boolean;
  parentId?: string;
  order?: number;
}

export interface PersonBundle {
  person: Person;
  tabs: PersonTab[];
  textDocuments: TextDocument[];
  mediaItems: MediaItem[];
  links: LinkItem[];
  relationships: Relationship[];
  relatedPeople: Person[];
  relationPositions: RelationPosition[];
  maps: MapDocument[];
}

export interface AppSettings {
  theme: ThemeName;
  appearance: Appearance;
  startAtLogin: boolean;
  showMenuBarIcon: boolean;
  showRelatedPeopleInSidebar: boolean;
  seedDismissed: boolean;
  externalBrowser: ExternalBrowserPreference;
}

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  login: string;
  email: string;
  passwordStored: boolean;
  updatedAt: string;
}

export interface SocialAccountInput {
  id?: string;
  platform: SocialPlatform;
  login: string;
  email: string;
  password?: string;
}

export interface SearchResult {
  personId: string;
  personName: string;
  source: "person" | "text";
  title: string;
  excerpt: string;
}

export interface UploadFile {
  name: string;
  type: string;
  size: number;
  bytes: Uint8Array | number[] | Record<string, number>;
}

export interface ActionResult {
  ok: boolean;
  message: string;
  path?: string;
}

export interface DossierApi {
  readonly capabilities: Capabilities;
  listCases(): Promise<CaseSummary[]>;
  createCase(input: CaseInput): Promise<CaseSummary>;
  listPeople(
    query?: string,
    status?: PersonStatus,
    includeRelated?: boolean,
    caseId?: string,
  ): Promise<Person[]>;
  getPerson(id: string): Promise<PersonBundle | null>;
  createPerson(input: PersonInput, caseId?: string): Promise<PersonBundle>;
  updatePerson(id: string, input: PersonInput): Promise<PersonBundle>;
  setProfilePhoto(personId: string, mediaId: string): Promise<Person>;
  setPersonArchived(id: string, archived: boolean): Promise<Person>;
  setPersonPinned(id: string, pinned: boolean): Promise<Person>;
  deletePerson(id: string): Promise<void>;
  createRelatedPerson(
    viewPersonId: string,
    tabId: string,
    ownerPersonId: string,
    relationType: string,
    input: PersonInput,
  ): Promise<PersonBundle>;
  updateRelationship(id: string, relationType: string): Promise<Relationship>;
  deleteRelationship(id: string): Promise<void>;
  updateRelationPosition(
    viewPersonId: string,
    tabId: string,
    personId: string,
    x: number,
    y: number,
  ): Promise<RelationPosition>;
  saveMapDocument(
    input: { personId: string; tabId: string; features: MapFeature[]; folders: MapLayerFolder[] },
  ): Promise<MapDocument>;
  createTab(personId: string, input: { name: string; kind: TabKind }): Promise<PersonTab>;
  updateTab(
    id: string,
    input: { name?: string; icon?: TabIcon; position?: number },
  ): Promise<PersonTab>;
  deleteTab(id: string): Promise<void>;
  saveTextDocument(
    input: { personId: string; tabId: string; content: EditorDocumentData },
  ): Promise<TextDocument>;
  uploadMedia(personId: string, tabId: string, files: UploadFile[]): Promise<MediaItem[]>;
  updateMedia(
    id: string,
    input: { caption?: string; notes?: string; sourceUrl?: string; tags?: string[] },
  ): Promise<MediaItem>;
  deleteMedia(id: string): Promise<void>;
  readMediaBytes(id: string): Promise<Uint8Array>;
  mediaUrl(item: Pick<MediaItem, "id">): string;
  profileThumbnailUrl(item: Pick<MediaItem, "id">): string;
  linkIconUrl(item: Pick<LinkItem, "id">): string;
  createLink(
    input: { personId: string; tabId: string; label: string; url: string; notes?: string },
  ): Promise<LinkItem>;
  updateLink(id: string, input: { label: string; url: string; notes?: string }): Promise<LinkItem>;
  deleteLink(id: string): Promise<void>;
  search(query: string, caseId?: string): Promise<SearchResult[]>;
  getSettings(): Promise<AppSettings>;
  updateSettings(input: Partial<AppSettings>): Promise<AppSettings>;
  listExternalBrowsers(): Promise<ExternalBrowser[]>;
  chooseExternalBrowser(): Promise<ExternalBrowser | null>;
  listSocialAccounts(): Promise<SocialAccount[]>;
  saveSocialAccount(input: SocialAccountInput): Promise<SocialAccount>;
  deleteSocialAccount(id: string): Promise<void>;
  onOpenSettings(callback: () => void): () => void;
  showMediaInFolder(mediaId: string): Promise<ActionResult>;
  exportMedia(mediaId: string): Promise<ActionResult>;
  openMediaFolder(): Promise<ActionResult>;
  exportBackup(): Promise<ActionResult>;
  chooseMedia(personId: string, tabId: string): Promise<MediaItem[]>;
}
