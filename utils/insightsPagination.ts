export interface KeywordPageLike<T> {
  chips: T[];
  page: number;
  page_size: number;
  total: number;
}

/**
 * Appends pages in order, dropping items whose key was already seen (a refetch between
 * pages can shift boundaries). Undefined/empty pages are skipped.
 */
export function mergePages<T>(
  pages: (readonly T[] | null | undefined)[],
  getKey: (item: T) => string,
): T[] {
  const seen = new Set<string>();
  const merged: T[] = [];
  for (const page of pages) {
    if (!page) continue;
    for (const item of page) {
      const key = getKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

/** Next page number to request, or undefined when everything is loaded. */
export function nextKeywordPage<T>(
  last: KeywordPageLike<T> | null | undefined,
  loadedCount: number,
): number | undefined {
  if (!last || last.chips.length === 0) return undefined;
  return loadedCount < last.total ? last.page + 1 : undefined;
}
