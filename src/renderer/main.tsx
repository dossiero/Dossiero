import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { DossierApiProvider } from "@/api/components/dossier-api-provider/dossier-api-provider";
import { ContentFullscreenProvider } from "@/components/content-fullscreen-provider/content-fullscreen-provider";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DossierApiProvider>
      <ContentFullscreenProvider>
        <App />
      </ContentFullscreenProvider>
    </DossierApiProvider>
  </StrictMode>,
);
