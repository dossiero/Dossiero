import type { AppSettings } from "../../shared/types";

const viewStateKey = "dossier-view-state";
const scrollStateKey = "dossier-scroll-state";
const panelLayoutKey = "react-resizable-panels:dossier-layout-wide";

export interface ViewState {
  selectedCaseId: string | null;
  selectedId: string | null;
  activeTabId: string | null;
  trashOpen: boolean;
}

export function resolvedAppearance(appearance: AppSettings["appearance"]): "dark" | "light" {
  if (appearance !== "system") {
    return appearance;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readViewState(): ViewState {
  try {
    const value = JSON.parse(localStorage.getItem(viewStateKey) ?? "{}") as Partial<ViewState>;

    return {
      selectedCaseId: typeof value.selectedCaseId === "string" ? value.selectedCaseId : null,
      selectedId: typeof value.selectedId === "string" ? value.selectedId : null,
      activeTabId: typeof value.activeTabId === "string" ? value.activeTabId : null,
      trashOpen: value.trashOpen === true,
    };
  } catch {
    return {
      selectedCaseId: null,
      selectedId: null,
      activeTabId: null,
      trashOpen: false,
    };
  }
}

export function saveViewState(value: ViewState): void {
  localStorage.setItem(viewStateKey, JSON.stringify(value));
}

export function readScrollState(): Record<string, number> {
  try {
    const value = JSON.parse(localStorage.getItem(scrollStateKey) ?? "{}") as Record<
      string,
      unknown
    >;

    return Object.fromEntries(
      Object.entries(value).filter((entry): entry is [string, number] => {
        return typeof entry[1] === "number" && Number.isFinite(entry[1]);
      }),
    );
  } catch {
    return {};
  }
}

export function saveScrollState(value: Record<string, number>): void {
  localStorage.setItem(scrollStateKey, JSON.stringify(value));
}

export function readWideSidebarSize(): number {
  try {
    const saved = JSON.parse(localStorage.getItem(panelLayoutKey) ?? "{}") as Record<
      string,
      { layout?: unknown }
    >;
    const previous = Object.entries(saved).find(([key]) => {
      return key.includes("wide-sidebar") && key.includes("wide-inspector");
    })?.[1].layout;

    if (Array.isArray(previous) && typeof previous[0] === "number") {
      return Math.max(6, Math.min(27, previous[0]));
    }
  } catch {
    // Use the standard width when stored panel state is absent or invalid.
  }

  return 20;
}
