import { useEffect, useMemo, useState } from "react";
import { Globe, Search } from "lucide-react";
import { toast } from "sonner";
import type {
  AppSettings,
  DossierApi,
  ExternalBrowser,
} from "@shared/types";
import { Button } from "@/components/button/button";
import "./browser-preference.css";

interface BrowserPreferenceProps {
  api: DossierApi;
  preference: AppSettings["externalBrowser"];
  onUpdate: (input: Partial<AppSettings>) => Promise<void>;
}

export function BrowserPreference({
  api,
  preference,
  onUpdate,
}: BrowserPreferenceProps) {
  const [installedBrowsers, setInstalledBrowsers] = useState<ExternalBrowser[]>([]);
  const [choosing, setChoosing] = useState(false);

  useEffect(() => {
    if (!api.capabilities.desktop) return;

    void api.listExternalBrowsers()
      .then(setInstalledBrowsers)
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Could not find installed browsers");
      });
  }, [api]);

  const browserOptions = useMemo(() => {
    if (
      preference.kind === "application"
      && !installedBrowsers.some((browser) => browser.path === preference.path)
    ) {
      return [preference, ...installedBrowsers];
    }

    return installedBrowsers;
  }, [installedBrowsers, preference]);

  const selectedPath = preference.kind === "application" ? preference.path : "system";

  const handleBrowserChange = (path: string) => {
    if (path === "system") {
      void onUpdate({ externalBrowser: { kind: "system" } });
      return;
    }

    const browser = browserOptions.find((option) => option.path === path);
    if (!browser) return;

    void onUpdate({
      externalBrowser: {
        kind: "application",
        name: browser.name,
        path: browser.path,
      },
    });
  };

  const chooseBrowser = async () => {
    setChoosing(true);

    try {
      const browser = await api.chooseExternalBrowser();
      if (!browser) return;

      setInstalledBrowsers((current) => (
        current.some((item) => item.path === browser.path)
          ? current
          : [browser, ...current]
      ));
      await onUpdate({
        externalBrowser: {
          kind: "application",
          name: browser.name,
          path: browser.path,
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not choose browser");
    } finally {
      setChoosing(false);
    }
  };

  return (
    <div className="browser-preference">
      <div className="browser-preference-heading">
        <Globe size={17} />
        <span>
          <strong>Open links with</strong>
          <small>
            Use your system default, a detected browser, or choose another application.
          </small>
        </span>
      </div>
      <div className="browser-preference-controls">
        <select
          aria-label="Browser used to open links"
          disabled={!api.capabilities.desktop}
          value={selectedPath}
          onChange={(event) => handleBrowserChange(event.target.value)}
        >
          <option value="system">System default browser</option>
          {browserOptions.map((browser) => (
            <option key={browser.path} value={browser.path}>
              {browser.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="quiet"
          disabled={!api.capabilities.desktop || choosing}
          onClick={() => void chooseBrowser()}
        >
          <Search size={14} />
          {choosing ? "Choosing…" : "Choose application…"}
        </Button>
      </div>
      {!api.capabilities.desktop && (
        <small className="browser-preference-note">
          Browser selection is available in the desktop app.
        </small>
      )}
    </div>
  );
}
