import {
  SEARCH_SUGGESTIONS_LIMIT,
  type SearchFollowPick,
  type SearchSuggestion,
} from "@/constants/searchSuggestions";
import type { ListItemPublic } from "@/http/list-api/types";
import type { SearchSuggestionDAO } from "@/http/search-api/type";
import { getPickMatchPercent } from "@/utils/homePicks";
import { resolveImageUrl } from "@/utils/httpHelpers";

/** Maps a followed user's pick to a dropdown row; null when it can't be shown. */
export function mapListItemToFollowPick(
  item: ListItemPublic,
): SearchFollowPick | null {
  const title = item.business_name?.trim() || item.others_name?.trim();
  const imageUrl = resolveImageUrl(item.images?.[0]?.url);
  if (!title || !imageUrl) return null;

  const matchPercent = getPickMatchPercent(item);
  return {
    id: item.id,
    ownerId: item.owner.id,
    title,
    category: item.categories?.[0] ?? "",
    place: item.location?.city || item.branch?.name || "",
    ...(matchPercent !== null ? { matchPercent } : {}),
    username: item.owner.username || item.owner.name,
    imageUrl,
    ...(item.description?.trim() ? { reason: item.description.trim() } : {}),
  };
}

/** Server rows first, then local vibe rows, de-duplicated by label (case-insensitive). */
export function mergeSuggestions(
  server: SearchSuggestionDAO[],
  local: SearchSuggestion[],
  limit: number = SEARCH_SUGGESTIONS_LIMIT,
): SearchSuggestion[] {
  const seen = new Set<string>();
  const out: SearchSuggestion[] = [];
  for (const row of [...server, ...local]) {
    const key = row.label.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}
