import { useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import listService from "@/http/list-api/list.service";
import type { ListItemPublic } from "@/http/list-api/types";
import { useSearchStore } from "@/stores/useSearchStore";
import { useSearchChromeStore } from "@/stores/useSearchChromeStore";
import { useEffectiveSearchLocation } from "@/hooks/useEffectiveSearchLocation";
import {
  FEED_MAX_POOL,
  FEED_PAGE_SIZE_PICKS,
} from "@/constants/feedPagination";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";
import { personalitySidesFromPriorities } from "@/utils/personalityQuiz";
import { dedupeById } from "@/utils/dedupeById";

const DEFAULT_RADIUS_KM = 15;

type PicksSearchParams = NonNullable<Parameters<typeof listService.fetchListItems>[0]>;

type PicksSearchPage = {
  items: ListItemPublic[];
  total: number;
};

async function fetchPicksSearch(params: PicksSearchParams): Promise<PicksSearchPage> {
  const response = await listService.fetchListItems(params);
  if (response.error) {
    throw new Error(response.error.message);
  }
  const items = response.data?.data ?? [];
  return {
    items,
    total: response.data?.pagination?.total ?? items.length,
  };
}

/** Backs the Picks search tab via GET /lists/list-items?scope=all (discovery across every pick). */
export function usePicksSearch() {
  const committedQuery = useSearchStore((s) => s.committedQuery);
  const matchThreshold = useSearchStore((s) => s.matchThreshold);
  const matchPriorities = useSearchStore((s) => s.matchPriorities);
  const selectedVibes = useSearchStore((s) => s.selectedVibes);
  const coordinates = useEffectiveSearchLocation();
  const setActiveResultCount = useSearchChromeStore((s) => s.setActiveResultCount);

  const filterParams = useMemo((): Omit<PicksSearchParams, "limit" | "offset"> => {
    const p: Omit<PicksSearchParams, "limit" | "offset"> = { scope: "all" };
    if (committedQuery) p.keyword = committedQuery;
    if (matchThreshold !== null) p.match_min = matchThreshold;
    if (selectedVibes.length > 0) p.vibes = selectedVibes;
    const personalitySides = personalitySidesFromPriorities(matchPriorities);
    if (personalitySides.length > 0) p.personality_sides = personalitySides;
    if (coordinates) {
      p.latitude = coordinates.latitude;
      p.longitude = coordinates.longitude;
      p.radius_km = DEFAULT_RADIUS_KM;
    }
    return p;
  }, [committedQuery, matchThreshold, matchPriorities, selectedVibes, coordinates]);

  const queryKey = useMemo(
    () => [
      "picks-search",
      filterParams.keyword ?? "",
      filterParams.match_min ?? null,
      filterParams.vibes ?? [],
      filterParams.personality_sides ?? [],
      filterParams.latitude ?? null,
      filterParams.longitude ?? null,
      filterParams.radius_km ?? null,
    ],
    [filterParams],
  );

  const picksQuery = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      fetchPicksSearch({
        ...filterParams,
        limit: FEED_PAGE_SIZE_PICKS,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.items.length < FEED_PAGE_SIZE_PICKS) return undefined;
      const nextOffset = lastPageParam + lastPage.items.length;
      if (nextOffset >= FEED_MAX_POOL) return undefined;
      if (nextOffset >= lastPage.total) return undefined;
      return nextOffset;
    },
    staleTime: FEED_STALE_TIME_MS,
  });

  const picks = useMemo(
    () =>
      dedupeById(picksQuery.data?.pages.flatMap((page) => page.items) ?? []),
    [picksQuery.data],
  );

  const totalCount = picksQuery.data?.pages[0]?.total ?? picks.length;

  useEffect(() => {
    setActiveResultCount(totalCount);
  }, [totalCount, setActiveResultCount]);

  return {
    picks,
    totalCount,
    isLoading: picksQuery.isFetching && picks.length > 0,
    isPending: picksQuery.isPending && picksQuery.data === undefined,
    isRefetching: picksQuery.isRefetching && !picksQuery.isFetchingNextPage,
    error: picksQuery.error?.message ?? null,
    refetch: picksQuery.refetch,
    fetchNextPage: picksQuery.fetchNextPage,
    hasNextPage: picksQuery.hasNextPage ?? false,
    isFetchingNextPage: picksQuery.isFetchingNextPage,
  };
}
