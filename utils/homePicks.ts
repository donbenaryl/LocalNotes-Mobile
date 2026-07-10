import type { Item, ListItemDAO, ListItemPublic } from "@/http/list-api/types";
import { resolveImageUrl } from "@/utils/httpHelpers";

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

export function countMatchingPicks(
  lists: ListItemDAO[],
  matchByAccountId: Record<string, number | null>,
  threshold: number | null,
  selectedVibes: string[],
): number {
  if (threshold === null) {
    return flattenListsToPicks(lists, selectedVibes).length;
  }

  let count = 0;
  const seen = new Set<string>();

  for (const list of lists) {
    const ownerMatch = matchByAccountId[list.account.id] ?? 0;
    if (ownerMatch < threshold) continue;

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
