import type { Item, ListItemDAO, ListItemPublic } from "@/http/list-api/types";
import type { ListFormCategory } from "@/types/listForm";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getListMatchPercent } from "@/utils/matchScore";

export type HomeContentType = "lists" | "picks";

function pickHasImage(pick: ListItemPublic): boolean {
  const primary = pick.images?.[0]?.url;
  return Boolean(resolveImageUrl(primary));
}

export function pickMatchesVibes(item: Item, vibes: string[]): boolean {
  if (vibes.length === 0) return true;

  const normalizedVibes = vibes.map((v) => v.toLowerCase());
  return (item.tags ?? []).some((tag) =>
    normalizedVibes.some((vibe) => tag.name.toLowerCase().includes(vibe)),
  );
}

/**
 * List/item `categories` arrays hold category *names* (API returns names, not ids —
 * see `resolveUsedCategories`), while selected filter values are catalog ids. Resolve
 * the selected ids to their catalog names (keeping the id too, in case an item ever
 * carries a raw id) so matching works the same way `resolveUsedCategories` does.
 */
export function buildCategoryMatchTokens(
  catalog: ListFormCategory[],
  categoryIds: string[],
): Set<string> {
  const tokens = new Set<string>();
  const catalogById = new Map(catalog.map((c) => [c.id.toLowerCase(), c]));

  for (const id of categoryIds) {
    const normalizedId = id.toLowerCase();
    tokens.add(normalizedId);
    const category = catalogById.get(normalizedId);
    if (category) tokens.add(category.name.trim().toLowerCase());
  }

  return tokens;
}

export function listMatchesCategories(
  list: ListItemDAO,
  categoryTokens: Set<string>,
): boolean {
  if (categoryTokens.size === 0) return true;

  return (list.categories ?? []).some((category) =>
    categoryTokens.has(category.trim().toLowerCase()),
  );
}

export function pickMatchesCategories(
  item: Item,
  categoryTokens: Set<string>,
): boolean {
  if (categoryTokens.size === 0) return true;

  return (item.categories ?? []).some((category) =>
    categoryTokens.has(category.trim().toLowerCase()),
  );
}

export function mapSearchItemToListItemPublic(item: Item): ListItemPublic {
  const businessName =
    item.business?.name ?? item.unverified_business?.name ?? null;

  return {
    id: item.id,
    business_name: businessName,
    business_id: item.business?.id ?? null,
    is_verified: item.business?.status === "Claimed and Verified",
    is_favorite: item.is_favorite ?? false,
    is_owner: false,
    owner: item.owner ?? {
      id: item.account,
      name: "",
      profile_image: null,
    },
    description: item.description,
    tags: item.tags ?? [],
    categories: item.categories ?? [],
    others_name: item.others_name ?? null,
    images: item.images ?? [],
    list_usage_count: 0,
    location: item.location ?? null,
  };
}

export function flattenListsToPicks(
  lists: ListItemDAO[],
  selectedVibes: string[],
  excludeIds: Set<string> = new Set(),
): ListItemPublic[] {
  const seen = new Set(excludeIds);
  const picks: ListItemPublic[] = [];

  for (const list of lists) {
    for (const item of list.items ?? []) {
      if (!item.id || seen.has(item.id)) continue;
      if (!pickMatchesVibes(item, selectedVibes)) continue;

      seen.add(item.id);
      picks.push(mapSearchItemToListItemPublic(item));
    }
  }

  return picks;
}

export function sortPicksWithImagesFirst(
  picks: ListItemPublic[],
): ListItemPublic[] {
  return [...picks]
    .map((pick, originalIndex) => ({ pick, originalIndex }))
    .sort((a, b) => {
      const aHasImage = pickHasImage(a.pick);
      const bHasImage = pickHasImage(b.pick);
      if (aHasImage === bHasImage) return a.originalIndex - b.originalIndex;
      return aHasImage ? -1 : 1;
    })
    .map(({ pick }) => pick);
}

/** The active MATCH_SCORE_MODE match on a list, or 0 when it isn't comparable. */
export function getListPersonalityMatch(list: ListItemDAO): number {
  return getListMatchPercent(list) ?? 0;
}

export function countMatchingPicks(
  lists: ListItemDAO[],
  threshold: number | null,
  selectedVibes: string[],
): number {
  if (threshold === null) {
    return flattenListsToPicks(lists, selectedVibes).length;
  }

  let count = 0;
  const seen = new Set<string>();

  for (const list of lists) {
    if (getListPersonalityMatch(list) < threshold) continue;

    for (const item of list.items ?? []) {
      if (!item.id || seen.has(item.id)) continue;
      if (!pickMatchesVibes(item, selectedVibes)) continue;
      seen.add(item.id);
      count += 1;
    }
  }

  return count;
}

export function countVibeMatchingPicks(
  lists: ListItemDAO[],
  vibes: string[],
): number {
  if (vibes.length === 0) {
    return flattenListsToPicks(lists, []).length;
  }

  return flattenListsToPicks(lists, vibes).length;
}

export function countCategoryMatchingLists(
  lists: ListItemDAO[],
  catalog: ListFormCategory[],
  categoryIds: string[],
): number {
  const tokens = buildCategoryMatchTokens(catalog, categoryIds);
  if (tokens.size === 0) return lists.length;

  return lists.filter((list) => listMatchesCategories(list, tokens)).length;
}

export function countCategoryMatchingPicks(
  lists: ListItemDAO[],
  catalog: ListFormCategory[],
  categoryIds: string[],
): number {
  const tokens = buildCategoryMatchTokens(catalog, categoryIds);
  if (tokens.size === 0) {
    return flattenListsToPicks(lists, []).length;
  }

  let count = 0;
  const seen = new Set<string>();

  for (const list of lists) {
    for (const item of list.items ?? []) {
      if (!item.id || seen.has(item.id)) continue;
      if (!pickMatchesCategories(item, tokens)) continue;
      seen.add(item.id);
      count += 1;
    }
  }

  return count;
}
