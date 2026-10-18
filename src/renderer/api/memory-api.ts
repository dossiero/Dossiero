import type {
  ActionResult,
  AppSettings,
  ExternalBrowser,
  CaseInput,
  CaseSummary,
  DossierApi,
  LinkItem,
  MapDocument,
  MapFeature,
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
} from "../../shared/types";
import {
  GENERAL_CASE_DESCRIPTION,
  GENERAL_CASE_TITLE,
} from "../../shared/cases";
import { defaultTabIcon } from "@/lib/tab-icons";

const uid = () => crypto.randomUUID();
const stamp = () => new Date().toISOString();
const subjectId = "a1b2c3d4-e5f6-47a8-9012-3456789abcde";
const generalCaseId = uid();

export class MemoryApi implements DossierApi {
  readonly capabilities = {
    desktop: false,
    platform: "web",
    nativeFileDialog: false,
    showInFolder: false,
    openMediaFolder: false,
    persistentServer: false,
    secureCredentialStorage: false,
    loginItems: false,
    menuBarIcon: false,
  } as const;
  private cases: CaseSummary[] = [{
    id: generalCaseId,
    title: GENERAL_CASE_TITLE,
    description: GENERAL_CASE_DESCRIPTION,
    targetCount: 1,
    createdAt: "2026-09-18T21:14:00.000Z",
    updatedAt: "2026-09-18T21:14:00.000Z",
  }];
  private people: Person[] = [{
    id: subjectId,
    caseId: generalCaseId,
    name: "Mara Voss",
    aliases: ["M. Voss", "Kestrel"],
    birthDate: "1991-04-17",
    summary: "Independent systems researcher. Last verified contact originated in Lisbon.",
    profilePhotoId: null,
    status: "active",
    type: "default",
    pinned: false,
    createdAt: "2026-09-18T21:14:00.000Z",
    updatedAt: "2026-09-28T07:42:00.000Z",
  }];
  private tabs: PersonTab[] = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      personId: subjectId,
      name: "Info",
      kind: "text",
      icon: "file-text",
      position: 0,
      isDefault: true,
      createdAt: stamp(),
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      personId: subjectId,
      name: "Media",
      kind: "media",
      icon: "images",
      position: 1,
      isDefault: true,
      createdAt: stamp(),
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      personId: subjectId,
      name: "Links",
      kind: "links",
      icon: "link",
      position: 2,
      isDefault: true,
      createdAt: stamp(),
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      personId: subjectId,
      name: "Relation",
      kind: "relation",
      icon: "user",
      position: 3,
      isDefault: true,
      createdAt: stamp(),
    },
  ];
  private textDocuments: TextDocument[] = [{
    personId: subjectId,
    tabId: this.tabs[0].id,
    content: {
      blocks: [
        {
          type: "header",
          data: { text: "Operational note", level: 2 },
        },
        {
          type: "paragraph",
          data: {
            text: "Prefers asynchronous contact. Known to travel with minimal notice. "
              + "Verify all location reports before treating them as current.",
          },
        },
        {
          type: "header",
          data: { text: "Address / location", level: 2 },
        },
        {
          type: "paragraph",
          data: {
            text: "Last confirmed: Arroios, Lisbon. Previous: Kreuzberg, Berlin.",
          },
        },
      ],
    },
    body:
      "<h2>Operational note</h2><p>Prefers asynchronous contact. Known to travel with minimal notice. Verify all location reports before treating them as current.</p><h2>Address / location</h2><p>Last confirmed: Arroios, Lisbon. Previous: Kreuzberg, Berlin.</p>",
    updatedAt: stamp(),
  }];
  private media: MediaItem[] = [];
  private blobs = new Map<string, string>();
  private thumbnails = new Map<string, string>();
  private links: LinkItem[] = [{
    id: uid(),
    personId: subjectId,
    tabId: this.tabs[2].id,
    label: "Research archive",
    url: "https://example.com/archive",
    notes: "Public index; identity not independently verified.",
    syncStatus: "unsupported",
    syncMetadata: null,
    createdAt: stamp(),
    updatedAt: stamp(),
  }];
  private settings: AppSettings = {
    theme: "terminal",
    appearance: "dark",
    startAtLogin: false,
    showMenuBarIcon: false,
    showRelatedPeopleInSidebar: false,
    seedDismissed: false,
    externalBrowser: { kind: "system" },
  };
  private accounts: SocialAccount[] = [];
  private relationships: Relationship[] = [];
  private relationPositions: RelationPosition[] = [];
  private maps: MapDocument[] = [];
  async listCases() {
    return this.cases.map((caseItem) => ({
      ...caseItem,
      targetCount: this.people.filter((person) => (
        person.caseId === caseItem.id && person.status === "active"
      )).length,
    }));
  }
  async createCase(input: CaseInput) {
    const time = stamp();
    const caseItem: CaseSummary = {
      id: uid(),
      title: input.title.trim(),
      description: input.description.trim(),
      targetCount: 0,
      createdAt: time,
      updatedAt: time,
    };
    this.cases.push(caseItem);
    return caseItem;
  }
  async listPeople(
    query = "",
    status: PersonStatus = "active",
    includeRelated = false,
    caseId?: string,
  ) {
    const q = query.toLowerCase();
    return this.people.filter((p) =>
      p.status === status && (!caseId || p.caseId === caseId) &&
      (status !== "active" || includeRelated || p.type === "default") &&
      `${p.name} ${p.aliases.join(" ")} ${p.summary}`.toLowerCase().includes(q)
    );
  }
  async getPerson(id: string) {
    const person = this.people.find((item) => item.id === id);
    if (!person) return null;
    const rootTabs = this.tabs.filter((tab) => tab.personId === id && tab.kind === "relation").sort(
      (a, b) => a.position - b.position,
    );
    const activeIds = new Set(
      this.people.filter((item) => item.status === "active").map((item) => item.id),
    );
    const tabOwners = new Map(
      this.tabs.filter((tab) => tab.kind === "relation").map((tab) => [tab.id, tab.personId]),
    );
    const relationships: Relationship[] = [];
    rootTabs.forEach((rootTab, tabIndex) => {
      const reachable = new Set([id]);
      const included = new Set<string>();
      let changed = true;
      while (changed) {
        changed = false;
        for (const relation of this.relationships) {
          if (
            included.has(relation.id) || !reachable.has(relation.ownerPersonId) ||
            !activeIds.has(relation.relatedPersonId)
          ) continue;
          if (relation.ownerPersonId === id) {
            const legacyMisplaced = tabOwners.get(relation.tabId) !== id;
            if (relation.tabId !== rootTab.id && !(legacyMisplaced && tabIndex === 0)) continue;
          }
          included.add(relation.id);
          relationships.push({ ...relation, tabId: rootTab.id });
          if (!reachable.has(relation.relatedPersonId)) {
            reachable.add(relation.relatedPersonId);
            changed = true;
          }
        }
      }
    });
    const ids = new Set(relationships.map((item) => item.relatedPersonId));
    const relatedPeople = this.people.filter((item) =>
      ids.has(item.id) && item.status === "active"
    );
    return {
      person,
      tabs: this.tabs.filter((tab) => tab.personId === id).sort((a, b) => a.position - b.position),
      textDocuments: this.textDocuments.filter((document) => document.personId === id),
      maps: this.maps.filter((map) => map.personId === id),
      mediaItems: this.media.filter((item) => item.personId === id),
      links: this.links.filter((item) => item.personId === id),
      relationships,
      relatedPeople,
      relationPositions: this.relationPositions.filter((item) =>
        item.viewPersonId === id && rootTabs.some((tab) => tab.id === item.tabId) &&
        ids.has(item.personId)
      ),
    };
  }
  async createPerson(input: PersonInput, caseId?: string) {
    const owningCaseId = caseId ?? this.cases[0]?.id;
    if (!owningCaseId) throw new Error("Case not found");
    const time = stamp();
    const person: Person = {
      id: uid(),
      caseId: owningCaseId,
      name: input.name,
      aliases: input.aliases ?? [],
      birthDate: input.birthDate ?? null,
      summary: input.summary ?? "",
      profilePhotoId: null,
      status: "active",
      type: "default",
      pinned: false,
      createdAt: time,
      updatedAt: time,
    };
    this.people.unshift(person);
    const createdTabs = (["text", "media", "links", "relation"] as TabKind[]).map((
      kind,
      position,
    ) => ({
      id: uid(),
      personId: person.id,
      name: ["Info", "Media", "Links", "Relation"][position],
      kind,
      icon: defaultTabIcon(kind),
      position,
      isDefault: true,
      createdAt: time,
    }));
    this.tabs.push(...createdTabs);
    this.textDocuments.push({
      personId: person.id,
      tabId: createdTabs[0].id,
      content: { blocks: [] },
      body: "",
      updatedAt: time,
    });
    if (input.profilePhoto) await this.attachProfilePhoto(person, input);
    return (await this.getPerson(person.id))!;
  }
  async updatePerson(id: string, input: PersonInput) {
    const i = this.people.findIndex((p) => p.id === id);
    if (i < 0) throw new Error("Subject not found");
    const { profilePhoto: _photo, profileThumbnail: _thumbnail, ...fields } = input;
    this.people[i] = {
      ...this.people[i],
      ...fields,
      aliases: input.aliases ?? [],
      birthDate: input.birthDate ?? null,
      updatedAt: stamp(),
    };
    if (input.profilePhoto) await this.attachProfilePhoto(this.people[i], input);
    return (await this.getPerson(id))!;
  }
  async setProfilePhoto(personId: string, mediaId: string) {
    const person = this.people.find((item) => item.id === personId);
    const media = this.media.find((item) => item.id === mediaId);
    if (!media || media.personId !== personId) {
      throw new Error("Image does not belong to this subject");
    }
    if (!media.mimeType.startsWith("image/")) {
      throw new Error("Only images can be used as profile photos");
    }
    if (!person) throw new Error("Subject not found");
    person.profilePhotoId = mediaId;
    person.updatedAt = stamp();
    return person;
  }
  async setPersonArchived(id: string, archived: boolean) {
    const person = this.people.find((item) => item.id === id);
    if (!person) throw new Error("Subject not found");
    person.status = archived ? "archived" : "active";
    person.updatedAt = stamp();
    return person;
  }
  async setPersonPinned(id: string, pinned: boolean) {
    const person = this.people.find((item) => item.id === id);
    if (!person) throw new Error("Subject not found");
    person.pinned = pinned;
    return person;
  }
  async deletePerson(id: string) {
    this.people = this.people.filter((p) => p.id !== id);
    this.tabs = this.tabs.filter((t) => t.personId !== id);
    this.relationships = this.relationships.filter((item) =>
      item.ownerPersonId !== id && item.relatedPersonId !== id
    );
    this.relationPositions = this.relationPositions.filter((item) =>
      item.viewPersonId !== id && item.personId !== id
    );
  }
  async createRelatedPerson(
    viewPersonId: string,
    tabId: string,
    ownerPersonId: string,
    relationType: string,
    input: PersonInput,
  ) {
    if (
      !this.tabs.some((tab) =>
        tab.id === tabId && tab.personId === viewPersonId && tab.kind === "relation"
      )
    ) throw new Error("Relation tab not found");
    if (ownerPersonId !== viewPersonId) {
      const network = await this.getPerson(viewPersonId);
      if (
        !network?.relationships.some((relation) =>
          relation.tabId === tabId && relation.relatedPersonId === ownerPersonId
        )
      ) throw new Error("Connection target is not in this relation tab");
    }
    const ownerTabId = ownerPersonId === viewPersonId
      ? tabId
      : this.tabs.filter((tab) => tab.personId === ownerPersonId && tab.kind === "relation").sort((
        a,
        b,
      ) => Number(b.isDefault) - Number(a.isDefault) || a.position - b.position)[0]?.id;
    if (!ownerTabId) throw new Error("Connection target has no relation tab");
    const owner = this.people.find((person) => person.id === ownerPersonId);
    if (!owner) throw new Error("Connection target not found");
    const bundle = await this.createPerson(input, owner.caseId);
    bundle.person.type = "related";
    const time = stamp();
    this.relationships.push({
      id: uid(),
      tabId: ownerTabId,
      ownerPersonId,
      relatedPersonId: bundle.person.id,
      relationType: relationType.trim(),
      createdAt: time,
      updatedAt: time,
    });
    return (await this.getPerson(bundle.person.id))!;
  }
  async updateRelationship(id: string, relationType: string) {
    const item = this.relationships.find((relation) => relation.id === id);
    if (!item) throw new Error("Relationship not found");
    item.relationType = relationType.trim();
    item.updatedAt = stamp();
    return item;
  }
  async deleteRelationship(id: string) {
    this.relationships = this.relationships.filter((item) => item.id !== id);
  }
  async updateRelationPosition(
    viewPersonId: string,
    tabId: string,
    personId: string,
    x: number,
    y: number,
  ) {
    const item = {
      viewPersonId,
      tabId,
      personId,
      x: Math.max(.04, Math.min(.96, x)),
      y: Math.max(.06, Math.min(.94, y)),
    };
    this.relationPositions = [
      ...this.relationPositions.filter((position) =>
        position.viewPersonId !== viewPersonId || position.tabId !== tabId ||
        position.personId !== personId
      ),
      item,
    ];
    return item;
  }
  async createTab(personId: string, input: { name: string; kind: TabKind }) {
    const tab: PersonTab = {
      id: uid(),
      personId,
      ...input,
      icon: defaultTabIcon(input.kind),
      position: this.tabs.filter((t) => t.personId === personId).length,
      isDefault: false,
      createdAt: stamp(),
    };
    this.tabs.push(tab);
    if (input.kind === "text") {
      this.textDocuments.push({
        personId,
        tabId: tab.id,
        content: { blocks: [] },
        body: "",
        updatedAt: stamp(),
      });
    }
    if (input.kind === "map") {
      this.maps.push({
        type: "FeatureCollection",
        personId,
        tabId: tab.id,
        features: [],
        folders: [],
        updatedAt: stamp(),
      });
    }
    return tab;
  }
  async saveMapDocument(input: Parameters<DossierApi["saveMapDocument"]>[0]) {
    const document: MapDocument = { type: "FeatureCollection", ...input, updatedAt: stamp() };
    this.maps = [...this.maps.filter((map) => map.tabId !== input.tabId), document];
    return document;
  }
  async updateTab(id: string, input: { name?: string; icon?: TabIcon; position?: number }) {
    const tab = this.tabs.find((t) => t.id === id);
    if (!tab) throw new Error("Tab not found");
    Object.assign(tab, input);
    return tab;
  }
  async deleteTab(id: string) {
    const media = this.media.filter((item) => item.tabId === id);
    for (const item of media) {
      const url = this.blobs.get(item.id);
      if (url) URL.revokeObjectURL(url);
      this.blobs.delete(item.id);
      const thumbnail = this.thumbnails.get(item.id);
      if (thumbnail) URL.revokeObjectURL(thumbnail);
      this.thumbnails.delete(item.id);
      this.people.forEach((person) => {
        if (person.profilePhotoId === item.id) person.profilePhotoId = null;
      });
    }
    this.textDocuments = this.textDocuments.filter((item) => item.tabId !== id);
    this.maps = this.maps.filter((item) => item.tabId !== id);
    this.media = this.media.filter((item) => item.tabId !== id);
    this.links = this.links.filter((item) => item.tabId !== id);
    this.relationships = this.relationships.filter((item) => item.tabId !== id);
    this.relationPositions = this.relationPositions.filter((item) => item.tabId !== id);
    this.tabs = this.tabs.filter((t) => t.id !== id);
  }
  async saveTextDocument(input: Parameters<DossierApi["saveTextDocument"]>[0]) {
    const body = input.content.blocks.map((block) => {
      const text = typeof block.data.text === "string" ? block.data.text : "";

      return text ? `<p>${text}</p>` : "";
    }).join("");
    const document = { ...input, body, updatedAt: stamp() };
    this.textDocuments = [
      ...this.textDocuments.filter((item) => item.tabId !== input.tabId),
      document,
    ];
    return document;
  }
  async uploadMedia(personId: string, tabId: string, files: UploadFile[]) {
    const items = files.map((file) => {
      const id = uid();
      const item: MediaItem = {
        id,
        personId,
        tabId,
        originalName: file.name,
        storedName: id,
        mimeType: file.type,
        size: file.size,
        caption: "",
        notes: "",
        sourceUrl: "",
        tags: [],
        importedAt: stamp(),
      };
      const bytes = file.bytes instanceof Uint8Array
        ? file.bytes
        : Uint8Array.from(Array.isArray(file.bytes) ? file.bytes : Object.values(file.bytes));
      this.blobs.set(id, URL.createObjectURL(new Blob([bytes as BlobPart], { type: file.type })));
      return item;
    });
    this.media.unshift(...items);
    return items;
  }
  async updateMedia(
    id: string,
    input: { caption?: string; notes?: string; sourceUrl?: string; tags?: string[] },
  ) {
    const item = this.media.find((m) => m.id === id);
    if (!item) throw new Error("Media not found");
    Object.assign(item, input);
    return item;
  }
  async deleteMedia(id: string) {
    const url = this.blobs.get(id);
    if (url) URL.revokeObjectURL(url);
    const thumbnail = this.thumbnails.get(id);
    if (thumbnail) URL.revokeObjectURL(thumbnail);
    this.thumbnails.delete(id);
    this.people.forEach((person) => {
      if (person.profilePhotoId === id) person.profilePhotoId = null;
    });
    this.media = this.media.filter((m) => m.id !== id);
  }
  async readMediaBytes(id: string) {
    const url = this.blobs.get(id);
    if (!url) throw new Error("Media file not found");
    return new Uint8Array(await (await fetch(url)).arrayBuffer());
  }
  mediaUrl(item: Pick<MediaItem, "id">) {
    return this.blobs.get(item.id) ?? "";
  }
  profileThumbnailUrl(item: Pick<MediaItem, "id">) {
    return this.thumbnails.get(item.id) ?? this.mediaUrl(item);
  }
  linkIconUrl(_item: Pick<LinkItem, "id">) {
    return "";
  }
  async createLink(
    input: { personId: string; tabId: string; label: string; url: string; notes?: string },
  ) {
    const time = stamp();
    const link: LinkItem = {
      id: uid(),
      ...input,
      notes: input.notes ?? "",
      syncStatus: "unsupported",
      syncMetadata: null,
      createdAt: time,
      updatedAt: time,
    };
    this.links.unshift(link);
    return link;
  }
  async updateLink(id: string, input: { label: string; url: string; notes?: string }) {
    const item = this.links.find((l) => l.id === id);
    if (!item) throw new Error("Link not found");
    Object.assign(item, input, { notes: input.notes ?? "", updatedAt: stamp() });
    return item;
  }
  async deleteLink(id: string) {
    this.links = this.links.filter((l) => l.id !== id);
  }
  async search(query: string, caseId?: string): Promise<SearchResult[]> {
    const q = query.toLowerCase();
    return this.people.filter((p) => (
      p.status === "active"
      && (!caseId || p.caseId === caseId)
      && p.name.toLowerCase().includes(q)
    )).map(
      (p) => ({
        personId: p.id,
        personName: p.name,
        source: "person",
        title: p.name,
        excerpt: p.summary,
      }),
    );
  }
  async getSettings() {
    return this.settings;
  }
  async updateSettings(input: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...input };
    return this.settings;
  }
  async listExternalBrowsers(): Promise<ExternalBrowser[]> {
    return [];
  }
  async chooseExternalBrowser(): Promise<ExternalBrowser | null> {
    return null;
  }
  async listSocialAccounts() {
    return this.accounts;
  }
  async saveSocialAccount(input: SocialAccountInput) {
    const account: SocialAccount = {
      id: input.id ?? uid(),
      platform: input.platform,
      login: input.login,
      email: input.email,
      passwordStored: Boolean(input.password),
      updatedAt: stamp(),
    };
    this.accounts = [account, ...this.accounts.filter((item) => item.id !== account.id)];
    return account;
  }
  async deleteSocialAccount(id: string) {
    this.accounts = this.accounts.filter((item) => item.id !== id);
  }
  onOpenSettings() {
    return () => undefined;
  }
  async showMediaInFolder(): Promise<ActionResult> {
    return { ok: false, message: "Desktop only" };
  }
  async exportMedia(mediaId: string): Promise<ActionResult> {
    const item = this.media.find((media) => media.id === mediaId);
    const url = this.blobs.get(mediaId);
    if (!item || !url) return { ok: false, message: "Media file not found" };
    const a = document.createElement("a");
    a.href = url;
    a.download = item.originalName;
    a.click();
    return { ok: true, message: "Media exported" };
  }
  async openMediaFolder(): Promise<ActionResult> {
    return { ok: false, message: "Desktop only" };
  }
  async exportBackup(): Promise<ActionResult> {
    const blob = new Blob([
      JSON.stringify(
        {
          people: this.people,
          tabs: this.tabs,
          textDocuments: this.textDocuments,
          media: this.media,
          links: this.links,
        },
        null,
        2,
      ),
    ], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "dossiero-browser-backup.json";
    a.click();
    return { ok: true, message: "Browser snapshot exported" };
  }
  async chooseMedia() {
    return [];
  }
  private async attachProfilePhoto(person: Person, input: PersonInput) {
    const mediaTab = this.tabs.find((t) => t.personId === person.id && t.kind === "media")!;
    const [item] = await this.uploadMedia(person.id, mediaTab.id, [input.profilePhoto!]);
    if (person.profilePhotoId) {
      const previous = this.thumbnails.get(person.profilePhotoId);
      if (previous) URL.revokeObjectURL(previous);
      this.thumbnails.delete(person.profilePhotoId);
    }
    person.profilePhotoId = item.id;
    if (input.profileThumbnail) {
      const bytes = input.profileThumbnail.bytes instanceof Uint8Array
        ? input.profileThumbnail.bytes
        : Uint8Array.from(
          Array.isArray(input.profileThumbnail.bytes)
            ? input.profileThumbnail.bytes
            : Object.values(input.profileThumbnail.bytes),
        );
      this.thumbnails.set(
        item.id,
        URL.createObjectURL(new Blob([bytes as BlobPart], { type: input.profileThumbnail.type })),
      );
    }
  }
}
