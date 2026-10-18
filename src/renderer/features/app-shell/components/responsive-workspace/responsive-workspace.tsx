import { useRef } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels";
import {
  MEDIUM_PERSON_SIDEBAR_DEFAULT_SIZE,
  MEDIUM_PERSON_SIDEBAR_MAX_SIZE,
  PERSON_SIDEBAR_BREAKPOINT,
  PERSON_SIDEBAR_MIN_WIDTH,
  WIDE_PERSON_SIDEBAR_MAX_SIZE,
  WIDE_WORKSPACE_BREAKPOINT,
  WIDE_WORKSPACE_MIN_SIZE,
  WIDE_CONTENT_DEFAULT_SIZE,
  WIDE_CONTENT_MIN_SIZE,
  WIDE_INSPECTOR_DEFAULT_SIZE,
  WIDE_INSPECTOR_MAX_SIZE,
  WIDE_INSPECTOR_MIN_SIZE,
} from "@/app/layout-constants";
import { pixelsToPanelPercentage } from "@/app/sidebar-resize";
import "./responsive-workspace.css";
import type { ResponsiveWorkspaceProps } from "./responsive-workspace.types";

export function ResponsiveWorkspace({
  width,
  contentFullscreen,
  initialWideSidebarSize,
  sidebar,
  main,
  rightSidebar,
  onPersonSidebarResize,
}: ResponsiveWorkspaceProps) {
  const wideSidebarPanel = useRef<ImperativePanelHandle | null>(null);
  const mediumSidebarPanel = useRef<ImperativePanelHandle | null>(null);

  if (contentFullscreen) {
    return <div className="app-frame content-fullscreen-frame">{main}</div>;
  }

  if (width >= WIDE_WORKSPACE_BREAKPOINT) {
    return (
      <PanelGroup
        id="layout-wide-shell"
        autoSaveId="dossier-layout-wide-shell"
        direction="horizontal"
        className="app-frame"
      >
        <Panel
          ref={wideSidebarPanel}
          id="wide-sidebar"
          order={1}
          defaultSize={initialWideSidebarSize}
          minSize={pixelsToPanelPercentage(PERSON_SIDEBAR_MIN_WIDTH, width)}
          maxSize={WIDE_PERSON_SIDEBAR_MAX_SIZE}
          onResize={(size) => {
            const panel = wideSidebarPanel.current;
            onPersonSidebarResize(size, (nextSize) => panel?.resize(nextSize));
          }}
        >
          {sidebar}
        </Panel>
        <PanelResizeHandle className="resize-handle" aria-label="Resize subject sidebar" />
        <Panel id="wide-content" order={2} minSize={WIDE_WORKSPACE_MIN_SIZE}>
          {!rightSidebar ? main : (
            <PanelGroup
              id="layout-wide-content"
              autoSaveId="dossier-layout-wide-content"
              direction="horizontal"
              className="wide-content-frame"
            >
              <Panel
                id="wide-main"
                order={1}
                defaultSize={WIDE_CONTENT_DEFAULT_SIZE}
                minSize={WIDE_CONTENT_MIN_SIZE}
              >
                {main}
              </Panel>
              <PanelResizeHandle className="resize-handle" aria-label="Resize details sidebar" />
              <Panel
                id="wide-inspector"
                order={2}
                defaultSize={WIDE_INSPECTOR_DEFAULT_SIZE}
                minSize={WIDE_INSPECTOR_MIN_SIZE}
                maxSize={WIDE_INSPECTOR_MAX_SIZE}
              >
                {rightSidebar}
              </Panel>
            </PanelGroup>
          )}
        </Panel>
      </PanelGroup>
    );
  }

  if (width >= PERSON_SIDEBAR_BREAKPOINT) {
    return (
      <PanelGroup
        id="layout-medium"
        autoSaveId="dossier-layout-medium"
        key="layout-medium"
        direction="horizontal"
        className="app-frame"
      >
        <Panel
          ref={mediumSidebarPanel}
          id="medium-sidebar"
          order={1}
          defaultSize={MEDIUM_PERSON_SIDEBAR_DEFAULT_SIZE}
          minSize={pixelsToPanelPercentage(PERSON_SIDEBAR_MIN_WIDTH, width)}
          maxSize={MEDIUM_PERSON_SIDEBAR_MAX_SIZE}
          onResize={(size) => {
            const panel = mediumSidebarPanel.current;
            onPersonSidebarResize(size, (nextSize) => panel?.resize(nextSize));
          }}
        >
          {sidebar}
        </Panel>
        <PanelResizeHandle className="resize-handle" aria-label="Resize subject sidebar" />
        <Panel id="medium-main" order={2}>{main}</Panel>
      </PanelGroup>
    );
  }

  return <div className="app-frame">{main}</div>;
}
