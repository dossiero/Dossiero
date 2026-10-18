import { contextBridge, ipcRenderer } from 'electron';

const allowed = new Set<string>([
  'cases:list', 'cases:create',
  'people:list', 'people:get', 'people:create', 'people:update', 'people:profile-photo', 'people:archive', 'people:pin', 'people:delete',
  'relations:create-person', 'relations:update', 'relations:delete', 'relations:position',
  'tabs:create', 'tabs:update', 'tabs:delete', 'text:save', 'maps:save',
  'media:upload', 'media:update', 'media:delete', 'media:read', 'media:choose', 'media:reveal', 'media:export', 'media:folder',
  'links:create', 'links:update', 'links:delete', 'search', 'settings:get', 'settings:update',
  'browsers:list', 'browsers:choose',
  'accounts:list', 'accounts:save', 'accounts:delete', 'backup:export'
]);

const bridge = Object.freeze({
  platform: process.platform,
  invoke(channel: string, payload: unknown) {
    if (!allowed.has(channel)) return Promise.reject(new Error('Blocked IPC channel'));
    return ipcRenderer.invoke(channel, payload);
  },
  onOpenSettings(callback: () => void) {
    const listener = () => callback();
    ipcRenderer.on('settings:open', listener);
    return () => ipcRenderer.removeListener('settings:open', listener);
  },
  isFullScreen() {
    return ipcRenderer.invoke('window:is-full-screen') as Promise<boolean>;
  },
  onFullScreenChange(callback: (fullScreen: boolean) => void) {
    const listener = (_event: Electron.IpcRendererEvent, fullScreen: boolean) => callback(fullScreen);
    ipcRenderer.on('window:full-screen-changed', listener);
    return () => ipcRenderer.removeListener('window:full-screen-changed', listener);
  }
});

contextBridge.exposeInMainWorld('dossierBridge', bridge);
