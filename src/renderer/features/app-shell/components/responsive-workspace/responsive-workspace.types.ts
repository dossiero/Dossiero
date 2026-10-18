import type { ReactNode } from "react";

export interface ResponsiveWorkspaceProps {
  width: number;
  contentFullscreen: boolean;
  sidebar: ReactNode;
  main: ReactNode;
  rightSidebar: ReactNode;
  onPersonSidebarCompactChange: (compact: boolean) => void;
}
