import type { IpcChannel, IpcPayloads } from '../../shared/ipc';
import type { ActionResult, AppSettings, CaseInput, CaseSummary, DossierApi, ExternalBrowser, LinkItem, MapDocument, MediaItem, Person, PersonBundle, PersonInput, PersonStatus, PersonTab, RelationPosition, Relationship, SearchResult, SocialAccount, SocialAccountInput, TextDocument, UploadFile } from '../../shared/types';

const endpoint = 'http://127.0.0.1:4174';

export class WebApi implements DossierApi {
  readonly capabilities = { desktop: false, platform: 'web', nativeFileDialog: false, showInFolder: false, openMediaFolder: false, persistentServer: true, secureCredentialStorage: false, loginItems: false, menuBarIcon: false } as const;
  private async rpc<T, C extends IpcChannel>(channel: C, payload: IpcPayloads[C]): Promise<T> {
    const response = await fetch(`${endpoint}/rpc/${channel}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const body = await response.json() as { data?: T; error?: string };
    if (!response.ok) throw new Error(body.error ?? 'Local service unavailable');
    return body.data as T;
  }
  static async available() { try { const response = await fetch(`${endpoint}/health`, { signal: AbortSignal.timeout(900) }); return response.ok; } catch { return false; } }
  listCases() { return this.rpc<CaseSummary[], 'cases:list'>('cases:list', {}); }
  createCase(input: CaseInput) {
    return this.rpc<CaseSummary, 'cases:create'>('cases:create', input);
  }
  listPeople(query?: string, status?: PersonStatus, includeRelated?: boolean, caseId?: string) {
    return this.rpc<Person[], 'people:list'>('people:list', {
      query,
      status,
      includeRelated,
      caseId,
    });
  }
  getPerson(id: string) { return this.rpc<PersonBundle | null, 'people:get'>('people:get', { id }); }
  createPerson(input: PersonInput, caseId?: string) {
    return this.rpc<PersonBundle, 'people:create'>('people:create', { input, caseId });
  }
  updatePerson(id: string, input: PersonInput) { return this.rpc<PersonBundle, 'people:update'>('people:update', { id, input }); }
  setProfilePhoto(personId: string, mediaId: string) { return this.rpc<Person, 'people:profile-photo'>('people:profile-photo', { personId, mediaId }); }
  setPersonArchived(id: string, archived: boolean) { return this.rpc<Person, 'people:archive'>('people:archive', { id, archived }); }
  setPersonPinned(id: string, pinned: boolean) { return this.rpc<Person, 'people:pin'>('people:pin', { id, pinned }); }
  deletePerson(id: string) { return this.rpc<void, 'people:delete'>('people:delete', { id }); }
  createRelatedPerson(viewPersonId: string, tabId: string, ownerPersonId: string, relationType: string, input: PersonInput) { return this.rpc<PersonBundle, 'relations:create-person'>('relations:create-person', { viewPersonId, tabId, ownerPersonId, relationType, input }); }
  updateRelationship(id: string, relationType: string) { return this.rpc<Relationship, 'relations:update'>('relations:update', { id, relationType }); }
  deleteRelationship(id: string) { return this.rpc<void, 'relations:delete'>('relations:delete', { id }); }
  updateRelationPosition(viewPersonId: string, tabId: string, personId: string, x: number, y: number) { return this.rpc<RelationPosition, 'relations:position'>('relations:position', { viewPersonId, tabId, personId, x, y }); }
  createTab(personId: string, input: Parameters<DossierApi['createTab']>[1]) { return this.rpc<PersonTab, 'tabs:create'>('tabs:create', { personId, input }); }
  updateTab(id: string, input: Parameters<DossierApi['updateTab']>[1]) { return this.rpc<PersonTab, 'tabs:update'>('tabs:update', { id, input }); }
  deleteTab(id: string) { return this.rpc<void, 'tabs:delete'>('tabs:delete', { id }); }
  saveTextDocument(input: Parameters<DossierApi['saveTextDocument']>[0]) { return this.rpc<TextDocument, 'text:save'>('text:save', input); }
  saveMapDocument(input: Parameters<DossierApi['saveMapDocument']>[0]) { return this.rpc<MapDocument, 'maps:save'>('maps:save', input); }
  uploadMedia(personId: string, tabId: string, files: UploadFile[]) { return this.rpc<MediaItem[], 'media:upload'>('media:upload', { personId, tabId, files }); }
  updateMedia(id: string, input: Parameters<DossierApi['updateMedia']>[1]) { return this.rpc<MediaItem, 'media:update'>('media:update', { id, input }); }
  deleteMedia(id: string) { return this.rpc<void, 'media:delete'>('media:delete', { id }); }
  async readMediaBytes(id: string) { const response=await fetch(`${endpoint}/media/${id}`);if(!response.ok)throw new Error('Media file not found');return new Uint8Array(await response.arrayBuffer()); }
  mediaUrl(item: Pick<MediaItem, 'id'>) { return `${endpoint}/media/${item.id}`; }
  profileThumbnailUrl(item: Pick<MediaItem, 'id'>) { return `${endpoint}/media/${item.id}/profile-thumbnail`; }
  linkIconUrl(item: Pick<LinkItem, 'id'>) { return `${endpoint}/links/${item.id}/favicon`; }
  createLink(input: Parameters<DossierApi['createLink']>[0]) { return this.rpc<LinkItem, 'links:create'>('links:create', input); }
  updateLink(id: string, input: Parameters<DossierApi['updateLink']>[1]) { return this.rpc<LinkItem, 'links:update'>('links:update', { id, input }); }
  deleteLink(id: string) { return this.rpc<void, 'links:delete'>('links:delete', { id }); }
  search(query: string, caseId?: string) {
    return this.rpc<SearchResult[], 'search'>('search', { query, caseId });
  }
  getSettings() { return this.rpc<AppSettings, 'settings:get'>('settings:get', {}); }
  updateSettings(input: Partial<AppSettings>) { return this.rpc<AppSettings, 'settings:update'>('settings:update', input); }
  listExternalBrowsers(): Promise<ExternalBrowser[]> { return Promise.resolve([]); }
  chooseExternalBrowser(): Promise<ExternalBrowser | null> { return Promise.resolve(null); }
  listSocialAccounts(): Promise<SocialAccount[]> { return Promise.resolve([]); }
  saveSocialAccount(_input: SocialAccountInput): Promise<SocialAccount> { return Promise.reject(new Error('Secure account storage is available in the desktop app')); }
  deleteSocialAccount(_id: string): Promise<void> { return Promise.reject(new Error('Secure account storage is available in the desktop app')); }
  onOpenSettings() { return () => undefined; }
  showMediaInFolder(): Promise<ActionResult> { return Promise.resolve({ ok: false, message: 'Desktop only' }); }
  async exportMedia(mediaId: string): Promise<ActionResult> { const bundle=await this.findMedia(mediaId);if(!bundle)return{ok:false,message:'Media file not found'};const response=await fetch(this.mediaUrl(bundle));if(!response.ok)return{ok:false,message:'Media export failed'};const url=URL.createObjectURL(await response.blob());const a=document.createElement('a');a.href=url;a.download=bundle.originalName;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return{ok:true,message:'Media exported'}; }
  openMediaFolder(): Promise<ActionResult> { return Promise.resolve({ ok: false, message: 'Desktop only' }); }
  async exportBackup(): Promise<ActionResult> {
    const response = await fetch(`${endpoint}/backup`);

    if (!response.ok) {
      return { ok: false, message: "Backup failed" };
    }

    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `dossiero-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, message: "Backup exported" };
  }
  chooseMedia(): Promise<MediaItem[]> { return Promise.resolve([]); }
  private async findMedia(id:string){const people=await this.listPeople();for(const person of people){const bundle=await this.getPerson(person.id);const media=bundle?.mediaItems.find(item=>item.id===id);if(media)return media}return null}
}
