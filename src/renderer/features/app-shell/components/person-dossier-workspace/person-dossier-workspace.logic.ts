export const PERSON_DOSSIER_PANEL_COLLAPSED_WIDTH = 80;
export const PERSON_DOSSIER_PANEL_COMPACT_THRESHOLD = 150;
export const PERSON_DOSSIER_PANEL_DEFAULT_WIDTH = 260;
export const PERSON_DOSSIER_PANEL_MAX_WIDTH = 320;

export function resolvePersonDossierPanelCompactState(
  currentCompactState: boolean,
  width: number,
): boolean {
  if (width < PERSON_DOSSIER_PANEL_COMPACT_THRESHOLD) {
    return true;
  }

  if (width > PERSON_DOSSIER_PANEL_COMPACT_THRESHOLD) {
    return false;
  }

  return currentCompactState;
}

export function panelPixelsToPercentage(pixels: number, containerWidth: number): number {
  if (containerWidth <= 0) {
    return 0;
  }

  return pixels * 100 / containerWidth;
}
