import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import accountService from "@/http/account-api/account.services";
import {
  MOCK_FOLLOWING_PICKS,
  MOCK_SEARCH_SUGGESTIONS,
  type SearchFollowPick,
  type SearchSuggestion,
} from "@/constants/searchSuggestions";
import { buildSearchSuggestions } from "@/utils/buildSearchSuggestions";
import {
  clearRecentQueries,
  loadRecentQueries,
  loadRecentVibes,
  removeRecentQuery,
  saveRecentQuery,
} from "@/utils/searchRecents";

export function useSearchFocusSuggestions(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
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

  const suggestions: SearchSuggestion[] = useMemo(() => {
    const live = buildSearchSuggestions({
      profile: profileQuery.data,
      recentVibes,
    });
    return live.length > 0 ? live : MOCK_SEARCH_SUGGESTIONS;
  }, [profileQuery.data, recentVibes]);

  const followingPicks: SearchFollowPick[] = MOCK_FOLLOWING_PICKS;

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
    rememberQuery,
    removeQuery,
    clearQueries,
    refreshLocal,
    isSuggestionsLoading: profileQuery.isLoading,
  };
}
