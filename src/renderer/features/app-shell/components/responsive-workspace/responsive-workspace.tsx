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
  WIDE_PERSON_SIDEBAR_MAX_SIZE,
  WIDE_WORKSPACE_BREAKPOINT,
  WIDE_WORKSPACE_MIN_SIZE,
  WIDE_CONTENT_DEFAULT_SIZE,
  WIDE_CONTENT_MIN_SIZE,
  WIDE_INSPECTOR_DEFAULT_SIZE,
  WIDE_INSPECTOR_MAX_SIZE,
  WIDE_INSPECTOR_MIN_SIZE,
} from "@/app/layout-constants";
import {
  PERSON_SIDEBAR_COLLAPSED_WIDTH,
  PERSON_SIDEBAR_COLLAPSE_THRESHOLD,
  pixelsToPanelPercentage,
} from "@/app/sidebar-resize";
import { useFixedPanelWidth } from "@/features/app-shell/hooks/use-fixed-panel-width";
import "./responsive-workspace.css";
import type { ResponsiveWorkspaceProps } from "./responsive-workspace.types";

export function ResponsiveWorkspace({
  width,
  contentFullscreen,
  initialWideSidebarSize,
  sidebar,
  main,
  rightSidebar,
  onPersonSidebarCompactChange,
}: ResponsiveWorkspaceProps) {
  const wideWorkspaceRef = useRef<HTMLDivElement | null>(null);
  const mediumWorkspaceRef = useRef<HTMLDivElement | null>(null);
  const wideContentRef = useRef<HTMLDivElement | null>(null);
  const wideSidebarPanel = useRef<ImperativePanelHandle | null>(null);
  const mediumSidebarPanel = useRef<ImperativePanelHandle | null>(null);
  const inspectorPanel = useRef<ImperativePanelHandle | null>(null);
  const wideWorkspaceVisible = !contentFullscreen && width >= WIDE_WORKSPACE_BREAKPOINT;
  const mediumWorkspaceVisible = !contentFullscreen
    && width >= PERSON_SIDEBAR_BREAKPOINT
    && width < WIDE_WORKSPACE_BREAKPOINT;
  const handleWideSidebarResize = useFixedPanelWidth({
    containerRef: wideWorkspaceRef,
    panelRef: wideSidebarPanel,
    collapsedWidth: PERSON_SIDEBAR_COLLAPSED_WIDTH,
    enabled: wideWorkspaceVisible,
  });
  const handleMediumSidebarResize = useFixedPanelWidth({
    containerRef: mediumWorkspaceRef,
    panelRef: mediumSidebarPanel,
    collapsedWidth: PERSON_SIDEBAR_COLLAPSED_WIDTH,
    enabled: mediumWorkspaceVisible,
  });
  const handleInspectorResize = useFixedPanelWidth({
    containerRef: wideContentRef,
    panelRef: inspectorPanel,
    enabled: wideWorkspaceVisible && Boolean(rightSidebar),
  });

  if (contentFullscreen) {
    return <div className="app-frame content-fullscreen-frame">{main}</div>;
  }

  if (width >= WIDE_WORKSPACE_BREAKPOINT) {
    return (
      <div ref={wideWorkspaceRef} className="app-frame">
        <PanelGroup
          id="layout-wide-shell"
          autoSaveId="dossier-layout-wide-shell"
          direction="horizontal"
          className="responsive-workspace__panels"
        >
          <Panel
            ref={wideSidebarPanel}
            id="wide-sidebar"
            order={1}
            defaultSize={initialWideSidebarSize}
            minSize={pixelsToPanelPercentage(PERSON_SIDEBAR_COLLAPSE_THRESHOLD, width)}
            maxSize={WIDE_PERSON_SIDEBAR_MAX_SIZE}
            collapsible
            collapsedSize={pixelsToPanelPercentage(PERSON_SIDEBAR_COLLAPSED_WIDTH, width)}
            onCollapse={() => onPersonSidebarCompactChange(true)}
            onExpand={() => onPersonSidebarCompactChange(false)}
            onResize={handleWideSidebarResize}
          >
            {sidebar}
          </Panel>
          <PanelResizeHandle
            className="resize-handle"
            aria-label="Resize subject sidebar"
          />
          <Panel id="wide-content" order={2} minSize={WIDE_WORKSPACE_MIN_SIZE}>
            {!rightSidebar ? main : (
              <div ref={wideContentRef} className="wide-content-frame">
                <PanelGroup
                  id="layout-wide-content"
                  autoSaveId="dossier-layout-wide-content"
                  direction="horizontal"
                  className="responsive-workspace__panels"
                >
                  <Panel
                    id="wide-main"
                    order={1}
                    defaultSize={WIDE_CONTENT_DEFAULT_SIZE}
                    minSize={WIDE_CONTENT_MIN_SIZE}
                  >
                    {main}
                  </Panel>
                  <PanelResizeHandle
                    className="resize-handle"
                    aria-label="Resize details sidebar"
                  />
                  <Panel
                    ref={inspectorPanel}
                    id="wide-inspector"
                    order={2}
                    defaultSize={WIDE_INSPECTOR_DEFAULT_SIZE}
                    minSize={WIDE_INSPECTOR_MIN_SIZE}
                    maxSize={WIDE_INSPECTOR_MAX_SIZE}
                    onResize={handleInspectorResize}
                  >
                    {rightSidebar}
                  </Panel>
                </PanelGroup>
              </div>
            )}
          </Panel>
        </PanelGroup>
      </div>
    );
  }

  if (width >= PERSON_SIDEBAR_BREAKPOINT) {
    return (
      <div ref={mediumWorkspaceRef} className="app-frame">
        <PanelGroup
          id="layout-medium"
          autoSaveId="dossier-layout-medium"
          key="layout-medium"
          direction="horizontal"
          className="responsive-workspace__panels"
        >
          <Panel
            ref={mediumSidebarPanel}
            id="medium-sidebar"
            order={1}
            defaultSize={MEDIUM_PERSON_SIDEBAR_DEFAULT_SIZE}
            minSize={pixelsToPanelPercentage(PERSON_SIDEBAR_COLLAPSE_THRESHOLD, width)}
            maxSize={MEDIUM_PERSON_SIDEBAR_MAX_SIZE}
            collapsible
            collapsedSize={pixelsToPanelPercentage(PERSON_SIDEBAR_COLLAPSED_WIDTH, width)}
            onCollapse={() => onPersonSidebarCompactChange(true)}
            onExpand={() => onPersonSidebarCompactChange(false)}
            onResize={handleMediumSidebarResize}
          >
            {sidebar}
          </Panel>
          <PanelResizeHandle
            className="resize-handle"
            aria-label="Resize subject sidebar"
          />
          <Panel id="medium-main" order={2}>
            {main}
          </Panel>
        </PanelGroup>
      </div>
    );
  }

  return <div className="app-frame">{main}</div>;
}
