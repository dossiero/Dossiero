import type {
  AppSettings,
  ExternalBrowser,
  CaseInput,
  MapFeature,
  MapLayerFolder,
  PersonInput,
  PersonStatus,
  SocialAccountInput,
  TabIcon,
  TabKind,
  UploadFile,
  EditorDocumentData,
} from "./types.js";

export const IPC_CHANNELS = [
  "cases:list",
  "cases:create",
  "people:list",
  "people:get",
  "people:create",
  "people:update",
  "people:profile-photo",
  "people:archive",
  "people:pin",
  "people:delete",
  "relations:create-person",
  "relations:update",
  "relations:delete",
  "relations:position",
  "tabs:create",
  "tabs:update",
  "tabs:delete",
  "text:save",
  "maps:save",
  "media:upload",
  "media:update",
  "media:delete",
  "media:read",
  "media:choose",
  "media:reveal",
  "media:export",
  "media:folder",
  "links:create",
  "links:update",
  "links:delete",
  "search",
  "settings:get",
  "settings:update",
  "browsers:list",
  "browsers:choose",
  "accounts:list",
  "accounts:save",
  "accounts:delete",
  "backup:export",
] as const;

export type IpcChannel = typeof IPC_CHANNELS[number];

export interface IpcPayloads {
  "cases:list": Record<string, never>;
  "cases:create": CaseInput;
  "people:list": {
    query?: string;
    status?: PersonStatus;
    includeRelated?: boolean;
    caseId?: string;
  };
  "people:get": { id: string };
  "people:create": { input: PersonInput; caseId?: string };
  "people:update": { id: string; input: PersonInput };
  "people:profile-photo": { personId: string; mediaId: string };
  "people:archive": { id: string; archived: boolean };
  "people:pin": { id: string; pinned: boolean };
  "people:delete": { id: string };
  "relations:create-person": {
    viewPersonId: string;
    tabId: string;
    ownerPersonId: string;
    relationType: string;
    input: PersonInput;
  };
  "relations:update": { id: string; relationType: string };
  "relations:delete": { id: string };
  "relations:position": {
    viewPersonId: string;
    tabId: string;
    personId: string;
    x: number;
    y: number;
  };
  "tabs:create": { personId: string; input: { name: string; kind: TabKind } };
  "tabs:update": { id: string; input: { name?: string; icon?: TabIcon; position?: number } };
  "tabs:delete": { id: string };
  "text:save": { personId: string; tabId: string; content: EditorDocumentData };
  "maps:save": {
    personId: string;
    tabId: string;
    features: MapFeature[];
    folders: MapLayerFolder[];
  };
  "media:upload": { personId: string; tabId: string; files: UploadFile[] };
  "media:update": {
    id: string;
    input: { caption?: string; notes?: string; sourceUrl?: string; tags?: string[] };
  };
  "media:delete": { id: string };
  "media:read": { id: string };
  "media:choose": { personId: string; tabId: string };
  "media:reveal": { id: string };
  "media:export": { id: string };
  "media:folder": Record<string, never>;
  "links:create": { personId: string; tabId: string; label: string; url: string; notes?: string };
  "links:update": { id: string; input: { label: string; url: string; notes?: string } };
  "links:delete": { id: string };
  "search": { query: string; caseId?: string };
  "settings:get": Record<string, never>;
  "settings:update": Partial<AppSettings>;
  "browsers:list": Record<string, never>;
  "browsers:choose": Record<string, never>;
  "accounts:list": Record<string, never>;
  "accounts:save": SocialAccountInput;
  "accounts:delete": { id: string };
  "backup:export": Record<string, never>;
}

export interface DossierBridge {
  readonly platform: "darwin" | "win32" | "linux";
  invoke<C extends IpcChannel>(channel: C, payload: IpcPayloads[C]): Promise<unknown>;
  onOpenSettings(callback: () => void): () => void;
  isFullScreen(): Promise<boolean>;
  onFullScreenChange(callback: (fullScreen: boolean) => void): () => void;
}
