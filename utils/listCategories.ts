import type { ListFormCategory } from "@/types/listForm";

export const OTHERS_CATEGORY_NAME = "Others";

export function hasOthersCategory(categories: ListFormCategory[]): boolean {
  return categories.some(
    (c) => c.name.trim().toLowerCase() === OTHERS_CATEGORY_NAME.toLowerCase(),
  );
}

/** True when a category *name* (not object) is the "Others" category — used for display badges. */
export function isOthersCategoryName(name: string): boolean {
  return name.trim().toLowerCase() === OTHERS_CATEGORY_NAME.toLowerCase();
}

interface CategorizedItem {
  categories?: string[];
}

/**
 * Collect unique categories used by items (API returns names) and resolve them
 * to catalog `{ id, name }` entries. Catalog order is preserved for stable chips.
 */
export function resolveUsedCategories(
  items: CategorizedItem[],
  catalog: ListFormCategory[],
): ListFormCategory[] {
  const usedNames = new Set<string>();
  for (const item of items) {
    for (const name of item.categories ?? []) {
      const trimmed = name.trim();
      if (trimmed) usedNames.add(trimmed.toLowerCase());
    }
  }

  if (usedNames.size === 0) return [];

  return catalog.filter(
    (category) =>
      usedNames.has(category.name.trim().toLowerCase()) ||
      usedNames.has(category.id.toLowerCase()),
  );
}
