export function getWebsiteName(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, '') || 'Website';
  } catch {
    return 'Website';
  }
}

export function getLinkTitle(label: string, url: string): string {
  return label.trim() || getWebsiteName(url);
}
