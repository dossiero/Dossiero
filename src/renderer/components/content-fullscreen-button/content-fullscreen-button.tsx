import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/button/button";
import { useContentFullscreen } from "@/components/content-fullscreen/use-content-fullscreen";
import { Tooltip } from "@/components/tooltip/tooltip";

export function ContentFullscreenButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const { isFullscreen, toggleFullscreen } = useContentFullscreen();
  const label = isFullscreen ? "Exit content fullscreen" : "Enter content fullscreen";
  const Icon = isFullscreen ? Minimize2 : Maximize2;

  return (
    <Tooltip label={`${label} (Esc to exit)`}>
      <Button
        variant={isFullscreen ? "signal" : "ghost"}
        size={iconOnly ? "icon" : "sm"}
        onClick={toggleFullscreen}
        aria-label={label}
        aria-pressed={isFullscreen}
      >
        <Icon size={13} />
        {!iconOnly && (isFullscreen ? "Exit fullscreen" : "Fullscreen")}
      </Button>
    </Tooltip>
  );
}
