import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  nativeTheme,
  protocol,
  safeStorage,
  screen,
  shell,
  Tray,
  type MenuItemConstructorOptions,
  type Rectangle
} from 'electron';
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import {
  APPLICATION_COPYRIGHT,
  APPLICATION_NAME,
  APPLICATION_WEBSITE,
} from '../shared/app-metadata.js';
import { IPC_CHANNELS, type IpcChannel } from '../shared/ipc.js';
import { idSchema, settingsSchema, socialAccountInputSchema } from '../shared/schemas.js';
import type { Appearance, AppSettings, ExternalBrowser } from '../shared/types.js';
import { showAboutWindow } from './about-window.js';
import { dispatchCore } from './dispatch.js';
import {
  browserNameFromPath,
  listInstalledBrowsers,
  openExternalUrl,
} from './external-browser.js';
import { DossierService } from './service.js';

protocol.registerSchemesAsPrivileged([{ scheme: 'dossier-media', privileges: { secure: true, supportFetchAPI: true, stream: true } }]);

const currentDir = dirname(fileURLToPath(import.meta.url));
const persistentUserDataDirectoryName = 'Dossier';
const releaseSmokeTest = process.env.DOSSIERO_RELEASE_SMOKE_TEST === '1';
const smokeTestUserDataDirectory = releaseSmokeTest
  ? mkdtempSync(join(tmpdir(), 'dossiero-release-smoke-'))
  : null;

// Keep using the original directory after the product rename so existing
// databases, settings, and media vaults remain available.
app.setPath(
  'userData',
  smokeTestUserDataDirectory
    ?? join(app.getPath('appData'), persistentUserDataDirectoryName),
);

let service: DossierService;
let mainWindow: BrowserWindow | null = null;
let menuBarIcon: Tray | null = null;
let windowStateSaveTimer: NodeJS.Timeout | null = null;

type WindowState = {
  bounds: Rectangle;
  maximized: boolean;
  fullScreen: boolean;
};

const defaultWindowBounds = { width: 1500, height: 920 };
const windowBackgroundColors = {
  dark: '#040e0f',
  light: '#e9ecee'
} as const;

function windowBackgroundColor(appearance: Appearance) {
  const resolvedAppearance = appearance === 'system'
    ? nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    : appearance;

  return windowBackgroundColors[resolvedAppearance];
}

function syncWindowBackground(settings: AppSettings) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setBackgroundColor(windowBackgroundColor(settings.appearance));
}

function openLink(url: string) {
  void openExternalUrl(
    url,
    service.getSettings().externalBrowser,
    (safeUrl) => shell.openExternal(safeUrl),
  ).catch(() => {
    // A failed external launch should not interrupt the renderer event loop.
  });
}

function appIconPath() {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'icon.png');
  }

  return join(process.cwd(), 'build', 'icon.png');
}

function windowStatePath() {
  return join(app.getPath('userData'), 'window-state.json');
}

function readWindowState(): WindowState | null {
  try {
    const value = JSON.parse(readFileSync(windowStatePath(), 'utf8')) as Partial<WindowState>;
    const bounds = value.bounds;
    if (!bounds || ![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)) return null;
    if (bounds.width < 1 || bounds.height < 1) return null;
    return { bounds, maximized: value.maximized === true, fullScreen: value.fullScreen === true };
  } catch {
    return null;
  }
}

function visibleWindowBounds(saved: Rectangle | undefined): Partial<Rectangle> {
  if (!saved) return defaultWindowBounds;
  const displays = screen.getAllDisplays();
  const visible = displays.some(({ workArea }) => {
    const overlapWidth = Math.min(saved.x + saved.width, workArea.x + workArea.width) - Math.max(saved.x, workArea.x);
    const overlapHeight = Math.min(saved.y + saved.height, workArea.y + workArea.height) - Math.max(saved.y, workArea.y);
    return overlapWidth >= 100 && overlapHeight >= 100;
  });
  if (visible) return saved;

  const workArea = screen.getPrimaryDisplay().workArea;
  const width = Math.min(saved.width, workArea.width);
  const height = Math.min(saved.height, workArea.height);
  return {
    x: Math.round(workArea.x + (workArea.width - width) / 2),
    y: Math.round(workArea.y + (workArea.height - height) / 2),
    width,
    height
  };
}

function writeWindowState(win: BrowserWindow) {
  if (win.isDestroyed()) return;
  const state: WindowState = {
    bounds: win.getNormalBounds(),
    maximized: win.isMaximized(),
    fullScreen: win.isFullScreen()
  };
  const path = windowStatePath();
  const temporaryPath = `${path}.tmp`;
  try {
    writeFileSync(temporaryPath, JSON.stringify(state));
    renameSync(temporaryPath, path);
  } catch {
    // Window persistence should never stop the app from closing.
  }
}

function scheduleWindowStateSave(win: BrowserWindow) {
  if (windowStateSaveTimer) clearTimeout(windowStateSaveTimer);
  windowStateSaveTimer = setTimeout(() => {
    windowStateSaveTimer = null;
    writeWindowState(win);
  }, 250);
}

async function ensureMacApplicationLocation() {
  if (releaseSmokeTest) return true;
  if (process.platform !== 'darwin' || !app.isPackaged || app.isInApplicationsFolder()) return true;

  const installChoice = dialog.showMessageBoxSync({
    type: 'question',
    buttons: ['Move to Applications', 'Run from Here', 'Quit'],
    defaultId: 0,
    cancelId: 2,
    message: `Finish installing ${APPLICATION_NAME}`,
    detail: `${APPLICATION_NAME} is running outside the Applications folder. Move it there so `
      + 'macOS uses one installed copy.'
  });

  if (installChoice === 1) return true;
  if (installChoice === 2) {
    app.quit();
    return false;
  }

  let useInstalledCopy = false;

  try {
    const moved = app.moveToApplicationsFolder({
      conflictHandler: (conflictType) => {
        if (conflictType === 'existsAndRunning') {
          const choice = dialog.showMessageBoxSync({
            type: 'warning',
            buttons: ['Use Installed Copy', 'Cancel'],
            defaultId: 0,
            cancelId: 1,
            message: `${APPLICATION_NAME} is already installed and running`,
            detail: 'The installed copy must be closed before it can be replaced. You can use that copy now, or cancel and quit it before trying again.'
          });
          useInstalledCopy = choice === 0;
          return useInstalledCopy;
        }

        const choice = dialog.showMessageBoxSync({
          type: 'warning',
          buttons: ['Keep Existing', 'Replace'],
          defaultId: 0,
          cancelId: 0,
          message: `${APPLICATION_NAME} is already installed`,
          detail: 'Keep the copy already in Applications, or replace it with this version. '
            + `Your ${APPLICATION_NAME} data is stored separately and is not removed.`
        });
        useInstalledCopy = choice === 0;
        return choice === 1;
      }
    });

    // A successful move quits and relaunches the app. When the user keeps an
    // existing installation, open that copy rather than running two bundles.
    if (!moved && useInstalledCopy) {
      await shell.openPath(`/Applications/${APPLICATION_NAME}.app`);
      app.quit();
      return false;
    }

    if (moved) return false;
  } catch (error) {
    dialog.showErrorBox(
      `${APPLICATION_NAME} could not be moved`,
      error instanceof Error ? error.message : String(error),
    );
  }

  const fallbackChoice = dialog.showMessageBoxSync({
    type: 'warning',
    buttons: ['Run from Here', 'Quit'],
    defaultId: 1,
    cancelId: 1,
    message: `${APPLICATION_NAME} was not moved to Applications`,
    detail: 'You can run this copy temporarily, or quit and install it later by dragging '
      + `${APPLICATION_NAME} onto Applications.`
  });
  if (fallbackChoice === 0) return true;
  app.quit();
  return false;
}

function createWindow() {
  const savedState = readWindowState();
  const settings = service.getSettings();
  const win = new BrowserWindow({
    ...visibleWindowBounds(savedState?.bounds),
    minWidth: 760,
    minHeight: 600,
    backgroundColor: windowBackgroundColor(settings.appearance),
    icon: appIconPath(),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 20, y: 23 } : undefined,
    webPreferences: {
      preload: join(currentDir, '../preload/index.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      webSecurity: true, allowRunningInsecureContent: false
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) openLink(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    const allowed = process.env.VITE_DEV_SERVER_URL && url.startsWith(process.env.VITE_DEV_SERVER_URL);
    if (allowed || url.startsWith('file:')) return;

    event.preventDefault();
    if (url.startsWith('https://') || url.startsWith('http://')) {
      openLink(url);
    }
  });
  win.webContents.on('before-input-event', (event, input) => {
    const reloadShortcut = input.type === 'keyDown' && ((input.key.toLowerCase() === 'r' && (input.control || input.meta)) || input.key === 'F5');
    if (reloadShortcut) event.preventDefault();
  });
  if (process.env.VITE_DEV_SERVER_URL) void win.loadURL(process.env.VITE_DEV_SERVER_URL);
  else void win.loadFile(join(currentDir, '../../dist/index.html'));
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('window:full-screen-changed', win.isFullScreen());
  });
  mainWindow = win;
  if (savedState?.maximized) win.maximize();
  if (savedState?.fullScreen) win.setFullScreen(true);
  const rememberWindowState = () => scheduleWindowStateSave(win);
  win.on('move', rememberWindowState);
  win.on('resize', rememberWindowState);
  win.on('maximize', rememberWindowState);
  win.on('unmaximize', rememberWindowState);
  const notifyFullScreen = () => {
    rememberWindowState();
    win.webContents.send('window:full-screen-changed', win.isFullScreen());
  };
  win.on('enter-full-screen', notifyFullScreen);
  win.on('leave-full-screen', notifyFullScreen);
  win.on('close', () => {
    if (windowStateSaveTimer) { clearTimeout(windowStateSaveTimer); windowStateSaveTimer = null; }
    writeWindowState(win);
  });
  win.on('closed', () => { if (mainWindow === win) mainWindow = null; });
  return win;
}

function showMainWindow(openSettings = false) {
  const win = mainWindow ?? createWindow();
  if (win.isMinimized()) win.restore();
  win.show(); win.focus();
  if (openSettings) {
    const send = () => win.webContents.send('settings:open');
    win.webContents.isLoading() ? win.webContents.once('did-finish-load', send) : send();
  }
}

function trayImage() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><path fill="#000" d="M3 2h8.2L15 5.8V16H3V2Zm2 2v10h8V7h-3V4H5Zm1.5 5h5v1.5h-5V9Zm0 2.5h5V13h-5v-1.5Z"/></svg>`;
  const image = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
  image.setTemplateImage(true);
  return image;
}

function syncMenuBarIcon(enabled: boolean) {
  if (process.platform !== 'darwin') return;
  if (!enabled) { menuBarIcon?.destroy(); menuBarIcon = null; return; }
  if (menuBarIcon) return;
  menuBarIcon = new Tray(trayImage());
  menuBarIcon.setToolTip(APPLICATION_NAME);
  menuBarIcon.setContextMenu(Menu.buildFromTemplate([
    { label: `Show ${APPLICATION_NAME}`, click: () => showMainWindow() },
    { label: 'Settings…', accelerator: 'Command+,', click: () => showMainWindow(true) },
    { type: 'separator' }, { role: 'quit' }
  ]));
  menuBarIcon.on('click', () => showMainWindow());
}

function applyPlatformSettings(settings: AppSettings) {
  if (process.platform !== 'darwin') return;
  app.setLoginItemSettings({ openAtLogin: settings.startAtLogin });
  syncMenuBarIcon(settings.showMenuBarIcon);
}

function installApplicationMenu() {
  const openAboutWindow = () => showAboutWindow({
    applicationName: APPLICATION_NAME,
    applicationVersion: app.getVersion(),
    copyright: APPLICATION_COPYRIGHT,
    iconPath: appIconPath(),
    parent: mainWindow ?? undefined,
    rendererDevServerUrl: process.env.VITE_DEV_SERVER_URL,
    rendererHtmlPath: join(currentDir, '../../dist/index.html'),
    website: APPLICATION_WEBSITE,
    openWebsite: () => openLink(APPLICATION_WEBSITE),
  });
  const appViewMenu: MenuItemConstructorOptions = {
    label: 'View',
    submenu: [{ role: 'togglefullscreen' }],
  };
  const appHelpMenu: MenuItemConstructorOptions = {
    role: 'help',
    submenu: [{
      label: `About ${APPLICATION_NAME}`,
      click: openAboutWindow,
    }],
  };
  const template: MenuItemConstructorOptions[] = process.platform === 'darwin' ? [{
    label: APPLICATION_NAME,
    submenu: [
      { label: `About ${APPLICATION_NAME}`, click: openAboutWindow },
      { type: 'separator' },
      { label: 'Settings…', accelerator: 'Command+,', click: () => showMainWindow(true) },
      { type: 'separator' }, { role: 'services' }, { type: 'separator' },
      { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { role: 'quit' }
    ]
  }, { role: 'editMenu' }, appViewMenu, { role: 'windowMenu' }, appHelpMenu] : [
    { role: 'fileMenu' }, { role: 'editMenu' }, appViewMenu, { role: 'windowMenu' }, appHelpMenu
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function registerIpc() {
  ipcMain.handle('window:is-full-screen', (event) => BrowserWindow.fromWebContents(event.sender)?.isFullScreen() ?? false);
  const nativeChannels = new Set<IpcChannel>([
    'media:choose', 'media:reveal', 'media:export', 'media:folder', 'settings:update',
    'browsers:list', 'browsers:choose', 'accounts:list', 'accounts:save',
    'accounts:delete', 'backup:export'
  ]);
  for (const channel of IPC_CHANNELS) {
    ipcMain.handle(channel, async (_event, payload: unknown) => {
      if (!nativeChannels.has(channel)) return dispatchCore(service, channel, payload);
      if (channel === 'media:choose') {
        const value = z.object({ personId: idSchema, tabId: idSchema }).parse(payload);
        const result = await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'], filters: [
          { name: 'Evidence files', extensions: ['jpg','jpeg','png','gif','webp','mp4','mov','mp3','wav','m4a','pdf','txt','doc','docx'] }, { name: 'All files', extensions: ['*'] }
        ] });
        if (result.canceled) return [];
        const files = result.filePaths.map((path) => {
          const bytes = readFileSync(path); return { name: basename(path), type: mimeFromPath(path), size: bytes.byteLength, bytes: new Uint8Array(bytes) };
        });
        return service.uploadMedia(value.personId, value.tabId, files);
      }
      if (channel === 'media:reveal') {
        const id = z.object({ id: idSchema }).parse(payload).id; const path = service.mediaPath(id);
        if (!path) return { ok: false, message: 'File not found' };
        shell.showItemInFolder(path); return { ok: true, message: 'File shown in folder' };
      }
      if (channel === 'media:export') {
        const id = z.object({ id: idSchema }).parse(payload).id;
        const path = service.mediaPath(id); const item = service.mediaItem(id);
        if (!path || !item) return { ok: false, message: 'Media file not found' };
        const result = await dialog.showSaveDialog({ title: 'Export media file', defaultPath: item.originalName });
        if (result.canceled || !result.filePath) return { ok: false, message: 'Export cancelled' };
        copyFileSync(path, result.filePath);
        return { ok: true, message: 'Media exported', path: result.filePath };
      }
      if (channel === 'media:folder') {
        const error = await shell.openPath(service.mediaDir); return error ? { ok: false, message: error } : { ok: true, message: 'Media vault opened' };
      }
      if (channel === 'settings:update') {
        const settings = service.updateSettings(settingsSchema.parse(payload));
        applyPlatformSettings(settings);
        syncWindowBackground(settings);
        return settings;
      }
      if (channel === 'browsers:list') return listInstalledBrowsers();
      if (channel === 'browsers:choose') {
        const filters = process.platform === 'win32'
          ? [{ name: 'Applications', extensions: ['exe'] }]
          : undefined;
        const result = await dialog.showOpenDialog({
          title: 'Choose a browser application',
          defaultPath: process.platform === 'darwin' ? '/Applications' : undefined,
          properties: ['openFile'],
          filters,
        });

        if (result.canceled || !result.filePaths[0]) return null;
        const path = result.filePaths[0];
        const browser: ExternalBrowser = {
          name: browserNameFromPath(path),
          path,
        };
        return browser;
      }
      if (channel === 'accounts:list') return service.listSocialAccounts();
      if (channel === 'accounts:save') {
        const input = socialAccountInputSchema.parse(payload);
        let encryptedPassword: Buffer | undefined;
        if (input.password) {
          if (!await safeStorage.isAsyncEncryptionAvailable()) throw new Error('Secure credential storage is unavailable on this system');
          encryptedPassword = await safeStorage.encryptStringAsync(input.password);
        }
        const { password: _password, ...account } = input;
        return service.saveSocialAccount(account, encryptedPassword);
      }
      if (channel === 'accounts:delete') {
        service.deleteSocialAccount(z.object({ id: idSchema }).parse(payload).id);
        return null;
      }
      const backupDate = new Date().toISOString().slice(0, 10);
      const result = await dialog.showSaveDialog({
        title: `Export ${APPLICATION_NAME} backup`,
        defaultPath: `dossiero-backup-${backupDate}.zip`,
        filters: [{ name: `${APPLICATION_NAME} backup`, extensions: ['zip'] }],
      });
      if (result.canceled || !result.filePath) return { ok: false, message: 'Export cancelled' };
      await service.exportBackup(result.filePath);
      return { ok: true, message: 'Backup exported', path: result.filePath };
    });
  }
}

function mimeFromPath(path: string) {
  const ext = path.toLowerCase().split('.').pop();
  const map: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', mp4: 'video/mp4', mov: 'video/quicktime', mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', pdf: 'application/pdf', txt: 'text/plain' };
  return map[ext ?? ''] ?? 'application/octet-stream';
}

app.whenReady().then(async () => {
  if (!await ensureMacApplicationLocation()) return;
  if (process.platform === 'darwin') {
    app.dock?.setIcon(appIconPath());
  }
  service = new DossierService(join(app.getPath('userData'), 'vault'));
  protocol.handle('dossier-media', async (request) => {
    const url = new URL(request.url);
    const id = url.hostname || url.pathname.replace(/^\//, '');
    const variant = url.searchParams.get('variant');

    if (variant === 'link-icon') {
      const favicon = await service.linkFavicon(id);

      return favicon
        ? new Response(favicon.bytes, {
            headers: {
              'Content-Type': favicon.mimeType,
              'Cache-Control': 'private, max-age=86400',
            },
          })
        : new Response('Not found', { status: 404 });
    }

    const thumbnail = variant === 'profile-thumbnail';
    const path = thumbnail ? service.profileThumbnailPath(id) : service.mediaPath(id);
    const data = path && existsSync(path) ? readFileSync(path) : null;

    return data
      ? new Response(data, {
          headers: {
            'Content-Type': thumbnail && path?.endsWith('.webp')
              ? 'image/webp'
              : service.mediaMime(id) ?? 'application/octet-stream',
            'Cache-Control': 'private, max-age=300',
          },
        })
      : new Response('Not found', { status: 404 });
  });
  registerIpc();
  installApplicationMenu();
  if (!releaseSmokeTest) {
    applyPlatformSettings(service.getSettings());
  }
  const window = createWindow();

  if (releaseSmokeTest) {
    const smokeTestTimeout = setTimeout(() => {
      console.error('Packaged renderer did not load during the release smoke test.');
      app.exit(1);
    }, 15_000);
    window.webContents.once('did-finish-load', () => {
      clearTimeout(smokeTestTimeout);
      app.exit(0);
    });
    window.webContents.once('did-fail-load', (_event, errorCode, errorDescription) => {
      clearTimeout(smokeTestTimeout);
      console.error(`Packaged renderer failed to load: ${errorCode} ${errorDescription}`);
      app.exit(1);
    });
  }
  nativeTheme.on('updated', () => syncWindowBackground(service.getSettings()));
  app.on('activate', () => showMainWindow());
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => {
  menuBarIcon?.destroy();
  service?.close();

  if (smokeTestUserDataDirectory) {
    rmSync(smokeTestUserDataDirectory, {
      force: true,
      recursive: true,
    });
  }
});
