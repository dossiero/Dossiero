import { asc, desc, eq } from "drizzle-orm";
import type { PersonBundle } from "../../shared/types.js";
import { MediaStore } from "../media/media-store.js";
import type { DossierDatabase } from "../persistence/database.js";
import {
  links,
  mapDocuments,
  people,
  personTabs,
  textDocuments,
} from "../persistence/schema.js";
import { loadRelationNetwork } from "../relations/relation-network.js";

export function loadPersonDetails(
  db: DossierDatabase,
  mediaStore: MediaStore,
  id: string,
): PersonBundle | null {
  const person = db.select().from(people).where(eq(people.id, id)).get();

  if (!person) {
    return null;
  }

  const network = loadRelationNetwork(db, id);
  const maps = db
    .select()
    .from(mapDocuments)
    .where(eq(mapDocuments.personId, id))
    .all()
    .map((document) => ({
      type: "FeatureCollection" as const,
      ...document,
    }));

  return {
    person,
    tabs: db
      .select()
      .from(personTabs)
      .where(eq(personTabs.personId, id))
      .orderBy(asc(personTabs.position))
      .all(),
    textDocuments: db
      .select()
      .from(textDocuments)
      .where(eq(textDocuments.personId, id))
      .all(),
    maps,
    mediaItems: mediaStore.listPersonMedia(id),
    links: db
      .select()
      .from(links)
      .where(eq(links.personId, id))
      .orderBy(desc(links.updatedAt))
      .all(),
    ...network,
  };
}
