import AttachesTool from "@editorjs/attaches";
import Delimiter from "@editorjs/delimiter";
import Embed from "@editorjs/embed";
import EditorJS, {
  type BlockToolConstructable,
  type InlineToolConstructable,
  type OutputData,
  type ToolboxConfigEntry,
} from "@editorjs/editorjs";
import Header from "@editorjs/header";
import InlineCode from "@editorjs/inline-code";
import EditorjsList from "@editorjs/list";
import Marker from "@editorjs/marker";
import Quote from "@editorjs/quote";
import Table from "@editorjs/table";
import ColorPicker from "editorjs-color-picker";
import { useEffect, useRef } from "react";
import type { EditorDocumentData } from "@shared/types";
import { useDossierApi } from "@/api/use-dossier-api";
import { dossierColors } from "@/lib/color-palette";
import { ResizableImageTool } from "./resizable-image-tool";
import "./text-document-editor.css";
import "./text-document-media.css";

interface TextDocumentEditorProps {
  documentId: string;
  personId: string;
  value: EditorDocumentData;
  onChange: (value: EditorDocumentData) => void;
}

interface UploadedEditorFile {
  extension: string;
  id: string;
  name: string;
  size: number;
  title: string;
  url: string;
}

function fileExtension(name: string): string {
  const extension = name.split(".").pop();

  return extension && extension !== name ? extension : "file";
}

function withAttachmentTitles(value: EditorDocumentData): EditorDocumentData {
  return {
    ...value,
    blocks: value.blocks.map((block) => {
      if (
        block.type !== "attaches"
        || (typeof block.data.title === "string" && block.data.title.trim())
      ) {
        return block;
      }

      const file = block.data.file;
      if (!file || typeof file !== "object" || !("name" in file)) {
        return block;
      }

      const fileName = file.name;
      if (typeof fileName !== "string" || !fileName) {
        return block;
      }

      return {
        ...block,
        data: {
          ...block.data,
          title: fileName,
        },
      };
    }),
  };
}

function normalizeEditorOutput(output: OutputData): EditorDocumentData {
  return {
    ...output,
    blocks: output.blocks.map((block) => ({
      ...block,
      type: block.type === "checklist" ? "list" : block.type,
    })),
  };
}

export function TextDocumentEditor({
  documentId,
  personId,
  value,
  onChange,
}: TextDocumentEditorProps) {
  const api = useDossierApi();
  const holder = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorJS | null>(null);
  const onChangeRef = useRef(onChange);
  const changeVersion = useRef(0);
  const lastSignature = useRef(JSON.stringify(value.blocks));

  onChangeRef.current = onChange;

  useEffect(() => {
    const holderElement = holder.current;

    if (!holderElement) {
      return;
    }

    let cancelled = false;
    const editorHolder = window.document.createElement("div");
    holderElement.replaceChildren(editorHolder);
    const uploadFile = async (file: File): Promise<{ success: 1; file: UploadedEditorFile }> => {
      const [item] = await api.uploadMedia(personId, documentId, [{
        name: file.name,
        type: file.type,
        size: file.size,
        bytes: new Uint8Array(await file.arrayBuffer()),
      }]);

      if (!item) {
        throw new Error("File upload did not return a media item");
      }

      return {
        success: 1,
        file: {
          extension: fileExtension(item.originalName),
          id: item.id,
          name: item.originalName,
          size: item.size,
          title: item.originalName,
          url: api.mediaUrl(item),
        },
      };
    };
    const emitChange = async (save: () => Promise<OutputData>) => {
      const version = ++changeVersion.current;
      const output = normalizeEditorOutput(await save());
      const signature = JSON.stringify(output.blocks);

      if (
        !cancelled
        && version === changeVersion.current
        && signature !== lastSignature.current
      ) {
        lastSignature.current = signature;
        onChangeRef.current(output as EditorDocumentData);
      }
    };
    const editor = new EditorJS({
      holder: editorHolder,
      data: withAttachmentTitles(value) as OutputData,
      minHeight: 0,
      placeholder: "Write something, or use + to add a block",
      inlineToolbar: ["bold", "italic", "link", "color", "marker", "inlineCode"],
      tools: {
        header: {
          class: Header,
          inlineToolbar: true,
          shortcut: "CMD+SHIFT+H",
          config: {
            levels: [1, 2, 3, 4],
            defaultLevel: 2,
          },
        },
        list: {
          class: EditorjsList,
          inlineToolbar: true,
          toolbox: (EditorjsList.toolbox as ToolboxConfigEntry[]).slice(0, 2),
          config: {
            defaultStyle: "unordered",
          },
        },
        delimiter: Delimiter,
        image: {
          class: ResizableImageTool,
          config: {
            features: {
              background: false,
              border: false,
              caption: false,
              stretch: false,
            },
            uploader: {
              uploadByFile: uploadFile,
            },
          },
        },
        attaches: {
          class: AttachesTool as unknown as BlockToolConstructable,
          config: {
            buttonText: "Select file",
            uploader: {
              uploadByFile: uploadFile,
            },
          },
        },
        checklist: {
          class: EditorjsList,
          inlineToolbar: true,
          toolbox: (EditorjsList.toolbox as ToolboxConfigEntry[])[2],
          config: {
            defaultStyle: "checklist",
          },
        },
        quote: {
          class: Quote,
          inlineToolbar: true,
          toolbox: false,
          config: {
            quotePlaceholder: "Quote",
            captionPlaceholder: "Attribution",
          },
        },
        embed: {
          class: Embed as unknown as BlockToolConstructable,
          config: {
            services: {
              youtube: true,
              vimeo: true,
            },
          },
        },
        table: {
          class: Table as unknown as BlockToolConstructable,
          inlineToolbar: true,
          toolbox: false,
          config: {
            rows: 2,
            cols: 3,
            maxRows: 20,
            maxCols: 10,
          },
        },
        marker: {
          class: Marker,
          shortcut: "CMD+SHIFT+M",
        },
        inlineCode: {
          class: InlineCode,
          shortcut: "CMD+SHIFT+K",
        },
        color: {
          class: ColorPicker as unknown as InlineToolConstructable,
          config: {
            colors: dossierColors,
            columns: 8,
          },
        },
      },
      onChange: (api) => emitChange(() => api.saver.save()),
    });
    const handleInput = () => void emitChange(() => editor.save());
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link) {
        return;
      }

      if (link.href.startsWith("dossier-media://")) {
        event.preventDefault();
        const mediaId = new URL(link.href).hostname;

        if (mediaId) {
          void api.exportMedia(mediaId);
        }
        return;
      }

      if (!/^https?:\/\//i.test(link.href)) {
        return;
      }

      event.preventDefault();
      window.open(link.href, "_blank", "noopener,noreferrer");
    };

    editorRef.current = editor;
    editorHolder.addEventListener("click", handleLinkClick);
    void editor.isReady
      .then(() => editorHolder.addEventListener("input", handleInput))
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error("Failed to initialize the text document editor", error);
        }
      });

    return () => {
      cancelled = true;
      changeVersion.current += 1;
      editorHolder.removeEventListener("input", handleInput);
      editorHolder.removeEventListener("click", handleLinkClick);
      if (editorRef.current === editor) {
        editorRef.current = null;
      }
      void editor.isReady
        .then(() => editor.destroy())
        .catch(() => undefined);
    };
  }, [api, documentId, personId]);

  return <div ref={holder} className="text-block-editor" />;
}
