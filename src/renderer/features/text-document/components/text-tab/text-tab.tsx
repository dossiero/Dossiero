import { lazy, Suspense, useMemo } from "react";
import { ProfileContent } from "@/components/profile-content/profile-content";
import { ProfileContentBody } from "@/components/profile-content-body/profile-content-body";
import { ProfileContentHeader } from "@/components/profile-content-header/profile-content-header";
import "./text-tab.css";
import type { TextTabProps, TextDocumentSaveStatus } from "./text-tab.types";
import { useTextDocumentDraft } from "./use-text-document-draft";

const TextDocumentEditor = lazy(async () => {
  const module = await import(
    "@/features/text-document/components/text-document-editor/text-document-editor"
  );

  return { default: module.TextDocumentEditor };
});

const saveStatusLabels: Record<Exclude<TextDocumentSaveStatus, "saved">, string> = {
  dirty: "Unsaved changes",
  saving: "Saving…",
  error: "Save failed",
};

export function TextTab({ tab, document, onSave }: TextTabProps) {
  const initialContent = useMemo(
    () => document?.content ?? { blocks: [] },
    [document?.content],
  );
  const {
    content,
    saveStatus,
    updateContent,
  } = useTextDocumentDraft({
    documentId: tab.id,
    initialContent,
    onSave,
  });

  const saveState = saveStatus === "saved"
    ? undefined
    : (
      <span className={`document-save-state is-${saveStatus}`}>
        {saveStatusLabels[saveStatus]}
      </span>
    );

  return (
    <ProfileContent className="text-document-page">
      <ProfileContentHeader
        eyebrow="TEXT DOCUMENT"
        title={tab.name}
        actions={saveState}
      />
      <ProfileContentBody>
        <Suspense fallback={<div className="text-block-editor-loading">Loading editor…</div>}>
          <TextDocumentEditor
            key={tab.id}
            documentId={tab.id}
            personId={tab.personId}
            value={content}
            onChange={updateContent}
          />
        </Suspense>
      </ProfileContentBody>
    </ProfileContent>
  );
}
