import type { ReactNode } from "react";
import { ResizableLayout } from "@/features/app-shell/components/resizable-layout/resizable-layout";
import {
  PERSON_DOSSIER_PANEL_COLLAPSED_WIDTH,
  PERSON_DOSSIER_PANEL_COMPACT_THRESHOLD,
  PERSON_DOSSIER_PANEL_DEFAULT_WIDTH,
  PERSON_DOSSIER_PANEL_MAX_WIDTH,
} from "./person-dossier-workspace.logic";
import "./person-dossier-workspace.css";

interface PersonDossierWorkspaceProps {
  renderPanel: (compact: boolean) => ReactNode;
  children: ReactNode;
}

export function PersonDossierWorkspace({
  renderPanel,
  children,
}: PersonDossierWorkspaceProps) {
  return (
    <ResizableLayout
      ariaLabel="Resize dossier navigation"
      className="person-dossier-workspace"
      collapsedWidth={PERSON_DOSSIER_PANEL_COLLAPSED_WIDTH}
      defaultWidth={PERSON_DOSSIER_PANEL_DEFAULT_WIDTH}
      maximumWidth={PERSON_DOSSIER_PANEL_MAX_WIDTH}
      minimumWidth={PERSON_DOSSIER_PANEL_COMPACT_THRESHOLD}
      panel={renderPanel}
      panelClassName="person-dossier-workspace__panel"
      snapThreshold={PERSON_DOSSIER_PANEL_COMPACT_THRESHOLD}
      storageKey="dossier-person-panel-width"
    >
      <div className="person-dossier-workspace__content">{children}</div>
    </ResizableLayout>
  );
}
