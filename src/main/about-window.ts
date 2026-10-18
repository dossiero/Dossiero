import { BrowserWindow } from "electron";

interface ShowAboutWindowOptions {
  applicationName: string;
  applicationVersion: string;
  copyright: string;
  iconPath: string;
  openWebsite: () => void;
  parent?: BrowserWindow;
  rendererDevServerUrl?: string;
  rendererHtmlPath: string;
  website: string;
}

const aboutWindowSize = {
  height: 190,
  width: 500,
} as const;

let aboutWindow: BrowserWindow | null = null;

function aboutWindowQuery(options: ShowAboutWindowOptions) {
  return {
    applicationName: options.applicationName,
    applicationVersion: options.applicationVersion,
    copyright: options.copyright,
    window: "about",
  };
}

function loadAboutWindow(window: BrowserWindow, options: ShowAboutWindowOptions) {
  const query = aboutWindowQuery(options);

  if (options.rendererDevServerUrl) {
    const rendererUrl = new URL(options.rendererDevServerUrl);

    for (const [name, value] of Object.entries(query)) {
      rendererUrl.searchParams.set(name, value);
    }

    return window.loadURL(rendererUrl.toString());
  }

  return window.loadFile(options.rendererHtmlPath, { query });
}

export function showAboutWindow(options: ShowAboutWindowOptions) {
  if (aboutWindow && !aboutWindow.isDestroyed()) {
    aboutWindow.show();
    aboutWindow.focus();
    return;
  }

  const window = new BrowserWindow({
    ...aboutWindowSize,
    backgroundColor: "#f4f4f4",
    fullscreenable: false,
    icon: options.iconPath,
    maximizable: false,
    minimizable: false,
    parent: options.parent,
    resizable: false,
    show: false,
    title: `About ${options.applicationName}`,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition: process.platform === "darwin" ? { x: 20, y: 20 } : undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const openRepository = (url: string) => {
    if (url === options.website) {
      options.openWebsite();
    }
  };

  window.webContents.setWindowOpenHandler(({ url }) => {
    openRepository(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    event.preventDefault();
    openRepository(url);
  });
  window.once("ready-to-show", () => {
    window.center();
    window.show();
    window.focus();
  });
  window.on("closed", () => {
    if (aboutWindow === window) {
      aboutWindow = null;
    }
  });

  aboutWindow = window;
  void loadAboutWindow(window, options);
}
