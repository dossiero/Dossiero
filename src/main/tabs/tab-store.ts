import { eq, inArray, max, notExists } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { tabInputSchema } from "../../shared/schemas.js";
import type {
  PersonTab,
  TabIcon,
  TabKind,
} from "../../shared/types.js";
import { MediaStore } from "../media/media-store.js";
import type { DossierDatabase } from "../persistence/database.js";
import {
  mapDocuments,
  mediaItems,
  mediaTags,
  people,
  personTabs,
  tags,
  textDocuments,
} from "../persistence/schema.js";

function defaultTabIcon(kind: TabKind): TabIcon {
  switch (kind) {
    case "media":
      return "images";
    case "links":
      return "link";
    case "relation":
      return "user";
    case "map":
      return "map-pin";
    default:
      return "file-text";
  }
}

export class TabStore {
  constructor(
    private readonly db: DossierDatabase,
    private readonly mediaStore: MediaStore,
  ) {}

  createTab(personId: string, raw: { name: string; kind: TabKind }): PersonTab {
    const input = tabInputSchema.parse(raw);
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const currentPosition = this.db
      .select({ value: max(personTabs.position) })
      .from(personTabs)
      .where(eq(personTabs.personId, personId))
      .get();
    const position = (currentPosition?.value ?? -1) + 1;

    this.db.transaction((transaction) => {
      transaction.insert(personTabs).values({
        id,
        personId,
        name: input.name,
        kind: input.kind,
        icon: defaultTabIcon(input.kind),
        position,
        isDefault: false,
        createdAt,
      }).run();

      if (input.kind === "text") {
        transaction.insert(textDocuments).values({
          tabId: id,
          personId,
          content: { blocks: [] },
          body: "",
          updatedAt: createdAt,
        }).run();
      }

      if (input.kind === "map") {
        transaction.insert(mapDocuments).values({
          tabId: id,
          personId,
          features: [],
          folders: [],
          updatedAt: createdAt,
        }).run();
      }
    });

    return this.db.select().from(personTabs).where(eq(personTabs.id, id)).get()!;
  }

  updateTab(
    id: string,
    input: { name?: string; icon?: TabIcon; position?: number },
  ): PersonTab {
    const current = this.db.select().from(personTabs).where(eq(personTabs.id, id)).get();

    if (!current) {
      throw new Error("Tab not found");
    }

    this.db.update(personTabs).set({
      name: input.name?.trim() || current.name,
      icon: input.icon ?? current.icon,
      position: input.position ?? current.position,
    }).where(eq(personTabs.id, id)).run();

    return this.db.select().from(personTabs).where(eq(personTabs.id, id)).get()!;
  }

  deleteTab(id: string): void {
    const tab = this.db
      .select({ id: personTabs.id })
      .from(personTabs)
      .where(eq(personTabs.id, id))
      .get();

    if (!tab) {
      return;
    }

    const files = this.db
      .select({
        id: mediaItems.id,
        person_id: mediaItems.personId,
        stored_name: mediaItems.storedName,
      })
      .from(mediaItems)
      .where(eq(mediaItems.tabId, id))
      .all();

    this.db.transaction((transaction) => {
      const mediaIds = files.map((file) => file.id);

      if (mediaIds.length > 0) {
        transaction
          .update(people)
          .set({ profilePhotoId: null })
          .where(inArray(people.profilePhotoId, mediaIds))
          .run();
      }

      transaction.delete(personTabs).where(eq(personTabs.id, id)).run();
      transaction.delete(tags).where(
        notExists(
          transaction
            .select({ mediaId: mediaTags.mediaId })
            .from(mediaTags)
            .where(eq(mediaTags.tagId, tags.id)),
        ),
      ).run();
    });

    this.mediaStore.removeFiles(files);
  }
}
