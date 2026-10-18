import {
  PERSON_SIDEBAR_BREAKPOINT,
  WIDE_WORKSPACE_BREAKPOINT,
} from "@/app/layout-constants";
import {
  PERSON_SIDEBAR_COLLAPSED_WIDTH,
  PERSON_SIDEBAR_COLLAPSE_THRESHOLD,
} from "@/app/sidebar-resize";
import { ResizableLayout } from "@/features/app-shell/components/resizable-layout/resizable-layout";
import "./responsive-workspace.css";
import type { ResponsiveWorkspaceProps } from "./responsive-workspace.types";

const PERSON_SIDEBAR_DEFAULT_WIDTH = 292;
const PERSON_SIDEBAR_MAXIMUM_WIDTH = 420;
const RIGHT_SIDEBAR_DEFAULT_WIDTH = 360;
const RIGHT_SIDEBAR_MINIMUM_WIDTH = 280;
const RIGHT_SIDEBAR_MAXIMUM_WIDTH = 520;

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

  const visibleRightSidebar = width >= WIDE_WORKSPACE_BREAKPOINT
    ? rightSidebar
    : null;

  return (
    <ResizableLayout
      className="app-frame"
      startPanel={{
        ariaLabel: "Resize subject sidebar",
        collapsedWidth: PERSON_SIDEBAR_COLLAPSED_WIDTH,
        content: sidebar,
        defaultWidth: PERSON_SIDEBAR_DEFAULT_WIDTH,
        maximumWidth: PERSON_SIDEBAR_MAXIMUM_WIDTH,
        minimumWidth: PERSON_SIDEBAR_COLLAPSE_THRESHOLD,
        onCompactChange: onPersonSidebarCompactChange,
        snapThreshold: PERSON_SIDEBAR_COLLAPSE_THRESHOLD,
        storageKey: "dossier-person-sidebar-width",
      }}
      endPanel={visibleRightSidebar
        ? {
            ariaLabel: "Resize details sidebar",
            content: visibleRightSidebar,
            defaultWidth: RIGHT_SIDEBAR_DEFAULT_WIDTH,
            maximumWidth: RIGHT_SIDEBAR_MAXIMUM_WIDTH,
            minimumWidth: RIGHT_SIDEBAR_MINIMUM_WIDTH,
            storageKey: "dossier-inspector-width",
          }
        : undefined}
    >
      {main}
    </ResizableLayout>
  );
}
