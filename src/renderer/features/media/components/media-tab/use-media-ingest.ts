import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import type { UploadFile } from "@shared/types";

const DEFAULT_IMPORT_NAME = "imported-file";
const PASTED_IMAGE_NAME = "pasted-image";
const UNKNOWN_FILE_EXTENSION = "bin";

interface UseMediaIngestInput {
  onFiles: (files: UploadFile[]) => void;
}

function targetIsEditable(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
  ));
}

function uploadFileName(file: File, index: number, fallbackName: string): string {
  if (file.name) {
    return file.name;
  }

  const extension = file.type
    .split("/")[1]
    ?.split("+")[0]
    ?.replace(/[^a-zA-Z0-9]/g, "") || UNKNOWN_FILE_EXTENSION;

  return `${fallbackName}-${Date.now()}-${index + 1}.${extension}`;
}

function eventHasFiles(event: DragEvent): boolean {
  return event.dataTransfer.types.includes("Files");
}

export function useMediaIngest({ onFiles }: UseMediaIngestInput) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const ingestFiles = useCallback(async (
    fileList: FileList | File[],
    fallbackName = DEFAULT_IMPORT_NAME,
  ) => {
    const files = await Promise.all(Array.from(fileList).map(async (file, index) => ({
      name: uploadFileName(file, index, fallbackName),
      type: file.type,
      size: file.size,
      bytes: new Uint8Array(await file.arrayBuffer()),
    })));

    onFiles(files);
  }, [onFiles]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (targetIsEditable(event.target) || targetIsEditable(document.activeElement)) {
        return;
      }

      const itemImages = Array.from(event.clipboardData?.items ?? [])
        .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file));
      const clipboardFiles = Array.from(event.clipboardData?.files ?? []);
      const fileImages = clipboardFiles.filter((file) => file.type.startsWith("image/"));
      const images = itemImages.length > 0 ? itemImages : fileImages;

      if (images.length === 0) {
        return;
      }

      event.preventDefault();
      void ingestFiles(images, PASTED_IMAGE_NAME);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [ingestFiles]);

  const handleDragEnter = (event: DragEvent) => {
    if (!eventHasFiles(event)) {
      return;
    }

    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent) => {
    if (!eventHasFiles(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent) => {
    if (!eventHasFiles(event)) {
      return;
    }

    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length > 0) {
      void ingestFiles(event.dataTransfer.files);
    }
  };

  return {
    fileInputRef,
    isDragging,
    ingestFiles,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
