const allowedTags = new Set(['P','BR','STRONG','B','EM','I','U','S','H2','H3','BLOCKQUOTE','UL','OL','LI','A','CODE','PRE']);
const blockedTags = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','FORM','INPUT','BUTTON']);

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]!));

export function normalizeRichText(value: string): string {
  if (!value.trim()) return '';
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(value);
  if (!looksLikeHtml) return value.split(/\n{2,}/).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`).join('');
  return sanitizeRichText(value);
}

export function sanitizeRichText(value: string): string {
  const documentValue = new DOMParser().parseFromString(`<div>${value}</div>`, 'text/html');
  const root = documentValue.body.firstElementChild!;
  const clean = (node: Node) => {
    if (!(node instanceof Element)) return;
    if (blockedTags.has(node.tagName)) { node.remove(); return; }
    for (const child of Array.from(node.childNodes)) clean(child);
    if (!allowedTags.has(node.tagName) && node !== root) { node.replaceWith(...Array.from(node.childNodes)); return; }
    const linkHref = node.tagName === 'A' ? node.getAttribute('href') : null;
    for (const attribute of Array.from(node.attributes)) node.removeAttribute(attribute.name);
    if (node.tagName === 'A') {
      if (linkHref && /^https?:\/\//i.test(linkHref)) {
        node.setAttribute('href', linkHref);
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noreferrer noopener');
      }
    }
  };
  clean(root);
  return root.innerHTML;
}

export function richTextPlainText(value: string): string {
  const spacedHtml = normalizeRichText(value).replace(/<br\s*\/?>|<\/(?:p|h2|h3|blockquote|li|pre)>/gi, ' ');
  const documentValue = new DOMParser().parseFromString(spacedHtml, 'text/html');
  return (documentValue.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function sanitizeInlineRichText(value: string): string {
  const documentValue = new DOMParser().parseFromString(`<div>${value}</div>`, 'text/html');
  const root = documentValue.body.firstElementChild!;
  const inlineTags = new Set(['BR','STRONG','B','EM','I','U','S','A','SPAN']);
  const clean = (node: Node) => {
    if (!(node instanceof Element)) return;
    if (blockedTags.has(node.tagName)) { node.remove(); return; }
    for (const child of Array.from(node.childNodes)) clean(child);
    if (node.tagName === 'FONT') {
      const color = node.getAttribute('color') ?? '';
      const span = documentValue.createElement('span');
      span.append(...Array.from(node.childNodes));
      if (/^(#[0-9a-f]{3,8}|rgba?\([\d\s,.%]+\)|[a-z]+)$/i.test(color)) span.style.color = color;
      node.replaceWith(span);
      return;
    }
    if (!inlineTags.has(node.tagName) && node !== root) { node.replaceWith(...Array.from(node.childNodes)); return; }
    const linkHref = node.tagName === 'A' ? node.getAttribute('href') : null;
    const color = node.tagName === 'SPAN' ? (node as HTMLElement).style.color : '';
    for (const attribute of Array.from(node.attributes)) node.removeAttribute(attribute.name);
    if (node.tagName === 'A' && linkHref && /^https?:\/\//i.test(linkHref)) {
      node.setAttribute('href', linkHref); node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noreferrer noopener');
    }
    if (node.tagName === 'SPAN' && /^(#[0-9a-f]{3,8}|rgba?\([\d\s,.%]+\)|[a-z]+)$/i.test(color)) (node as HTMLElement).style.color = color;
  };
  clean(root);
  return root.innerHTML;
}
