import { createContext } from "react";

export interface ContentFullscreenControls {
  isFullscreen: boolean;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  toggleFullscreen: () => void;
}

export const ContentFullscreenContext = createContext<ContentFullscreenControls | null>(null);
