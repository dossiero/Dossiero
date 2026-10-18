import {
  ResizablePanelRegion,
} from "@/features/app-shell/components/resizable-panel-region/resizable-panel-region";
import "./resizable-layout.css";
import type { ResizableLayoutProps } from "./resizable-layout.types";

export function ResizableLayout({
  children,
  className,
  endPanel,
  startPanel,
}: ResizableLayoutProps) {
  const layoutClassName = [
    "resizable-layout",
    startPanel && "resizable-layout--has-start-panel",
    endPanel && "resizable-layout--has-end-panel",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className={layoutClassName}>
      {startPanel && <ResizablePanelRegion definition={startPanel} side="start" />}
      <div className="resizable-layout__content">{children}</div>
      {endPanel && <ResizablePanelRegion definition={endPanel} side="end" />}
    </div>
  );
}
