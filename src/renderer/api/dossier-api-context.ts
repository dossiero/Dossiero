import { createContext } from "react";
import type { DossierApi } from "@shared/types";

export const DossierApiContext = createContext<DossierApi | null>(null);
