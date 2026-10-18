import { MapPin, Pencil, Route } from "lucide-react";
import { MapTool } from "@/features/map/components/map-tool/map-tool";
import type { Tool } from "@/features/map/map.types";
import "./drawing-toolbar.css";

export function DrawingToolbar({
  tool,
  onChange,
}: {
  tool: Tool;
  onChange: (tool: Tool) => void;
}) {
  return (
    <div className="map-tools" role="toolbar" aria-label="Map drawing tools">
      <MapTool
        active={tool === "pin"}
        label="Add pin"
        onClick={() => onChange(tool === "pin" ? "pan" : "pin")}
      >
        <MapPin size={16} />
      </MapTool>
      <MapTool
        active={tool === "pen"}
        label="Freehand pen"
        onClick={() => onChange(tool === "pen" ? "pan" : "pen")}
      >
        <Pencil size={16} />
      </MapTool>
      <MapTool
        active={tool === "line"}
        label="Draw line or polygon"
        onClick={() => onChange(tool === "line" ? "pan" : "line")}
      >
        <Route size={16} />
      </MapTool>
    </div>
  );
}
