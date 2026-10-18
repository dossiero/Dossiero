import type { ReactNode } from "react";

export interface ResizablePanelDefinition {
  ariaLabel: string;
  collapsedWidth?: number;
  content: ReactNode | ((compact: boolean) => ReactNode);
  defaultWidth: number;
  maximumWidth: number;
  minimumWidth: number;
  onCompactChange?: (compact: boolean) => void;
  panelClassName?: string;
  snapThreshold?: number;
  storageKey: string;
}

export interface ResizableLayoutProps {
  children: ReactNode;
  className?: string;
  endPanel?: ResizablePanelDefinition;
  startPanel?: ResizablePanelDefinition;
}
