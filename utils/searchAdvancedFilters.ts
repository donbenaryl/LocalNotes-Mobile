import type { SearchSort } from "@/stores/useSearchStore";

export const DEFAULT_SEARCH_RADIUS_KM = 15;
export const MILES_TO_KM = 1.60934;
export const DISTANCE_MILE_PRESETS: Array<number | null> = [null, 1, 5, 10, 25];

export function distanceMilesToRadiusKm(
  distanceMiles: number | null,
): number {
  if (distanceMiles == null) return DEFAULT_SEARCH_RADIUS_KM;
  return distanceMiles * MILES_TO_KM;
}

export function searchSortToApi(sort: SearchSort): {
  sortBy: "match" | "created_at" | "distance";
  sortOrder: "asc" | "desc";
} {
  if (sort === "newest") {
    return { sortBy: "created_at", sortOrder: "desc" };
  }
  if (sort === "nearest") {
    return { sortBy: "distance", sortOrder: "asc" };
  }
  return { sortBy: "match", sortOrder: "desc" };
}

export function countActiveAdvancedFilters(filters: {
  distanceMiles: number | null;
  selectedCategories: string[];
  followingOnly: boolean;
  sort: SearchSort;
}): number {
  let count = 0;
  if (filters.distanceMiles != null) count += 1;
  count += filters.selectedCategories.length;
  if (filters.followingOnly) count += 1;
  if (filters.sort !== "best") count += 1;
  return count;
}
