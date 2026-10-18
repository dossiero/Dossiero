import { useEffect } from "react";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { Bold, Italic, Link, Underline } from "lucide-react";
import { sanitizeInlineRichText } from "@/lib/rich-text";
import "./inline-editor.css";

interface InlineEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function InlineEditor({ value, onChange }: InlineEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          autolink: true,
          openOnClick: false,
        },
      }),
      TextStyle,
      Color,
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "inline-editor-surface",
        "data-placeholder": "Optional description…",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(sanitizeInlineRichText(currentEditor.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor || sanitizeInlineRichText(editor.getHTML()) === value) return;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  const addLink = () => {
    if (!editor) return;
    const currentHref = String(editor.getAttributes("link").href ?? "");
    const rawUrl = window.prompt("Link URL", currentHref);
    if (rawUrl === null) return;
    if (!rawUrl.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const candidate = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    try {
      const url = new URL(candidate);
      if (!["http:", "https:"].includes(url.protocol)) return;
      editor.chain().focus().extendMarkRange("link").setLink({ href: url.toString() }).run();
    } catch {
      return;
    }
  };

  if (!editor) return null;
  return (
    <div className="inline-editor">
      <div className="inline-editor-tools">
        <button
          type="button"
          className={editor.isActive("bold") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold size={13} />
        </button>
        <button
          type="button"
          className={editor.isActive("italic") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <Italic size={13} />
        </button>
        <button
          type="button"
          className={editor.isActive("underline") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Underline"
        >
          <Underline size={13} />
        </button>
        <button
          type="button"
          className={editor.isActive("link") ? "is-active" : ""}
          onClick={addLink}
          aria-label="Link"
        >
          <Link size={13} />
        </button>
        <input
          type="color"
          aria-label="Text color"
          value={String(editor.getAttributes("textStyle").color ?? "#ffffff")}
          onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
