import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  or,
  sql,
} from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { personInputSchema } from "../../shared/schemas.js";
import type {
  Person,
  PersonBundle,
  PersonInput,
  PersonStatus,
  SearchResult,
} from "../../shared/types.js";
import { MediaStore } from "../media/media-store.js";
import type { DossierDatabase } from "../persistence/database.js";
import {
  cases,
  mediaItems,
  people,
  textDocuments,
} from "../persistence/schema.js";
import { insertDefaultTabs } from "../tabs/default-tabs.js";
import { loadPersonDetails } from "./person-query.js";
import { searchPeople } from "./people-search.js";

function now(): string {
  return new Date().toISOString();
}

export class PeopleStore {
  constructor(
    private readonly db: DossierDatabase,
    private readonly mediaStore: MediaStore,
  ) {}

  listPeople(
    query = "",
    status: PersonStatus = "active",
    includeRelated = false,
    caseId?: string,
  ): Person[] {
    const conditions = [eq(people.status, status)];

    if (caseId) {
      conditions.push(eq(people.caseId, caseId));
    }

    if (status === "active" && !includeRelated) {
      conditions.push(eq(people.type, "default"));
    }

    if (!query.trim()) {
      return this.db
        .select()
        .from(people)
        .where(and(...conditions))
        .orderBy(desc(people.updatedAt))
        .all();
    }

    const pattern = `%${query.trim()}%`;
    const searchCondition = or(
      sql`${people.name} LIKE ${pattern} COLLATE NOCASE`,
      sql`${people.aliases} LIKE ${pattern} COLLATE NOCASE`,
      sql`${textDocuments.body} LIKE ${pattern} COLLATE NOCASE`,
    );

    return this.db
      .selectDistinct(getTableColumns(people))
      .from(people)
      .leftJoin(textDocuments, eq(textDocuments.personId, people.id))
      .where(and(...conditions, searchCondition))
      .orderBy(desc(people.updatedAt))
      .all();
  }

  getPerson(id: string): PersonBundle | null {
    return loadPersonDetails(this.db, this.mediaStore, id);
  }

  createPerson(raw: PersonInput, caseId?: string): PersonBundle {
    const input = personInputSchema.parse(raw);
    const owningCaseId = caseId ?? this.db
      .select({ id: cases.id })
      .from(cases)
      .orderBy(asc(cases.createdAt), asc(cases.id))
      .get()?.id;

    if (!owningCaseId) {
      throw new Error("Case not found");
    }

    const id = randomUUID();
    const createdAt = now();

    this.db.transaction((transaction) => {
      transaction.insert(people).values({
        id,
        caseId: owningCaseId,
        name: input.name,
        aliases: input.aliases ?? [],
        birthDate: input.birthDate ?? null,
        summary: input.summary ?? "",
        status: "active",
        type: "default",
        pinned: false,
        createdAt,
        updatedAt: createdAt,
      }).run();

      insertDefaultTabs(transaction, id, createdAt);
    });

    this.mediaStore.ensurePersonDirectory(id);

    if (input.profilePhoto) {
      this.mediaStore.attachProfilePhoto(id, input.profilePhoto, input.profileThumbnail);
    }

    return this.getPerson(id)!;
  }

  updatePerson(id: string, raw: PersonInput): PersonBundle {
    const input = personInputSchema.parse(raw);
    const result = this.db
      .update(people)
      .set({
        name: input.name,
        aliases: input.aliases ?? [],
        birthDate: input.birthDate ?? null,
        summary: input.summary ?? "",
        updatedAt: now(),
      })
      .where(eq(people.id, id))
      .run();

    if (!result.changes) {
      throw new Error("Subject not found");
    }

    if (input.profilePhoto) {
      this.mediaStore.attachProfilePhoto(id, input.profilePhoto, input.profileThumbnail);
    }

    return this.getPerson(id)!;
  }

  setProfilePhoto(personId: string, mediaId: string): Person {
    const media = this.db
      .select({
        personId: mediaItems.personId,
        mimeType: mediaItems.mimeType,
      })
      .from(mediaItems)
      .where(eq(mediaItems.id, mediaId))
      .get();

    if (!media || media.personId !== personId) {
      throw new Error("Image does not belong to this subject");
    }

    if (!media.mimeType.startsWith("image/")) {
      throw new Error("Only images can be used as profile photos");
    }

    const result = this.db
      .update(people)
      .set({ profilePhotoId: mediaId, updatedAt: now() })
      .where(eq(people.id, personId))
      .run();

    if (!result.changes) {
      throw new Error("Subject not found");
    }

    return this.db.select().from(people).where(eq(people.id, personId)).get()!;
  }

  setPersonArchived(id: string, archived: boolean): Person {
    const result = this.db
      .update(people)
      .set({
        status: archived ? "archived" : "active",
        updatedAt: now(),
      })
      .where(eq(people.id, id))
      .run();

    if (!result.changes) {
      throw new Error("Subject not found");
    }

    return this.db.select().from(people).where(eq(people.id, id)).get()!;
  }

  setPersonPinned(id: string, pinned: boolean): Person {
    const result = this.db.update(people).set({ pinned }).where(eq(people.id, id)).run();

    if (!result.changes) {
      throw new Error("Subject not found");
    }

    return this.db.select().from(people).where(eq(people.id, id)).get()!;
  }

  deletePerson(id: string): void {
    const files = this.db
      .select({
        id: mediaItems.id,
        person_id: mediaItems.personId,
        stored_name: mediaItems.storedName,
      })
      .from(mediaItems)
      .where(eq(mediaItems.personId, id))
      .all();

    this.db.delete(people).where(eq(people.id, id)).run();
    this.mediaStore.removePersonFiles(id, files);
  }

  search(query: string, caseId?: string): SearchResult[] {
    return searchPeople(this.db, query, caseId);
  }

}
