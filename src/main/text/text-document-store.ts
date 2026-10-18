import { and, eq } from "drizzle-orm";
import { textInputSchema } from "../../shared/schemas.js";
import type { EditorDocumentData, TextDocument } from "../../shared/types.js";
import type { DossierDatabase } from "../persistence/database.js";
import {
  people,
  personTabs,
  textDocuments,
} from "../persistence/schema.js";
import { renderEditorDocumentHtml } from "./editor-document-html.js";

export class TextDocumentStore {
  constructor(private readonly db: DossierDatabase) {}

  saveTextDocument(raw: {
    personId: string;
    tabId: string;
    content: EditorDocumentData;
  }): TextDocument {
    const input = textInputSchema.parse(raw);
    const updatedAt = new Date().toISOString();
    const body = renderEditorDocumentHtml(input.content);
    const tab = this.db
      .select({ id: personTabs.id })
      .from(personTabs)
      .where(and(
        eq(personTabs.id, input.tabId),
        eq(personTabs.personId, input.personId),
        eq(personTabs.kind, "text"),
      ))
      .get();

    if (!tab) {
      throw new Error("Text tab not found");
    }

    this.db.transaction((transaction) => {
      transaction
        .insert(textDocuments)
        .values({
          tabId: input.tabId,
          personId: input.personId,
          content: input.content,
          body,
          updatedAt,
        })
        .onConflictDoUpdate({
          target: textDocuments.tabId,
          set: {
            content: input.content,
            body,
            updatedAt,
          },
        })
        .run();
      transaction
        .update(people)
        .set({ updatedAt })
        .where(eq(people.id, input.personId))
        .run();
    });

    return this.db
      .select()
      .from(textDocuments)
      .where(eq(textDocuments.tabId, input.tabId))
      .get()!;
  }
}
