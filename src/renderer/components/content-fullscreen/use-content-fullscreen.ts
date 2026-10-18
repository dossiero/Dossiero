import { useContext } from "react";
import { ContentFullscreenContext } from "./content-fullscreen-context";

export function useContentFullscreen() {
  const controls = useContext(ContentFullscreenContext);
  if (!controls) {
    throw new Error("useContentFullscreen must be used inside ContentFullscreenProvider");
  }

  return controls;
}
