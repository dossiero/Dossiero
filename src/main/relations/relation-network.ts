import { and, asc, eq } from "drizzle-orm";
import type {
  Person,
  RelationPosition,
  Relationship,
} from "../../shared/types.js";
import type { DossierDatabase } from "../persistence/database.js";
import {
  people,
  personTabs,
  relationships as relationshipTable,
  relationPositions as relationPositionTable,
} from "../persistence/schema.js";

export interface RelationNetwork {
  relationships: Relationship[];
  relatedPeople: Person[];
  relationPositions: RelationPosition[];
}

export function loadRelationNetwork(
  db: DossierDatabase,
  personId: string,
): RelationNetwork {
  const rootTabs = db
    .select()
    .from(personTabs)
    .where(and(
      eq(personTabs.personId, personId),
      eq(personTabs.kind, "relation"),
    ))
    .orderBy(asc(personTabs.position))
    .all();
  const allRelationships = db
    .select()
    .from(relationshipTable)
    .orderBy(asc(relationshipTable.createdAt))
    .all();
  const activePeople = new Map(
    db
      .select()
      .from(people)
      .where(eq(people.status, "active"))
      .all()
      .map((person) => [person.id, person]),
  );
  const activeIds = new Set(activePeople.keys());
  const tabOwners = new Map(
    db
      .select({ id: personTabs.id, personId: personTabs.personId })
      .from(personTabs)
      .where(eq(personTabs.kind, "relation"))
      .all()
      .map((tab) => [tab.id, tab.personId]),
  );
  const relationships: Relationship[] = [];

  for (const [tabIndex, rootTab] of rootTabs.entries()) {
    const reachable = new Set([personId]);
    const included = new Set<string>();
    let changed = true;

    while (changed) {
      changed = false;

      for (const relationship of allRelationships) {
        if (
          included.has(relationship.id) ||
          !reachable.has(relationship.ownerPersonId) ||
          !activeIds.has(relationship.relatedPersonId)
        ) {
          continue;
        }

        if (relationship.ownerPersonId === personId) {
          const legacyMisplaced = tabOwners.get(relationship.tabId) !== personId;

          if (relationship.tabId !== rootTab.id && !(legacyMisplaced && tabIndex === 0)) {
            continue;
          }
        }

        included.add(relationship.id);
        relationships.push({ ...relationship, tabId: rootTab.id });

        if (!reachable.has(relationship.relatedPersonId)) {
          reachable.add(relationship.relatedPersonId);
          changed = true;
        }
      }
    }
  }

  const ids = [...new Set(relationships.map((relationship) => relationship.relatedPersonId))];
  const relatedPeople = ids
    .map((id) => activePeople.get(id))
    .filter((person): person is Person => Boolean(person));
  const visibleIds = new Set(ids);
  const relationPositions = db
    .select({
      viewPersonId: relationPositionTable.viewPersonId,
      tabId: relationPositionTable.tabId,
      personId: relationPositionTable.personId,
      x: relationPositionTable.x,
      y: relationPositionTable.y,
    })
    .from(relationPositionTable)
    .innerJoin(personTabs, eq(personTabs.id, relationPositionTable.tabId))
    .where(and(
      eq(relationPositionTable.viewPersonId, personId),
      eq(personTabs.personId, personId),
    ))
    .all()
    .filter((position) => visibleIds.has(position.personId));

  return {
    relationships,
    relatedPeople,
    relationPositions,
  };
}
