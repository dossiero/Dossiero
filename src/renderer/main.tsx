import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { APPLICATION_WEBSITE } from "@shared/app-metadata";

function render(content: ReactNode) {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>{content}</StrictMode>,
  );
}

async function renderAboutWindow(parameters: URLSearchParams) {
  const { AboutWindow } = await import(
    "@/features/about/components/about-window/about-window"
  );

  render(
    <AboutWindow
      applicationName={parameters.get("applicationName") ?? "Dossiero"}
      applicationVersion={parameters.get("applicationVersion") ?? ""}
      copyright={parameters.get("copyright") ?? ""}
      website={APPLICATION_WEBSITE}
    />,
  );
}

async function renderApplication() {
  const { default: App } = await import("./App");
  const { DossierApiProvider } = await import(
    "@/api/components/dossier-api-provider/dossier-api-provider"
  );
  const { ContentFullscreenProvider } = await import(
    "@/components/content-fullscreen-provider/content-fullscreen-provider"
  );
  await import("./styles.css");

  render(
    <DossierApiProvider>
      <ContentFullscreenProvider>
        <App />
      </ContentFullscreenProvider>
    </DossierApiProvider>,
  );
}

const parameters = new URLSearchParams(window.location.search);

if (parameters.get("window") === "about") {
  void renderAboutWindow(parameters);
} else {
  void renderApplication();
}
