export function shortId(identifier: string): string {
  return identifier.replaceAll("-", "").slice(0, 8).toUpperCase();
}
