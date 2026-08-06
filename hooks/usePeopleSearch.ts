import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import accountService from "@/http/account-api/account.services";
import type { peopleDiscoverySearchDTO } from "@/http/account-api/types";
import type { UnifiedSearchPersonDAO } from "@/http/search-api/type";
import { useSearchStore } from "@/stores/useSearchStore";
import { useSearchChromeStore } from "@/stores/useSearchChromeStore";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";

const SEARCH_LIMIT = 25;

async function fetchPeopleSearch(
  params: peopleDiscoverySearchDTO,
): Promise<UnifiedSearchPersonDAO[]> {
  const response = await accountService.searchPeople(params);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data?.data ?? [];
}

/**
 * Backs the People search tab via GET /accounts/search-friends?scope=all (replaces the
 * shared unified-search call). Location isn't wired in — unified-search never filtered
 * people by location either, so this preserves existing behavior.
 */
export function usePeopleSearch() {
  const committedQuery = useSearchStore((s) => s.committedQuery);
  const matchThreshold = useSearchStore((s) => s.matchThreshold);
  const setActiveResultCount = useSearchChromeStore((s) => s.setActiveResultCount);

  const params = useMemo((): peopleDiscoverySearchDTO => {
    const p: peopleDiscoverySearchDTO = { query: committedQuery, limit: SEARCH_LIMIT };
    if (matchThreshold !== null) p.matchMin = matchThreshold;
    return p;
  }, [committedQuery, matchThreshold]);

  const queryKey = useMemo(
    () => ["people-search", params.query ?? "", params.matchMin ?? null],
    [params],
  );

  const peopleQuery = useQuery({
    queryKey,
    queryFn: () => fetchPeopleSearch(params),
    staleTime: FEED_STALE_TIME_MS,
  });

  const people = peopleQuery.data ?? [];

  useEffect(() => {
    setActiveResultCount(people.length);
  }, [people.length, setActiveResultCount]);

  return {
    people,
    isLoading: peopleQuery.isFetching && people.length > 0,
    isPending: peopleQuery.isPending && peopleQuery.data === undefined,
    error: peopleQuery.error?.message ?? null,
    refetch: peopleQuery.refetch,
  };
}
