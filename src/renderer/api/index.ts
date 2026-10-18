import type { DossierBridge } from "../../shared/ipc";
import type { DossierApi } from "../../shared/types";
import { ElectronApi } from "./electron-api";
import { MemoryApi } from "./memory-api";
import { WebApi } from "./web-api";

declare global {
  interface Window {
    dossierBridge?: DossierBridge;
  }
}

export async function createDossierApi(): Promise<DossierApi> {
  if (window.dossierBridge) {
    return new ElectronApi(window.dossierBridge);
  }

  if (await WebApi.available()) {
    return new WebApi();
  }

  return new MemoryApi();
}
