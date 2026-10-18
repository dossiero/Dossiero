import type { CSSProperties, ReactNode } from "react";
import { useResizablePanel } from "@/features/app-shell/hooks/use-resizable-panel";
import "./resizable-layout.css";

interface ResizableLayoutProps {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  collapsedWidth?: number;
  defaultWidth: number;
  maximumWidth: number;
  minimumWidth: number;
  onCompactChange?: (compact: boolean) => void;
  panel: ReactNode | ((compact: boolean) => ReactNode);
  panelClassName?: string;
  panelSide?: "start" | "end";
  snapThreshold?: number;
  storageKey: string;
}

export function ResizableLayout({
  ariaLabel,
  children,
  className,
  collapsedWidth,
  defaultWidth,
  maximumWidth,
  minimumWidth,
  onCompactChange,
  panel,
  panelClassName,
  panelSide = "start",
  snapThreshold,
  storageKey,
}: ResizableLayoutProps) {
  const resizablePanel = useResizablePanel({
    collapsedWidth,
    defaultWidth,
    direction: panelSide === "start" ? 1 : -1,
    maximumWidth,
    minimumWidth,
    onCompactChange,
    snapThreshold,
    storageKey,
  });
  const compact = collapsedWidth !== undefined && resizablePanel.width <= collapsedWidth;
  const panelContent = typeof panel === "function" ? panel(compact) : panel;
  const layoutClassName = [
    "resizable-layout",
    `resizable-layout--${panelSide}`,
    className,
  ].filter(Boolean).join(" ");
  const resolvedPanelClassName = [
    "resizable-layout__panel",
    panelClassName,
  ].filter(Boolean).join(" ");
  const resizeHandle = (
    <div
      {...resizablePanel.resizeHandleProps}
      className="resizable-layout__handle"
      aria-label={ariaLabel}
    />
  );
  const renderedPanel = <div className={resolvedPanelClassName}>{panelContent}</div>;
  const renderedContent = (
    <div className="resizable-layout__content">{children}</div>
  );

  return (
    <div
      className={layoutClassName}
      style={{
        "--resizable-panel-width": `${resizablePanel.width}px`,
      } as CSSProperties}
    >
      {panelSide === "start"
        ? <>{renderedPanel}{resizeHandle}{renderedContent}</>
        : <>{renderedContent}{resizeHandle}{renderedPanel}</>}
    </div>
  );
}
