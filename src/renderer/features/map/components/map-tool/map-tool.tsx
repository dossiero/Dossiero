import type { ReactNode } from "react";
import { Tooltip } from "@/components/tooltip/tooltip";
import "./map-tool.css";

interface MapToolProps {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}

export function MapTool({ active, label, onClick, children }: MapToolProps) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        className={active ? "is-active" : ""}
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
      >
        {children}
      </button>
    </Tooltip>
  );
}
