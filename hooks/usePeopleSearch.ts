import { useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import accountService from "@/http/account-api/account.services";
import type { peopleDiscoverySearchDTO } from "@/http/account-api/types";
import type { UnifiedSearchPersonDAO } from "@/http/search-api/type";
import { useSearchStore } from "@/stores/useSearchStore";
import { useSearchChromeStore } from "@/stores/useSearchChromeStore";
import { useEffectiveSearchLocation } from "@/hooks/useEffectiveSearchLocation";
import {
  FEED_MAX_POOL,
  FEED_PAGE_SIZE_LISTS,
} from "@/constants/feedPagination";
import { SEARCH_MAP_RADIUS_KM } from "@/utils/searchMapMarkers";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";
import { personalitySidesFromPriorities } from "@/utils/personalityQuiz";

async function fetchPeopleSearch(
  params: peopleDiscoverySearchDTO,
): Promise<UnifiedSearchPersonDAO[]> {
  const response = await accountService.searchPeople(params);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data?.data ?? [];
}

/** Backs the People search tab via GET /accounts/search?scope=all. */
export function usePeopleSearch() {
  const committedQuery = useSearchStore((s) => s.committedQuery);
  const matchThreshold = useSearchStore((s) => s.matchThreshold);
  const matchPriorities = useSearchStore((s) => s.matchPriorities);
  const coordinates = useEffectiveSearchLocation();
  const setActiveResultCount = useSearchChromeStore((s) => s.setActiveResultCount);

  const filterParams = useMemo((): Omit<peopleDiscoverySearchDTO, "limit" | "offset"> => {
    const p: Omit<peopleDiscoverySearchDTO, "limit" | "offset"> = {
      query: committedQuery,
    };
    if (matchThreshold !== null) p.matchMin = matchThreshold;
    const personalitySides = personalitySidesFromPriorities(matchPriorities);
    if (personalitySides.length > 0) p.personalitySides = personalitySides;
    if (coordinates) {
      if (coordinates.city) {
        p.city = coordinates.city;
        if (coordinates.region) p.region = coordinates.region;
      } else {
        p.latitude = coordinates.latitude;
        p.longitude = coordinates.longitude;
        p.radiusKm = SEARCH_MAP_RADIUS_KM;
      }
    }
    return p;
  }, [committedQuery, matchThreshold, matchPriorities, coordinates]);

  const queryKey = useMemo(
    () => [
      "people-search",
      filterParams.query ?? "",
      filterParams.matchMin ?? null,
      filterParams.personalitySides ?? [],
      filterParams.city ?? null,
      filterParams.region ?? null,
      filterParams.latitude ?? null,
      filterParams.longitude ?? null,
      filterParams.radiusKm ?? null,
    ],
    [filterParams],
  );

  const peopleQuery = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      fetchPeopleSearch({
        ...filterParams,
        limit: FEED_PAGE_SIZE_LISTS,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((sum, page) => sum + page.length, 0);
      if (
        lastPage.length < FEED_PAGE_SIZE_LISTS ||
        totalLoaded >= FEED_MAX_POOL
      ) {
        return undefined;
      }
      return totalLoaded;
    },
    staleTime: FEED_STALE_TIME_MS,
  });

  const people = useMemo(
    () => peopleQuery.data?.pages.flat() ?? [],
    [peopleQuery.data],
  );

  useEffect(() => {
    setActiveResultCount(people.length);
  }, [people.length, setActiveResultCount]);

  return {
    people,
    isLoading: peopleQuery.isFetching && people.length > 0,
    isPending: peopleQuery.isPending && peopleQuery.data === undefined,
    isRefetching: peopleQuery.isRefetching && !peopleQuery.isFetchingNextPage,
    error: peopleQuery.error?.message ?? null,
    refetch: peopleQuery.refetch,
    fetchNextPage: peopleQuery.fetchNextPage,
    hasNextPage: peopleQuery.hasNextPage ?? false,
    isFetchingNextPage: peopleQuery.isFetchingNextPage,
  };
}
