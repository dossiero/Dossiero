import type { CSSProperties } from "react";
import type {
  ResizablePanelDefinition,
} from "@/features/app-shell/components/resizable-layout/resizable-layout.types";
import { useResizablePanel } from "@/features/app-shell/hooks/use-resizable-panel";
import "./resizable-panel-region.css";

interface ResizablePanelRegionProps {
  definition: ResizablePanelDefinition;
  side: "start" | "end";
}

export function ResizablePanelRegion({
  definition,
  side,
}: ResizablePanelRegionProps) {
  const resizablePanel = useResizablePanel({
    collapsedWidth: definition.collapsedWidth,
    defaultWidth: definition.defaultWidth,
    direction: side === "start" ? 1 : -1,
    maximumWidth: definition.maximumWidth,
    minimumWidth: definition.minimumWidth,
    onCompactChange: definition.onCompactChange,
    snapThreshold: definition.snapThreshold,
    storageKey: definition.storageKey,
  });
  const compact = definition.collapsedWidth !== undefined
    && resizablePanel.width <= definition.collapsedWidth;
  const panelContent = typeof definition.content === "function"
    ? definition.content(compact)
    : definition.content;
  const panelClassName = [
    "resizable-panel-region__panel",
    `resizable-panel-region__panel--${side}`,
    definition.panelClassName,
  ].filter(Boolean).join(" ");
  const resizeHandle = (
    <div
      {...resizablePanel.resizeHandleProps}
      className="resizable-panel-region__handle"
      aria-label={definition.ariaLabel}
    />
  );
  const panel = (
    <div
      className={panelClassName}
      style={{ width: resizablePanel.width } as CSSProperties}
    >
      {panelContent}
    </div>
  );

  return side === "start"
    ? <>{panel}{resizeHandle}</>
    : <>{resizeHandle}{panel}</>;
}
