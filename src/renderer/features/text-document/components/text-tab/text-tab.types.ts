import type {
  EditorDocumentData,
  PersonTab,
  TextDocument,
} from "@shared/types";

export interface TextTabProps {
  tab: PersonTab;
  document?: TextDocument;
  onSave: (content: EditorDocumentData) => Promise<void>;
}

export type TextDocumentSaveStatus = "saved" | "dirty" | "saving" | "error";
