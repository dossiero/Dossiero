import { useEffect, useState, type ReactNode } from "react";
import type { DossierApi } from "@shared/types";
import { createDossierApi } from "@/api";
import { DossierApiContext } from "@/api/dossier-api-context";
import "./dossier-api-provider.css";

export function DossierApiProvider({ children }: { children: ReactNode }) {
  const [dossierApi, setDossierApi] = useState<DossierApi | null>(null);

  useEffect(() => {
    let removeFullScreenListener: (() => void) | undefined;

    void createDossierApi().then((resolvedApi) => {
      document.documentElement.dataset.runtime = resolvedApi.capabilities.desktop
        ? "desktop"
        : "web";
      const bridge = window.dossierBridge;
      if (bridge?.platform === "darwin") {
        const setFullScreen = (fullScreen: boolean) => {
          document.documentElement.dataset.fullscreen = String(fullScreen);
        };
        void bridge.isFullScreen().then(setFullScreen);
        removeFullScreenListener = bridge.onFullScreenChange(setFullScreen);
      }
      setDossierApi(resolvedApi);
    });

    return () => removeFullScreenListener?.();
  }, []);

  if (!dossierApi) {
    return (
      <div className="boot-screen">
        <div className="boot-mark">DOSSIERO</div>
        <p>
          &gt; establishing local channel
          <span className="cursor">_</span>
        </p>
      </div>
    );
  }

  return (
    <DossierApiContext.Provider value={dossierApi}>
      {children}
    </DossierApiContext.Provider>
  );
}
