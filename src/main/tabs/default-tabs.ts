import { randomUUID } from "node:crypto";
import type { DossierTransaction } from "../persistence/database.js";
import {
  personTabs,
  textDocuments,
} from "../persistence/schema.js";

export function insertDefaultTabs(
  transaction: DossierTransaction,
  personId: string,
  createdAt: string,
): void {
  const infoTabId = randomUUID();

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
      id: randomUUID(),
      personId,
      name: "Media",
      kind: "media",
      icon: "images",
      position: 1,
      isDefault: true,
      createdAt,
    },
    {
      id: randomUUID(),
      personId,
      name: "Links",
      kind: "links",
      icon: "link",
      position: 2,
      isDefault: true,
      createdAt,
    },
    {
      id: randomUUID(),
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
    content: { blocks: [] },
    body: "",
    updatedAt: createdAt,
  }).run();
}
