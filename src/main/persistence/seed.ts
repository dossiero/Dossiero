import { asc, count } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { DossierDatabase } from "./database.js";
import {
  cases,
  links,
  people,
  personTabs,
  settings,
  textDocuments,
} from "./schema.js";

const seedSettings = {
  appearance: "dark",
  seedDismissed: false,
  showMenuBarIcon: false,
  showRelatedPeopleInSidebar: false,
  startAtLogin: false,
  theme: "terminal",
  externalBrowser: { kind: "system" },
} as const;

export function seedDatabase(db: DossierDatabase): void {
  const result = db.select({ count: count() }).from(people).get();

  if ((result?.count ?? 0) > 0) {
    return;
  }

  const createdAt = "2026-09-18T21:14:00.000Z";
  const updatedAt = "2026-09-28T07:42:00.000Z";
  const personId = "a1b2c3d4-e5f6-47a8-9012-3456789abcde";
  const infoTabId = "11111111-1111-4111-8111-111111111111";
  const generalCase = db
    .select({ id: cases.id })
    .from(cases)
    .orderBy(asc(cases.createdAt), asc(cases.id))
    .get();

  if (!generalCase) {
    throw new Error("Initial case is missing");
  }

  db.transaction((transaction) => {
    transaction.insert(people).values({
      id: personId,
      caseId: generalCase.id,
      name: "Mara Voss",
      aliases: ["M. Voss", "Kestrel"],
      birthDate: "1991-04-17",
      summary: "Independent systems researcher. Last verified contact originated in Lisbon.",
      status: "active",
      type: "default",
      pinned: false,
      createdAt,
      updatedAt,
    }).run();
    transaction.insert(personTabs).values([
      {
        id: infoTabId,
        personId,
        name: "Info",
        kind: "text",
        icon: "file-text",
        position: 0,
        isDefault: true,
        createdAt,
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        personId,
        name: "Media",
        kind: "media",
        icon: "images",
        position: 1,
        isDefault: true,
        createdAt,
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        personId,
        name: "Links",
        kind: "links",
        icon: "link",
        position: 2,
        isDefault: true,
        createdAt,
      },
      {
        id: "44444444-4444-4444-8444-444444444444",
        personId,
        name: "Relation",
        kind: "relation",
        icon: "user",
        position: 3,
        isDefault: true,
        createdAt,
      },
    ]).run();
    transaction.insert(textDocuments).values({
      tabId: infoTabId,
      personId,
      content: {
        blocks: [
          {
            type: "header",
            data: { text: "Operational note", level: 2 },
          },
          {
            type: "paragraph",
            data: {
              text: "Prefers asynchronous contact. Known to travel with minimal notice. "
                + "Verify all location reports before treating them as current.",
            },
          },
          {
            type: "header",
            data: { text: "Address / location", level: 2 },
          },
          {
            type: "paragraph",
            data: {
              text: "Last confirmed: Arroios, Lisbon. Previous: Kreuzberg, Berlin.",
            },
          },
        ],
      },
      body: [
        "<h2>Operational note</h2>",
        "<p>Prefers asynchronous contact. Known to travel with minimal notice. ",
        "Verify all location reports before treating them as current.</p>",
        "<h2>Address / location</h2>",
        "<p>Last confirmed: Arroios, Lisbon. Previous: Kreuzberg, Berlin.</p>",
      ].join(""),
      updatedAt: "2026-09-27T18:22:00.000Z",
    }).run();
    transaction.insert(links).values({
      id: randomUUID(),
      personId,
      tabId: "33333333-3333-4333-8333-333333333333",
      label: "Research archive",
      url: "https://example.com/archive",
      notes: "Public index; identity not independently verified.",
      syncStatus: "unsupported",
      syncMetadata: null,
      createdAt,
      updatedAt: createdAt,
    }).run();
    transaction.insert(settings).values(
      Object.entries(seedSettings).map(([key, value]) => ({ key, value })),
    ).run();
  });
}
