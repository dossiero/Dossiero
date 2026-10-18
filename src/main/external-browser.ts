import { accessSync, constants, existsSync } from "node:fs";
import { homedir } from "node:os";
import { basename, delimiter, join } from "node:path";
import { spawn } from "node:child_process";
import type {
  ExternalBrowser,
  ExternalBrowserPreference,
} from "../shared/types.js";

interface BrowserCandidate {
  name: string;
  paths: string[];
}

const macBrowserCandidates: BrowserCandidate[] = [
  { name: "Safari", paths: ["/Applications/Safari.app"] },
  { name: "Google Chrome", paths: ["/Applications/Google Chrome.app"] },
  { name: "Firefox", paths: ["/Applications/Firefox.app"] },
  { name: "Microsoft Edge", paths: ["/Applications/Microsoft Edge.app"] },
  { name: "Brave Browser", paths: ["/Applications/Brave Browser.app"] },
  { name: "Opera", paths: ["/Applications/Opera.app"] },
  { name: "Vivaldi", paths: ["/Applications/Vivaldi.app"] },
  { name: "Arc", paths: ["/Applications/Arc.app"] },
];

function windowsBrowserCandidates(): BrowserCandidate[] {
  const programFiles = process.env.PROGRAMFILES ?? "C:\\Program Files";
  const programFilesX86 = process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)";
  const localAppData = process.env.LOCALAPPDATA ?? "";

  return [
    {
      name: "Google Chrome",
      paths: [
        join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
        join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
        join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
      ],
    },
    {
      name: "Microsoft Edge",
      paths: [
        join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
        join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"),
      ],
    },
    {
      name: "Firefox",
      paths: [
        join(programFiles, "Mozilla Firefox", "firefox.exe"),
        join(programFilesX86, "Mozilla Firefox", "firefox.exe"),
      ],
    },
    {
      name: "Brave Browser",
      paths: [
        join(programFiles, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
        join(localAppData, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
      ],
    },
    {
      name: "Opera",
      paths: [join(localAppData, "Programs", "Opera", "launcher.exe")],
    },
    {
      name: "Vivaldi",
      paths: [join(localAppData, "Vivaldi", "Application", "vivaldi.exe")],
    },
  ];
}

const linuxBrowserCandidates: Array<{ name: string; commands: string[] }> = [
  { name: "Google Chrome", commands: ["google-chrome", "google-chrome-stable"] },
  { name: "Chromium", commands: ["chromium", "chromium-browser"] },
  { name: "Firefox", commands: ["firefox"] },
  { name: "Microsoft Edge", commands: ["microsoft-edge", "microsoft-edge-stable"] },
  { name: "Brave Browser", commands: ["brave-browser", "brave"] },
  { name: "Opera", commands: ["opera"] },
  { name: "Vivaldi", commands: ["vivaldi", "vivaldi-stable"] },
];

function firstExistingPath(paths: string[]): string | null {
  return paths.find((path) => path.length > 0 && existsSync(path)) ?? null;
}

function executableOnPath(commands: string[]): string | null {
  const searchDirectories = (process.env.PATH ?? "").split(delimiter).filter(Boolean);

  for (const command of commands) {
    for (const directory of searchDirectories) {
      const path = join(directory, command);

      try {
        accessSync(path, constants.X_OK);
        return path;
      } catch {
        // Keep looking through the remaining PATH entries.
      }
    }
  }

  return null;
}

export function listInstalledBrowsers(): ExternalBrowser[] {
  if (process.platform === "darwin") {
    return macBrowserCandidates.flatMap((candidate) => {
      const userPaths = candidate.paths.map((path) => (
        join(homedir(), "Applications", basename(path))
      ));
      const path = firstExistingPath([...candidate.paths, ...userPaths]);
      return path ? [{ name: candidate.name, path }] : [];
    });
  }

  if (process.platform === "win32") {
    return windowsBrowserCandidates().flatMap((candidate) => {
      const path = firstExistingPath(candidate.paths);
      return path ? [{ name: candidate.name, path }] : [];
    });
  }

  return linuxBrowserCandidates.flatMap((candidate) => {
    const path = executableOnPath(candidate.commands);
    return path ? [{ name: candidate.name, path }] : [];
  });
}

export function browserNameFromPath(path: string): string {
  return basename(path).replace(/\.(app|exe)$/i, "") || "Selected browser";
}

function launchApplication(path: string, url: string): Promise<void> {
  const command = process.platform === "darwin" ? "/usr/bin/open" : path;
  const args = process.platform === "darwin" ? ["-a", path, url] : [url];

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      detached: true,
      stdio: "ignore",
    });

    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });
}

export async function openExternalUrl(
  value: string,
  preference: ExternalBrowserPreference,
  openWithSystemBrowser: (url: string) => Promise<void>,
): Promise<void> {
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) links are allowed");
  }

  if (preference.kind === "system" || !existsSync(preference.path)) {
    await openWithSystemBrowser(url.toString());
    return;
  }

  try {
    await launchApplication(preference.path, url.toString());
  } catch {
    await openWithSystemBrowser(url.toString());
  }
}
