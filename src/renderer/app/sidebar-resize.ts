export const PERSON_SIDEBAR_COLLAPSED_WIDTH = 72;
export const PERSON_SIDEBAR_COLLAPSE_THRESHOLD = 120;

export function resolvePersonSidebarCompactState(
  currentCompactState: boolean,
  width: number,
): boolean {
  if (width < PERSON_SIDEBAR_COLLAPSE_THRESHOLD) {
    return true;
  }

  if (width > PERSON_SIDEBAR_COLLAPSE_THRESHOLD) {
    return false;
  }

  return currentCompactState;
}

export function pixelsToPanelPercentage(pixels: number, containerWidth: number): number {
  return pixels * 100 / containerWidth;
}
