import type { ReactNode } from "react";
import { ResizableLayout } from "@/features/app-shell/components/resizable-layout/resizable-layout";

const RIGHT_SIDEBAR_DEFAULT_WIDTH = 360;
const RIGHT_SIDEBAR_MINIMUM_WIDTH = 280;
const RIGHT_SIDEBAR_MAXIMUM_WIDTH = 520;

interface RightSidebarLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
}

export function RightSidebarLayout({
  children,
  sidebar,
}: RightSidebarLayoutProps) {
  return (
    <ResizableLayout
      ariaLabel="Resize details sidebar"
      defaultWidth={RIGHT_SIDEBAR_DEFAULT_WIDTH}
      maximumWidth={RIGHT_SIDEBAR_MAXIMUM_WIDTH}
      minimumWidth={RIGHT_SIDEBAR_MINIMUM_WIDTH}
      panel={sidebar}
      panelSide="end"
      storageKey="dossier-inspector-width"
    >
      {children}
    </ResizableLayout>
  );
}
