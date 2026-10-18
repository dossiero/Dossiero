import type { DossierBridge, IpcChannel, IpcPayloads } from '../../shared/ipc';
import type { ActionResult, AppSettings, Capabilities, CaseInput, CaseSummary, DossierApi, ExternalBrowser, LinkItem, MapDocument, MediaItem, Person, PersonBundle, PersonInput, PersonStatus, PersonTab, RelationPosition, Relationship, SearchResult, SocialAccount, SocialAccountInput, TextDocument, UploadFile } from '../../shared/types';

export class ElectronApi implements DossierApi {
  readonly capabilities: Capabilities;
  constructor(private readonly bridge: DossierBridge) {
    this.capabilities = {
      desktop: true, platform: bridge.platform, nativeFileDialog: true, showInFolder: true,
      openMediaFolder: true, persistentServer: true, secureCredentialStorage: true,
      loginItems: bridge.platform === 'darwin', menuBarIcon: bridge.platform === 'darwin'
    };
  }
  private invoke<T, C extends IpcChannel>(channel: C, payload: IpcPayloads[C]): Promise<T> { return this.bridge.invoke(channel, payload) as Promise<T>; }
  listCases() { return this.invoke<CaseSummary[], 'cases:list'>('cases:list', {}); }
  createCase(input: CaseInput) {
    return this.invoke<CaseSummary, 'cases:create'>('cases:create', input);
  }
  listPeople(query?: string, status?: PersonStatus, includeRelated?: boolean, caseId?: string) {
    return this.invoke<Person[], 'people:list'>('people:list', {
      query,
      status,
      includeRelated,
      caseId,
    });
  }
  getPerson(id: string) { return this.invoke<PersonBundle | null, 'people:get'>('people:get', { id }); }
  createPerson(input: PersonInput, caseId?: string) {
    return this.invoke<PersonBundle, 'people:create'>('people:create', { input, caseId });
  }
  updatePerson(id: string, input: PersonInput) { return this.invoke<PersonBundle, 'people:update'>('people:update', { id, input }); }
  setProfilePhoto(personId: string, mediaId: string) { return this.invoke<Person, 'people:profile-photo'>('people:profile-photo', { personId, mediaId }); }
  setPersonArchived(id: string, archived: boolean) { return this.invoke<Person, 'people:archive'>('people:archive', { id, archived }); }
  setPersonPinned(id: string, pinned: boolean) { return this.invoke<Person, 'people:pin'>('people:pin', { id, pinned }); }
  deletePerson(id: string) { return this.invoke<void, 'people:delete'>('people:delete', { id }); }
  createRelatedPerson(viewPersonId: string, tabId: string, ownerPersonId: string, relationType: string, input: PersonInput) { return this.invoke<PersonBundle, 'relations:create-person'>('relations:create-person', { viewPersonId, tabId, ownerPersonId, relationType, input }); }
  updateRelationship(id: string, relationType: string) { return this.invoke<Relationship, 'relations:update'>('relations:update', { id, relationType }); }
  deleteRelationship(id: string) { return this.invoke<void, 'relations:delete'>('relations:delete', { id }); }
  updateRelationPosition(viewPersonId: string, tabId: string, personId: string, x: number, y: number) { return this.invoke<RelationPosition, 'relations:position'>('relations:position', { viewPersonId, tabId, personId, x, y }); }
  createTab(personId: string, input: Parameters<DossierApi['createTab']>[1]) { return this.invoke<PersonTab, 'tabs:create'>('tabs:create', { personId, input }); }
  updateTab(id: string, input: Parameters<DossierApi['updateTab']>[1]) { return this.invoke<PersonTab, 'tabs:update'>('tabs:update', { id, input }); }
  deleteTab(id: string) { return this.invoke<void, 'tabs:delete'>('tabs:delete', { id }); }
  saveTextDocument(input: Parameters<DossierApi['saveTextDocument']>[0]) { return this.invoke<TextDocument, 'text:save'>('text:save', input); }
  saveMapDocument(input: Parameters<DossierApi['saveMapDocument']>[0]) { return this.invoke<MapDocument, 'maps:save'>('maps:save', input); }
  uploadMedia(personId: string, tabId: string, files: UploadFile[]) { return this.invoke<MediaItem[], 'media:upload'>('media:upload', { personId, tabId, files }); }
  updateMedia(id: string, input: Parameters<DossierApi['updateMedia']>[1]) { return this.invoke<MediaItem, 'media:update'>('media:update', { id, input }); }
  deleteMedia(id: string) { return this.invoke<void, 'media:delete'>('media:delete', { id }); }
  readMediaBytes(id: string) { return this.invoke<Uint8Array, 'media:read'>('media:read', { id }); }
  mediaUrl(item: Pick<MediaItem, 'id'>) { return `dossier-media://${item.id}`; }
  profileThumbnailUrl(item: Pick<MediaItem, 'id'>) { return `dossier-media://${item.id}?variant=profile-thumbnail`; }
  linkIconUrl(item: Pick<LinkItem, 'id'>) { return `dossier-media://${item.id}?variant=link-icon`; }
  createLink(input: Parameters<DossierApi['createLink']>[0]) { return this.invoke<LinkItem, 'links:create'>('links:create', input); }
  updateLink(id: string, input: Parameters<DossierApi['updateLink']>[1]) { return this.invoke<LinkItem, 'links:update'>('links:update', { id, input }); }
  deleteLink(id: string) { return this.invoke<void, 'links:delete'>('links:delete', { id }); }
  search(query: string, caseId?: string) {
    return this.invoke<SearchResult[], 'search'>('search', { query, caseId });
  }
  getSettings() { return this.invoke<AppSettings, 'settings:get'>('settings:get', {}); }
  updateSettings(input: Partial<AppSettings>) { return this.invoke<AppSettings, 'settings:update'>('settings:update', input); }
  listExternalBrowsers() {
    return this.invoke<ExternalBrowser[], 'browsers:list'>('browsers:list', {});
  }
  chooseExternalBrowser() {
    return this.invoke<ExternalBrowser | null, 'browsers:choose'>('browsers:choose', {});
  }
  listSocialAccounts() { return this.invoke<SocialAccount[], 'accounts:list'>('accounts:list', {}); }
  saveSocialAccount(input: SocialAccountInput) { return this.invoke<SocialAccount, 'accounts:save'>('accounts:save', input); }
  deleteSocialAccount(id: string) { return this.invoke<void, 'accounts:delete'>('accounts:delete', { id }); }
  onOpenSettings(callback: () => void) { return this.bridge.onOpenSettings(callback); }
  showMediaInFolder(mediaId: string) { return this.invoke<ActionResult, 'media:reveal'>('media:reveal', { id: mediaId }); }
  exportMedia(mediaId: string) { return this.invoke<ActionResult, 'media:export'>('media:export', { id: mediaId }); }
  openMediaFolder() { return this.invoke<ActionResult, 'media:folder'>('media:folder', {}); }
  exportBackup() { return this.invoke<ActionResult, 'backup:export'>('backup:export', {}); }
  chooseMedia(personId: string, tabId: string) { return this.invoke<MediaItem[], 'media:choose'>('media:choose', { personId, tabId }); }
}
