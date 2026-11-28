import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import accountService from "@/http/account-api/account.services";
import listService from "@/http/list-api/list.service";
import searchService from "@/http/search-api/search.service";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";
import {
  SEARCH_SUGGESTIONS_LIMIT,
  type SearchFollowPick,
  type SearchSuggestion,
} from "@/constants/searchSuggestions";
import { useEffectiveSearchLocation } from "@/hooks/useEffectiveSearchLocation";
import {
  mapListItemToFollowPick,
  mergeSuggestions,
} from "@/utils/searchFocusData";
import { buildSearchSuggestions } from "@/utils/buildSearchSuggestions";
import {
  clearRecentQueries,
  loadRecentQueries,
  loadRecentVibes,
  removeRecentQuery,
  saveRecentQuery,
} from "@/utils/searchRecents";
import type { ListItemPublic } from "@/http/list-api/types";

const QUERY_DEBOUNCE_MS = 200;
const FOLLOWING_PICKS_LIMIT = 3;

export function useSearchFocusSuggestions(options?: {
  enabled?: boolean;
  /** Text typed so far; turns the suggestions into prefix autocomplete. */
  query?: string;
}) {
  const enabled = options?.enabled ?? true;
  const typed = (options?.query ?? "").trim();
  const [debouncedQuery, setDebouncedQuery] = useState(typed);
  const location = useEffectiveSearchLocation();
  const city = location?.city;
  const region = location?.region;
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [recentVibes, setRecentVibes] = useState<string[]>([]);

  const refreshLocal = useCallback(async () => {
    const [queries, vibes] = await Promise.all([
      loadRecentQueries(),
      loadRecentVibes(3),
    ]);
    setRecentQueries(queries);
    setRecentVibes(vibes);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refreshLocal();
  }, [enabled, refreshLocal]);

  const profileQuery = useQuery({
    queryKey: ["personality-profile"],
    queryFn: async () => {
      const response = await accountService.getPersonalityProfile();
      return response.data?.data ?? null;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(typed), QUERY_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [typed]);

  const serverSuggestionsQuery = useQuery({
    queryKey: ["search-suggestions", debouncedQuery, city ?? null, region ?? null],
    queryFn: async () => {
      const response = await searchService.fetchSuggestions({
        q: debouncedQuery || undefined,
        city,
        region,
        limit: SEARCH_SUGGESTIONS_LIMIT,
      });
      return response.data?.data ?? [];
    },
    enabled,
    staleTime: FEED_STALE_TIME_MS,
  });

  const suggestions: SearchSuggestion[] = useMemo(() => {
    // While typing, only prefix matches make sense; vibe rows are for the empty box.
    const local = debouncedQuery
      ? []
      : buildSearchSuggestions({ profile: profileQuery.data, recentVibes });
    return mergeSuggestions(serverSuggestionsQuery.data ?? [], local);
  }, [debouncedQuery, profileQuery.data, recentVibes, serverSuggestionsQuery.data]);

  const followingPicksQuery = useQuery({
    queryKey: ["search-following-picks"],
    queryFn: async () => {
      const response = await listService.fetchListItems({
        scope: "all",
        following_only: true,
        sort_by: "created_at",
        sort_order: "desc",
        with_image: true,
        limit: FOLLOWING_PICKS_LIMIT,
      });
      if (response.error) throw new Error(response.error.message);
      return response.data?.data ?? [];
    },
    enabled,
    staleTime: FEED_STALE_TIME_MS,
  });

  const followingPickItems: ListItemPublic[] = useMemo(
    () =>
      (followingPicksQuery.data ?? []).filter(
        (item) => mapListItemToFollowPick(item) !== null,
      ),
    [followingPicksQuery.data],
  );

  const followingPicks: SearchFollowPick[] = useMemo(
    () =>
      followingPickItems
        .map(mapListItemToFollowPick)
        .filter((pick): pick is SearchFollowPick => pick !== null),
    [followingPickItems],
  );

  const rememberQuery = useCallback(
    async (query: string) => {
      const next = await saveRecentQuery(query);
      setRecentQueries(next);
    },
    [],
  );

  const removeQuery = useCallback(async (query: string) => {
    const next = await removeRecentQuery(query);
    setRecentQueries(next);
  }, []);

  const clearQueries = useCallback(async () => {
    await clearRecentQueries();
    setRecentQueries([]);
  }, []);

  return {
    recentQueries,
    suggestions,
    followingPicks,
    followingPickItems,
    rememberQuery,
    removeQuery,
    clearQueries,
    refreshLocal,
    isSuggestionsLoading:
      profileQuery.isLoading || serverSuggestionsQuery.isLoading,
  };
}
