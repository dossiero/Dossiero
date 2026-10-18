import { and, eq } from "drizzle-orm";
import { mapInputSchema } from "../../shared/schemas.js";
import type {
  MapDocument,
  MapFeature,
  MapLayerFolder,
} from "../../shared/types.js";
import type { DossierDatabase } from "../persistence/database.js";
import {
  mapDocuments,
  people,
  personTabs,
} from "../persistence/schema.js";

export class MapDocumentStore {
  constructor(private readonly db: DossierDatabase) {}

  saveMapDocument(raw: {
    personId: string;
    tabId: string;
    features: MapFeature[];
    folders: MapLayerFolder[];
  }): MapDocument {
    const input = mapInputSchema.parse(raw);
    const updatedAt = new Date().toISOString();
    const tab = this.db
      .select({ id: personTabs.id })
      .from(personTabs)
      .where(and(
        eq(personTabs.id, input.tabId),
        eq(personTabs.personId, input.personId),
        eq(personTabs.kind, "map"),
      ))
      .get();

    if (!tab) {
      throw new Error("Map tab not found");
    }

    this.db.transaction((transaction) => {
      transaction
        .insert(mapDocuments)
        .values({
          tabId: input.tabId,
          personId: input.personId,
          features: input.features,
          folders: input.folders,
          updatedAt,
        })
        .onConflictDoUpdate({
          target: mapDocuments.tabId,
          set: {
            features: input.features,
            folders: input.folders,
            updatedAt,
          },
        })
        .run();
      transaction
        .update(people)
        .set({ updatedAt })
        .where(eq(people.id, input.personId))
        .run();
    });

    return {
      type: "FeatureCollection",
      ...this.db
        .select()
        .from(mapDocuments)
        .where(eq(mapDocuments.tabId, input.tabId))
        .get()!,
    };
  }
}
