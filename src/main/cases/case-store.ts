import { and, asc, count, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { caseInputSchema } from "../../shared/schemas.js";
import type { CaseInput, CaseSummary } from "../../shared/types.js";
import type { DossierDatabase } from "../persistence/database.js";
import { cases, people } from "../persistence/schema.js";

function now(): string {
  return new Date().toISOString();
}

export class CaseStore {
  constructor(private readonly db: DossierDatabase) {}

  listCases(): CaseSummary[] {
    return this.db
      .select({
        id: cases.id,
        title: cases.title,
        description: cases.description,
        targetCount: count(people.id),
        createdAt: cases.createdAt,
        updatedAt: cases.updatedAt,
      })
      .from(cases)
      .leftJoin(people, and(
        eq(people.caseId, cases.id),
        eq(people.status, "active"),
      ))
      .groupBy(cases.id)
      .orderBy(asc(cases.createdAt), asc(cases.title))
      .all();
  }

  createCase(raw: CaseInput): CaseSummary {
    const input = caseInputSchema.parse(raw);
    const id = randomUUID();
    const createdAt = now();

    this.db.insert(cases).values({
      id,
      title: input.title,
      description: input.description,
      createdAt,
      updatedAt: createdAt,
    }).run();

    return {
      id,
      title: input.title,
      description: input.description,
      targetCount: 0,
      createdAt,
      updatedAt: createdAt,
    };
  }
}
