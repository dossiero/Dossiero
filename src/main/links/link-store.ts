import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { linkInputSchema } from "../../shared/schemas.js";
import type { LinkItem } from "../../shared/types.js";
import type { DossierDatabase } from "../persistence/database.js";
import { links, people } from "../persistence/schema.js";

export class LinkStore {
  constructor(private readonly db: DossierDatabase) {}

  createLink(raw: {
    personId: string;
    tabId: string;
    label: string;
    url: string;
    notes?: string;
  }): LinkItem {
    const input = linkInputSchema.parse(raw);
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    this.db.transaction((transaction) => {
      transaction.insert(links).values({
        id,
        personId: input.personId,
        tabId: input.tabId,
        label: input.label,
        url: input.url,
        notes: input.notes ?? "",
        syncStatus: "unsupported",
        syncMetadata: null,
        createdAt,
        updatedAt: createdAt,
      }).run();
      transaction
        .update(people)
        .set({ updatedAt: createdAt })
        .where(eq(people.id, input.personId))
        .run();
    });

    return this.db.select().from(links).where(eq(links.id, id)).get()!;
  }

  updateLink(
    id: string,
    raw: { label: string; url: string; notes?: string },
  ): LinkItem {
    const current = this.db.select({ id: links.id }).from(links).where(eq(links.id, id)).get();

    if (!current) {
      throw new Error("Link not found");
    }

    const input = linkInputSchema.omit({ personId: true, tabId: true }).parse(raw);
    this.db.update(links).set({
      label: input.label,
      url: input.url,
      notes: input.notes ?? "",
      updatedAt: new Date().toISOString(),
    }).where(eq(links.id, id)).run();

    return this.db.select().from(links).where(eq(links.id, id)).get()!;
  }

  deleteLink(id: string): void {
    this.db.delete(links).where(eq(links.id, id)).run();
  }

  findLink(id: string): LinkItem | null {
    return this.db.select().from(links).where(eq(links.id, id)).get() ?? null;
  }
}
