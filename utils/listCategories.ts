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
