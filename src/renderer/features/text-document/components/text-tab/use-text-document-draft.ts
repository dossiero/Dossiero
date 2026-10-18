import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { EditorDocumentData } from "@shared/types";
import type { TextDocumentSaveStatus } from "./text-tab.types";

const DOCUMENT_SAVE_DELAY_MS = 650;

interface UseTextDocumentDraftInput {
  documentId: string;
  initialContent: EditorDocumentData;
  onSave: (content: EditorDocumentData) => Promise<void>;
}

interface TextDocumentDraft {
  content: EditorDocumentData;
  saveStatus: TextDocumentSaveStatus;
  updateContent: (content: EditorDocumentData) => void;
}

export function useTextDocumentDraft({
  documentId,
  initialContent,
  onSave,
}: UseTextDocumentDraftInput): TextDocumentDraft {
  const [content, setContent] = useState<EditorDocumentData>(initialContent);
  const [saveStatus, setSaveStatus] = useState<TextDocumentSaveStatus>("saved");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContent = useRef(initialContent);
  const savedContent = useRef(initialContent);
  const saveVersion = useRef(0);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    setContent(initialContent);
    latestContent.current = initialContent;
    savedContent.current = initialContent;
    setSaveStatus("saved");
  }, [documentId, initialContent]);

  const save = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    const version = saveVersion.current;
    const nextContent = latestContent.current;
    setSaveStatus("saving");

    const operation = saveQueue.current
      .catch(() => undefined)
      .then(() => onSaveRef.current(nextContent));
    saveQueue.current = operation;

    try {
      await operation;
      savedContent.current = nextContent;
      if (version === saveVersion.current) {
        setSaveStatus("saved");
      }
    } catch {
      if (version === saveVersion.current) {
        setSaveStatus("error");
      }
    }
  }, []);

  useEffect(() => () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    if (latestContent.current !== savedContent.current) {
      saveQueue.current = saveQueue.current
        .catch(() => undefined)
        .then(() => onSaveRef.current(latestContent.current));
    }
  }, []);

  const updateContent = (nextContent: EditorDocumentData) => {
    setContent(nextContent);
    latestContent.current = nextContent;
    saveVersion.current += 1;
    setSaveStatus("dirty");

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(() => {
      void save();
    }, DOCUMENT_SAVE_DELAY_MS);
  };

  return {
    content,
    saveStatus,
    updateContent,
  };
}
