import { and, eq, or, sql } from "drizzle-orm";
import type { SearchResult } from "../../shared/types.js";
import type { DossierDatabase } from "../persistence/database.js";
import {
  people,
  personTabs,
  textDocuments,
} from "../persistence/schema.js";

function textExcerpt(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export function searchPeople(
  db: DossierDatabase,
  query: string,
  caseId?: string,
): SearchResult[] {
  if (!query.trim()) {
    return [];
  }

  const pattern = `%${query.trim()}%`;
  const personConditions = [eq(people.status, "active")];
  const textConditions = [eq(people.status, "active")];

  if (caseId) {
    personConditions.push(eq(people.caseId, caseId));
    textConditions.push(eq(people.caseId, caseId));
  }

  const personResults = db
    .select({
      id: people.id,
      name: people.name,
      summary: people.summary,
    })
    .from(people)
    .where(and(
      ...personConditions,
      or(
        sql`${people.name} LIKE ${pattern} COLLATE NOCASE`,
        sql`${people.aliases} LIKE ${pattern} COLLATE NOCASE`,
        sql`${people.summary} LIKE ${pattern} COLLATE NOCASE`,
      ),
    ))
    .limit(20)
    .all();
  const textResults = db
    .select({
      personId: textDocuments.personId,
      personName: people.name,
      title: personTabs.name,
      body: textDocuments.body,
    })
    .from(textDocuments)
    .innerJoin(people, eq(people.id, textDocuments.personId))
    .innerJoin(personTabs, eq(personTabs.id, textDocuments.tabId))
    .where(and(
      ...textConditions,
      sql`${textDocuments.body} LIKE ${pattern} COLLATE NOCASE`,
    ))
    .limit(30)
    .all();

  return [
    ...personResults.map((person) => ({
      personId: person.id,
      personName: person.name,
      source: "person" as const,
      title: person.name,
      excerpt: person.summary,
    })),
    ...textResults.map((document) => ({
      personId: document.personId,
      personName: document.personName,
      source: "text" as const,
      title: document.title,
      excerpt: textExcerpt(document.body),
    })),
  ];
}
