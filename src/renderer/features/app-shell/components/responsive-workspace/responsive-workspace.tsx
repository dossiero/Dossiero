import {
  PERSON_SIDEBAR_BREAKPOINT,
  WIDE_WORKSPACE_BREAKPOINT,
} from "@/app/layout-constants";
import {
  PERSON_SIDEBAR_COLLAPSED_WIDTH,
  PERSON_SIDEBAR_COLLAPSE_THRESHOLD,
} from "@/app/sidebar-resize";
import { ResizableLayout } from "@/features/app-shell/components/resizable-layout/resizable-layout";
import { RightSidebarLayout } from "@/features/app-shell/components/right-sidebar-layout/right-sidebar-layout";
import "./responsive-workspace.css";
import type { ResponsiveWorkspaceProps } from "./responsive-workspace.types";

const PERSON_SIDEBAR_DEFAULT_WIDTH = 292;
const PERSON_SIDEBAR_MAXIMUM_WIDTH = 420;
export function ResponsiveWorkspace({
  width,
  contentFullscreen,
  sidebar,
  main,
  rightSidebar,
  onPersonSidebarCompactChange,
}: ResponsiveWorkspaceProps) {
  if (contentFullscreen) {
    return <div className="app-frame content-fullscreen-frame">{main}</div>;
  }

  if (width < PERSON_SIDEBAR_BREAKPOINT) {
    return <div className="app-frame">{main}</div>;
  }

  const content = width >= WIDE_WORKSPACE_BREAKPOINT && rightSidebar
    ? (
        <RightSidebarLayout sidebar={rightSidebar}>
          {main}
        </RightSidebarLayout>
      )
    : main;

  return (
    <ResizableLayout
      ariaLabel="Resize subject sidebar"
      className="app-frame"
      collapsedWidth={PERSON_SIDEBAR_COLLAPSED_WIDTH}
      defaultWidth={PERSON_SIDEBAR_DEFAULT_WIDTH}
      maximumWidth={PERSON_SIDEBAR_MAXIMUM_WIDTH}
      minimumWidth={PERSON_SIDEBAR_COLLAPSE_THRESHOLD}
      onCompactChange={onPersonSidebarCompactChange}
      panel={sidebar}
      snapThreshold={PERSON_SIDEBAR_COLLAPSE_THRESHOLD}
      storageKey="dossier-person-sidebar-width"
    >
      {content}
    </ResizableLayout>
  );
}
