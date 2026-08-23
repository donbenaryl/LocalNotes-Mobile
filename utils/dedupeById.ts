/**
 * Keep first occurrence of each `id` (stable feed order across infinite pages).
 * Offset/rank APIs often re-emit items on later pages; duplicate React keys then
 * thrash layout (e.g. embedded PagerView height) and break scroll-to-top.
 */
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  if (items.length <= 1) return items;

  const seen = new Set<string>();
  const unique: T[] = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }

  return unique.length === items.length ? items : unique;
}
