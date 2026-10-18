import { and, asc, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  personInputSchema,
  relationTypeSchema,
} from "../../shared/schemas.js";
import type {
  PersonBundle,
  PersonInput,
  RelationPosition,
  Relationship,
} from "../../shared/types.js";
import { MediaStore } from "../media/media-store.js";
import { loadPersonDetails } from "../people/person-query.js";
import type { DossierDatabase } from "../persistence/database.js";
import {
  people,
  personTabs,
  relationships,
  relationPositions,
} from "../persistence/schema.js";
import { insertDefaultTabs } from "../tabs/default-tabs.js";
import { loadRelationNetwork } from "./relation-network.js";

function now(): string {
  return new Date().toISOString();
}

export class RelationshipStore {
  constructor(
    private readonly db: DossierDatabase,
    private readonly mediaStore: MediaStore,
  ) {}

  createRelatedPerson(
    viewPersonId: string,
    tabId: string,
    ownerPersonId: string,
    relationTypeRaw: string,
    raw: PersonInput,
  ): PersonBundle {
    const relationType = relationTypeSchema.parse(relationTypeRaw);
    const input = personInputSchema.parse(raw);
    const relationTab = this.db
      .select({ id: personTabs.id, caseId: people.caseId })
      .from(personTabs)
      .innerJoin(people, eq(people.id, personTabs.personId))
      .where(and(
        eq(personTabs.id, tabId),
        eq(personTabs.personId, viewPersonId),
        eq(personTabs.kind, "relation"),
      ))
      .get();

    if (!relationTab) {
      throw new Error("Relation tab not found");
    }

    const targetIsVisible = ownerPersonId === viewPersonId ||
      loadRelationNetwork(this.db, viewPersonId).relationships.some((relationship) => {
        return relationship.tabId === tabId && relationship.relatedPersonId === ownerPersonId;
      });

    if (!targetIsVisible) {
      throw new Error("Connection target is not in this relation tab");
    }

    const ownerTabId = ownerPersonId === viewPersonId
      ? tabId
      : this.db
        .select({ id: personTabs.id })
        .from(personTabs)
        .where(and(
          eq(personTabs.personId, ownerPersonId),
          eq(personTabs.kind, "relation"),
        ))
        .orderBy(desc(personTabs.isDefault), asc(personTabs.position))
        .get()?.id;

    if (!ownerTabId) {
      throw new Error("Connection target has no relation tab");
    }

    const id = randomUUID();
    const createdAt = now();

    this.db.transaction((transaction) => {
      transaction.insert(people).values({
        id,
        caseId: relationTab.caseId,
        name: input.name,
        aliases: input.aliases ?? [],
        birthDate: input.birthDate ?? null,
        summary: input.summary ?? "",
        status: "active",
        type: "related",
        pinned: false,
        createdAt,
        updatedAt: createdAt,
      }).run();
      insertDefaultTabs(transaction, id, createdAt);
      transaction.insert(relationships).values({
        id: randomUUID(),
        ownerPersonId,
        relatedPersonId: id,
        relationType,
        createdAt,
        updatedAt: createdAt,
        tabId: ownerTabId,
      }).run();
    });

    this.mediaStore.ensurePersonDirectory(id);

    if (input.profilePhoto) {
      this.mediaStore.attachProfilePhoto(id, input.profilePhoto, input.profileThumbnail);
    }

    return loadPersonDetails(this.db, this.mediaStore, id)!;
  }

  updateRelationship(id: string, relationTypeRaw: string): Relationship {
    const relationType = relationTypeSchema.parse(relationTypeRaw);
    const result = this.db
      .update(relationships)
      .set({ relationType, updatedAt: now() })
      .where(eq(relationships.id, id))
      .run();

    if (!result.changes) {
      throw new Error("Relationship not found");
    }

    return this.db.select().from(relationships).where(eq(relationships.id, id)).get()!;
  }

  deleteRelationship(id: string): void {
    this.db.delete(relationships).where(eq(relationships.id, id)).run();
  }

  updateRelationPosition(
    viewPersonId: string,
    tabId: string,
    personId: string,
    x: number,
    y: number,
  ): RelationPosition {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error("Invalid graph position");
    }

    const clampedX = Math.max(0.04, Math.min(0.96, x));
    const clampedY = Math.max(0.06, Math.min(0.94, y));
    const relationTab = this.db
      .select({ id: personTabs.id })
      .from(personTabs)
      .where(and(
        eq(personTabs.id, tabId),
        eq(personTabs.personId, viewPersonId),
        eq(personTabs.kind, "relation"),
      ))
      .get();

    if (!relationTab) {
      throw new Error("Relation tab not found");
    }

    this.db
      .insert(relationPositions)
      .values({
        viewPersonId,
        tabId,
        personId,
        x: clampedX,
        y: clampedY,
      })
      .onConflictDoUpdate({
        target: [
          relationPositions.viewPersonId,
          relationPositions.tabId,
          relationPositions.personId,
        ],
        set: { x: clampedX, y: clampedY },
      })
      .run();

    return {
      viewPersonId,
      tabId,
      personId,
      x: clampedX,
      y: clampedY,
    };
  }
}
