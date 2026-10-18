import type { OutputBlockData, OutputData } from "@editorjs/editorjs";
import editorJsHtml from "editorjs-html";
import sanitizeHtml from "sanitize-html";
import type { EditorDocumentData } from "../../shared/types.js";

type UnknownRecord = Record<string, unknown>;
type Parser = {
  parse: (content: OutputData) => string;
};
type ParserFactory = (
  plugins: Record<string, (block: OutputBlockData) => string>,
  options: { strict: boolean },
) => Parser;

function recordValue(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : {};
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

function fileData(block: OutputBlockData): UnknownRecord {
  const data = recordValue(block.data);

  return recordValue(data.file);
}

function renderAttachment(block: OutputBlockData): string {
  const data = recordValue(block.data);
  const file = fileData(block);
  const url = escapeHtml(stringValue(file.url));
  const title = stringValue(data.title) || escapeHtml(stringValue(file.name)) || "Attachment";

  return url ? `<p><a href="${url}">${title}</a></p>` : `<p>${title}</p>`;
}

function renderEmbed(block: OutputBlockData): string {
  const data = recordValue(block.data);
  const source = escapeHtml(stringValue(data.source));
  const caption = stringValue(data.caption);
  const label = caption || source || "Embedded content";

  return source ? `<p><a href="${source}">${label}</a></p>` : `<p>${label}</p>`;
}

function renderImage(block: OutputBlockData): string {
  const data = recordValue(block.data);
  const file = fileData(block);
  const url = escapeHtml(stringValue(file.url));
  const caption = stringValue(data.caption);
  const image = url ? `<img src="${url}" alt="">` : "";
  const renderedCaption = caption ? `<figcaption>${caption}</figcaption>` : "";

  return `<figure>${image}${renderedCaption}</figure>`;
}

function renderListItems(
  items: unknown,
  style: "checklist" | "ordered" | "unordered",
): string {
  if (!Array.isArray(items)) {
    return "";
  }

  return items.map((item) => {
    if (typeof item === "string") {
      if (style === "checklist") {
        return `<li><input type="checkbox" disabled> ${item}</li>`;
      }

      return `<li>${item}</li>`;
    }

    const itemRecord = recordValue(item);
    const content = stringValue(itemRecord.content);
    const tag = style === "ordered" ? "ol" : "ul";
    const children = Array.isArray(itemRecord.items) && itemRecord.items.length
      ? `<${tag}>${renderListItems(itemRecord.items, style)}</${tag}>`
      : "";

    if (style === "checklist") {
      const meta = recordValue(itemRecord.meta);
      const checked = meta.checked === true ? " checked" : "";

      return `<li><input type="checkbox" disabled${checked}> ${content}${children}</li>`;
    }

    return `<li>${content}${children}</li>`;
  }).join("");
}

function renderList(block: OutputBlockData): string {
  const data = recordValue(block.data);
  const style = data.style === "ordered" || data.style === "checklist"
    ? data.style
    : "unordered";
  const tag = style === "ordered" ? "ol" : "ul";
  const className = style === "checklist" ? ' class="editor-checklist"' : "";

  return `<${tag}${className}>${renderListItems(data.items, style)}</${tag}>`;
}

function renderParagraph(block: OutputBlockData): string {
  const data = recordValue(block.data);

  return `<p>${stringValue(data.text)}</p>`;
}

function renderHeader(block: OutputBlockData): string {
  const data = recordValue(block.data);
  const level = typeof data.level === "number" && [1, 2, 3, 4].includes(data.level)
    ? data.level
    : 2;

  return `<h${level}>${stringValue(data.text)}</h${level}>`;
}

function renderChecklist(block: OutputBlockData): string {
  const data = recordValue(block.data);
  const items = Array.isArray(data.items) ? data.items : [];
  const renderedItems = items.map((item) => {
    const itemRecord = recordValue(item);
    const checked = itemRecord.checked === true ? " checked" : "";
    const text = stringValue(itemRecord.text);

    return `<li><input type="checkbox" disabled${checked}> ${text}</li>`;
  }).join("");

  return `<ul class="editor-checklist">${renderedItems}</ul>`;
}

function renderQuote(block: OutputBlockData): string {
  const data = recordValue(block.data);
  const text = stringValue(data.text);
  const caption = stringValue(data.caption);
  const attribution = caption ? `<cite>${caption}</cite>` : "";

  return `<blockquote>${text}${attribution}</blockquote>`;
}

function renderCode(block: OutputBlockData): string {
  const data = recordValue(block.data);

  return `<pre><code>${escapeHtml(stringValue(data.code))}</code></pre>`;
}

function renderTable(block: OutputBlockData): string {
  const data = recordValue(block.data);
  const rows = Array.isArray(data.content) ? data.content : [];
  const withHeadings = data.withHeadings === true;
  const renderedRows = rows.map((row, rowIndex) => {
    if (!Array.isArray(row)) {
      return "";
    }

    const cellTag = withHeadings && rowIndex === 0 ? "th" : "td";
    const cells = row
      .map((cell) => `<${cellTag}>${stringValue(cell)}</${cellTag}>`)
      .join("");

    return `<tr>${cells}</tr>`;
  }).join("");

  return `<table><tbody>${renderedRows}</tbody></table>`;
}

const createParser = editorJsHtml as unknown as ParserFactory;
const parser = createParser({
  attaches: renderAttachment,
  checklist: renderChecklist,
  code: renderCode,
  delimiter: () => "<hr>",
  embed: renderEmbed,
  header: renderHeader,
  image: renderImage,
  list: renderList,
  paragraph: renderParagraph,
  quote: renderQuote,
  table: renderTable,
}, { strict: true });

export function renderEditorDocumentHtml(content: EditorDocumentData): string {
  const html = parser.parse(content as OutputData);

  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "a",
      "mark",
      "span",
      "code",
      "pre",
      "h1",
      "h2",
      "h3",
      "h4",
      "blockquote",
      "cite",
      "ul",
      "ol",
      "li",
      "input",
      "hr",
      "table",
      "tbody",
      "tr",
      "th",
      "td",
      "figure",
      "figcaption",
      "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
      input: ["type", "checked", "disabled"],
      span: ["class", "style"],
      ul: ["class"],
    },
    allowedClasses: {
      span: ["cdx-text-color"],
      ul: ["editor-checklist"],
    },
    allowedSchemes: ["http", "https", "mailto", "dossier-media", "blob"],
    allowedStyles: {
      span: {
        color: [
          /^#[0-9a-f]{6}$/i,
          /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i,
        ],
      },
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noreferrer noopener",
      }),
    },
  });
}
