import type { ReactNode } from "react";

export interface ResponsiveWorkspaceProps {
  width: number;
  contentFullscreen: boolean;
  initialWideSidebarSize: number;
  sidebar: ReactNode;
  main: ReactNode;
  rightSidebar: ReactNode;
  onPersonSidebarResize: (size: number, resize: (size: number) => void) => void;
}
