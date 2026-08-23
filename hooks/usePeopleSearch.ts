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
import { dedupeById } from "@/utils/dedupeById";

type PeopleSearchPage = {
  items: UnifiedSearchPersonDAO[];
  total: number;
};

async function fetchPeopleSearch(
  params: peopleDiscoverySearchDTO,
): Promise<PeopleSearchPage> {
  const response = await accountService.searchPeople(params);
  if (response.error) {
    throw new Error(response.error.message);
  }
  const items = response.data?.data ?? [];
  return {
    items,
    total: response.data?.pagination?.total ?? items.length,
  };
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
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.items.length < FEED_PAGE_SIZE_LISTS) return undefined;
      const nextOffset = lastPageParam + lastPage.items.length;
      if (nextOffset >= FEED_MAX_POOL) return undefined;
      if (nextOffset >= lastPage.total) return undefined;
      return nextOffset;
    },
    staleTime: FEED_STALE_TIME_MS,
  });

  const people = useMemo(
    () =>
      dedupeById(peopleQuery.data?.pages.flatMap((page) => page.items) ?? []),
    [peopleQuery.data],
  );

  const totalCount = peopleQuery.data?.pages[0]?.total ?? people.length;

  useEffect(() => {
    setActiveResultCount(totalCount);
  }, [totalCount, setActiveResultCount]);

  return {
    people,
    totalCount,
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
