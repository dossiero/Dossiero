import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels";
import {
  PERSON_DOSSIER_PANEL_COLLAPSED_WIDTH,
  PERSON_DOSSIER_PANEL_COMPACT_THRESHOLD,
  PERSON_DOSSIER_PANEL_DEFAULT_WIDTH,
  PERSON_DOSSIER_PANEL_MAX_WIDTH,
  panelPixelsToPercentage,
} from "./person-dossier-workspace.logic";
import "./person-dossier-workspace.css";

const PERSON_DOSSIER_CONTENT_MIN_SIZE = 58;
const PERSON_DOSSIER_PANEL_MAX_SIZE = 100 - PERSON_DOSSIER_CONTENT_MIN_SIZE;

interface PersonDossierWorkspaceProps {
  renderPanel: (compact: boolean) => ReactNode;
  children: ReactNode;
}

export function PersonDossierWorkspace({
  renderPanel,
  children,
}: PersonDossierWorkspaceProps) {
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<ImperativePanelHandle | null>(null);
  const [compact, setCompact] = useState(false);
  const [workspaceWidth, setWorkspaceWidth] = useState(window.innerWidth);

  useLayoutEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) {
      return;
    }

    const updateWorkspaceWidth = () => {
      setWorkspaceWidth(workspace.getBoundingClientRect().width);
    };
    updateWorkspaceWidth();
    const observer = new ResizeObserver(updateWorkspaceWidth);
    observer.observe(workspace);
    return () => observer.disconnect();
  }, []);

  const collapsedSize = panelPixelsToPercentage(
    PERSON_DOSSIER_PANEL_COLLAPSED_WIDTH,
    workspaceWidth,
  );
  const expandedMinimumSize = Math.min(
    PERSON_DOSSIER_PANEL_MAX_SIZE,
    panelPixelsToPercentage(PERSON_DOSSIER_PANEL_COMPACT_THRESHOLD, workspaceWidth),
  );
  const maximumSize = Math.max(
    expandedMinimumSize,
    Math.min(
      PERSON_DOSSIER_PANEL_MAX_SIZE,
      panelPixelsToPercentage(PERSON_DOSSIER_PANEL_MAX_WIDTH, workspaceWidth),
    ),
  );
  const defaultSize = Math.min(
    maximumSize,
    Math.max(
      expandedMinimumSize,
      panelPixelsToPercentage(PERSON_DOSSIER_PANEL_DEFAULT_WIDTH, workspaceWidth),
    ),
  );

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const currentPanelWidth = panel.getSize() * workspaceWidth / 100;
    if (panel.isCollapsed()) {
      panel.resize(collapsedSize);
      setCompact(true);
      return;
    }

    if (currentPanelWidth < PERSON_DOSSIER_PANEL_COMPACT_THRESHOLD) {
      panel.collapse();
      setCompact(true);
      return;
    }

    setCompact(false);
  }, [collapsedSize, workspaceWidth]);

  return (
    <div ref={workspaceRef} className="person-dossier-workspace">
      <PanelGroup
        id="person-dossier-workspace"
        autoSaveId="person-dossier-workspace"
        direction="horizontal"
        className="person-dossier-workspace__panels"
      >
        <Panel
          ref={panelRef}
          id="person-dossier-navigation"
          order={1}
          defaultSize={defaultSize}
          minSize={expandedMinimumSize}
          maxSize={maximumSize}
          collapsible
          collapsedSize={collapsedSize}
          onCollapse={() => setCompact(true)}
          onExpand={() => setCompact(false)}
          onResize={() => setCompact(panelRef.current?.isCollapsed() ?? false)}
        >
          {renderPanel(compact)}
        </Panel>
        <PanelResizeHandle
          className="person-dossier-workspace__resize-handle"
          aria-label="Resize dossier navigation"
        />
        <Panel
          id="person-dossier-content"
          order={2}
          minSize={PERSON_DOSSIER_CONTENT_MIN_SIZE}
          className="person-dossier-workspace__content"
        >
          {children}
        </Panel>
      </PanelGroup>
    </div>
  );
}
