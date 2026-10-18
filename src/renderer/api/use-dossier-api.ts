import { useContext } from "react";
import { DossierApiContext } from "@/api/dossier-api-context";

export function useDossierApi() {
  const dossierApi = useContext(DossierApiContext);
  if (!dossierApi) {
    throw new Error("DossierApiProvider missing");
  }

  return dossierApi;
}
