import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ContentFullscreenContext } from "@/components/content-fullscreen/content-fullscreen-context";

export function ContentFullscreenProvider({ children }: { children: ReactNode }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const enterFullscreen = useCallback(() => setIsFullscreen(true), []);
  const exitFullscreen = useCallback(() => setIsFullscreen(false), []);
  const toggleFullscreen = useCallback(() => setIsFullscreen((current) => !current), []);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    const exitOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        exitFullscreen();
      }
    };

    window.addEventListener("keydown", exitOnEscape);
    return () => window.removeEventListener("keydown", exitOnEscape);
  }, [exitFullscreen, isFullscreen]);

  const controls = useMemo(
    () => ({ isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen }),
    [enterFullscreen, exitFullscreen, isFullscreen, toggleFullscreen],
  );

  return (
    <ContentFullscreenContext.Provider value={controls}>
      {children}
    </ContentFullscreenContext.Provider>
  );
}
