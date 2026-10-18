import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Database from "better-sqlite3";
import type {
  AppSettings,
  CaseInput,
  CaseSummary,
  EditorDocumentData,
  LinkItem,
  MapDocument,
  MapFeature,
  MapLayerFolder,
  MediaItem,
  Person,
  PersonBundle,
  PersonInput,
  PersonStatus,
  PersonTab,
  RelationPosition,
  Relationship,
  SearchResult,
  SocialAccount,
  SocialAccountInput,
  TabIcon,
  TabKind,
  TextDocument,
  UploadFile,
} from "../shared/types.js";
import { migrateDatabase } from "./persistence/migrations.js";
import { seedDatabase } from "./persistence/seed.js";
import { SettingsStore } from "./settings/settings-store.js";
import { MediaStore } from "./media/media-store.js";
import { LinkStore } from "./links/link-store.js";
import { MapDocumentStore } from "./maps/map-document-store.js";
import { PeopleStore } from "./people/people-store.js";
import { openDatabase } from "./persistence/database.js";
import { RelationshipStore } from "./relations/relationship-store.js";
import { TabStore } from "./tabs/tab-store.js";
import { TextDocumentStore } from "./text/text-document-store.js";
import { CaseStore } from "./cases/case-store.js";
import { createBackupArchive } from "./backup/backup-archive.js";

export interface LinkFavicon {
  bytes: Buffer;
  mimeType: string;
}

export interface TemporaryBackup {
  path: string;
  cleanup: () => void;
}

export class DossierService {
  readonly dbPath: string;
  readonly mediaDir: string;
  private readonly sqlite: Database.Database;
  private readonly settingsStore: SettingsStore;
  private readonly caseStore: CaseStore;
  private readonly mediaStore: MediaStore;
  private readonly linkStore: LinkStore;
  private readonly mapDocumentStore: MapDocumentStore;
  private readonly peopleStore: PeopleStore;
  private readonly relationshipStore: RelationshipStore;
  private readonly tabStore: TabStore;
  private readonly textDocumentStore: TextDocumentStore;
  private readonly faviconRequests = new Map<string, Promise<LinkFavicon | null>>();
  private readonly failedFavicons = new Set<string>();

  constructor(dataDir: string, seed = true) {
    mkdirSync(dataDir, { recursive: true });
    this.dbPath = join(dataDir, "dossier.sqlite");
    const database = openDatabase(this.dbPath);
    this.sqlite = database.sqlite;
    migrateDatabase(this.sqlite);
    if (seed) {
      seedDatabase(database.orm);
    }
    this.mediaStore = new MediaStore(database.orm, dataDir);
    this.mediaDir = this.mediaStore.vault.root;
    this.linkStore = new LinkStore(database.orm);
    this.caseStore = new CaseStore(database.orm);
    this.mapDocumentStore = new MapDocumentStore(database.orm);
    this.peopleStore = new PeopleStore(database.orm, this.mediaStore);
    this.relationshipStore = new RelationshipStore(database.orm, this.mediaStore);
    this.settingsStore = new SettingsStore(database.orm);
    this.tabStore = new TabStore(database.orm, this.mediaStore);
    this.textDocumentStore = new TextDocumentStore(database.orm);
  }

  close() {
    this.sqlite.close();
  }

  listCases(): CaseSummary[] {
    return this.caseStore.listCases();
  }

  createCase(input: CaseInput): CaseSummary {
    return this.caseStore.createCase(input);
  }

  listPeople(
    query = "",
    status: PersonStatus = "active",
    includeRelated = false,
    caseId?: string,
  ): Person[] {
    return this.peopleStore.listPeople(query, status, includeRelated, caseId);
  }

  getPerson(id: string): PersonBundle | null {
    return this.peopleStore.getPerson(id);
  }

  createPerson(input: PersonInput, caseId?: string): PersonBundle {
    return this.peopleStore.createPerson(input, caseId);
  }

  createRelatedPerson(
    viewPersonId: string,
    tabId: string,
    ownerPersonId: string,
    relationType: string,
    input: PersonInput,
  ): PersonBundle {
    return this.relationshipStore.createRelatedPerson(
      viewPersonId,
      tabId,
      ownerPersonId,
      relationType,
      input,
    );
  }

  updateRelationship(id: string, relationType: string): Relationship {
    return this.relationshipStore.updateRelationship(id, relationType);
  }

  deleteRelationship(id: string): void {
    this.relationshipStore.deleteRelationship(id);
  }

  updateRelationPosition(
    viewPersonId: string,
    tabId: string,
    personId: string,
    x: number,
    y: number,
  ): RelationPosition {
    return this.relationshipStore.updateRelationPosition(viewPersonId, tabId, personId, x, y);
  }

  updatePerson(id: string, input: PersonInput): PersonBundle {
    return this.peopleStore.updatePerson(id, input);
  }

  setProfilePhoto(personId: string, mediaId: string): Person {
    return this.peopleStore.setProfilePhoto(personId, mediaId);
  }

  setPersonArchived(id: string, archived: boolean): Person {
    return this.peopleStore.setPersonArchived(id, archived);
  }

  setPersonPinned(id: string, pinned: boolean): Person {
    return this.peopleStore.setPersonPinned(id, pinned);
  }

  deletePerson(id: string): void {
    this.peopleStore.deletePerson(id);
  }

  createTab(personId: string, input: { name: string; kind: TabKind }): PersonTab {
    return this.tabStore.createTab(personId, input);
  }

  updateTab(
    id: string,
    input: { name?: string; icon?: TabIcon; position?: number },
  ): PersonTab {
    return this.tabStore.updateTab(id, input);
  }

  deleteTab(id: string): void {
    this.tabStore.deleteTab(id);
  }

  saveTextDocument(input: {
    personId: string;
    tabId: string;
    content: EditorDocumentData;
  }): TextDocument {
    return this.textDocumentStore.saveTextDocument(input);
  }

  saveMapDocument(input: {
    personId: string;
    tabId: string;
    features: MapFeature[];
    folders: MapLayerFolder[];
  }): MapDocument {
    return this.mapDocumentStore.saveMapDocument(input);
  }

  uploadMedia(personId: string, tabId: string, files: UploadFile[]): MediaItem[] {
    return this.mediaStore.uploadMedia(personId, tabId, files);
  }

  updateMedia(
    id: string,
    input: { caption?: string; notes?: string; sourceUrl?: string; tags?: string[] },
  ): MediaItem {
    return this.mediaStore.updateMedia(id, input);
  }

  deleteMedia(id: string): void {
    this.mediaStore.deleteMedia(id);
  }

  mediaPath(id: string): string | null {
    return this.mediaStore.mediaPath(id);
  }

  mediaItem(id: string): MediaItem | null {
    return this.mediaStore.mediaItem(id);
  }

  mediaMime(id: string): string | null {
    return this.mediaStore.mediaMime(id);
  }

  profileThumbnailPath(id: string): string | null {
    return this.mediaStore.profileThumbnailPath(id);
  }

  createLink(input: {
    personId: string;
    tabId: string;
    label: string;
    url: string;
    notes?: string;
  }): LinkItem {
    return this.linkStore.createLink(input);
  }

  updateLink(
    id: string,
    input: { label: string; url: string; notes?: string },
  ): LinkItem {
    return this.linkStore.updateLink(id, input);
  }

  deleteLink(id: string): void {
    this.linkStore.deleteLink(id);
  }

  async linkFavicon(id: string): Promise<LinkFavicon | null> {
    const link = this.linkStore.findLink(id);

    if (!link) {
      return null;
    }

    const hostname = new URL(link.url).hostname.toLowerCase();
    const cacheKey = createHash("sha256").update(hostname).digest("hex");
    const cached = this.mediaStore.vault.readFavicon(cacheKey);

    if (cached) {
      const mimeType = faviconMimeType(cached);

      if (!mimeType) {
        return null;
      }

      return {
        bytes: cached,
        mimeType,
      };
    }

    if (this.failedFavicons.has(cacheKey)) {
      return null;
    }

    const currentRequest = this.faviconRequests.get(cacheKey);

    if (currentRequest) {
      return currentRequest;
    }

    const request = this.fetchFavicon(hostname, cacheKey).finally(() => {
      this.faviconRequests.delete(cacheKey);
    });
    this.faviconRequests.set(cacheKey, request);

    return request;
  }

  search(query: string, caseId?: string): SearchResult[] {
    return this.peopleStore.search(query, caseId);
  }

  private async fetchFavicon(hostname: string, cacheKey: string): Promise<LinkFavicon | null> {
    try {
      const requestUrl = new URL("https://www.google.com/s2/favicons");
      requestUrl.searchParams.set("domain", hostname);
      requestUrl.searchParams.set("sz", "128");
      const response = await fetch(requestUrl, {
        signal: AbortSignal.timeout(5_000),
      });

      if (!response.ok) {
        throw new Error(`Favicon request failed with ${response.status}`);
      }

      const contentLength = Number(response.headers.get("content-length") ?? 0);

      if (contentLength > 512 * 1024) {
        throw new Error("Favicon response exceeded the size limit");
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      const mimeType = faviconMimeType(bytes);

      if (bytes.byteLength === 0 || bytes.byteLength > 512 * 1024 || !mimeType) {
        throw new Error("Favicon response was not a supported image");
      }

      this.mediaStore.vault.writeFavicon(cacheKey, bytes);

      return { bytes, mimeType };
    } catch {
      this.failedFavicons.add(cacheKey);
      return null;
    }
  }

  getSettings(): AppSettings {
    return this.settingsStore.getSettings();
  }

  updateSettings(raw: Partial<AppSettings>): AppSettings {
    return this.settingsStore.updateSettings(raw);
  }

  listSocialAccounts(): SocialAccount[] {
    return this.settingsStore.listSocialAccounts();
  }

  saveSocialAccount(
    input: Omit<SocialAccountInput, "password">,
    encryptedPassword?: Buffer,
  ): SocialAccount {
    return this.settingsStore.saveSocialAccount(input, encryptedPassword);
  }

  deleteSocialAccount(id: string) {
    this.settingsStore.deleteSocialAccount(id);
  }

  encryptedSocialPassword(id: string): Buffer | null {
    return this.settingsStore.encryptedSocialPassword(id);
  }

  async exportBackup(destination: string): Promise<void> {
    this.sqlite.pragma("wal_checkpoint(TRUNCATE)");
    await createBackupArchive({
      databasePath: this.dbPath,
      mediaDirectory: this.mediaDir,
      destination,
    });
  }

  async createTemporaryBackup(): Promise<TemporaryBackup> {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "dossiero-backup-download-"));
    const backupPath = join(temporaryDirectory, "dossiero-backup.zip");

    try {
      await this.exportBackup(backupPath);
      return {
        path: backupPath,
        cleanup: () => {
          rmSync(temporaryDirectory, {
            force: true,
            recursive: true,
          });
        },
      };
    } catch (error) {
      rmSync(temporaryDirectory, {
        force: true,
        recursive: true,
      });
      throw error;
    }
  }
  readMedia(id: string): Buffer | null {
    return this.mediaStore.readMedia(id);
  }
}

function faviconMimeType(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e) {
    return "image/png";
  }
  if (bytes.length >= 4 && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1) {
    return "image/x-icon";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes.length >= 6 && Buffer.from(bytes.subarray(0, 3)).toString("ascii") === "GIF") {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}
