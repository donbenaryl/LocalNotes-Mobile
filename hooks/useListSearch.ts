import { useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import listService from "@/http/list-api/list.service";
import type { ListItemDAO, serchDTO } from "@/http/list-api/types";
import { useSearchStore } from "@/stores/useSearchStore";
import { useSearchChromeStore } from "@/stores/useSearchChromeStore";
import { useEffectiveSearchLocation } from "@/hooks/useEffectiveSearchLocation";
import {
  FEED_MAX_POOL,
  FEED_PAGE_SIZE_LISTS,
} from "@/constants/feedPagination";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";
import { personalitySidesFromPriorities } from "@/utils/personalityQuiz";

const DEFAULT_RADIUS_KM = 15;

async function fetchListSearch(params: serchDTO): Promise<ListItemDAO[]> {
  const response = await listService.searchLists(params);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data?.data ?? [];
}

/** Backs the Lists search tab via GET /lists/search (replaces the shared unified-search call). */
export function useListSearch() {
  const committedQuery = useSearchStore((s) => s.committedQuery);
  const matchThreshold = useSearchStore((s) => s.matchThreshold);
  const matchPriorities = useSearchStore((s) => s.matchPriorities);
  const selectedVibes = useSearchStore((s) => s.selectedVibes);
  const coordinates = useEffectiveSearchLocation();
  const setActiveResultCount = useSearchChromeStore((s) => s.setActiveResultCount);

  const filterParams = useMemo((): Omit<serchDTO, "limit" | "offset"> => {
    const p: Omit<serchDTO, "limit" | "offset"> = { query: committedQuery };
    if (matchThreshold !== null) p.matchMin = matchThreshold;
    if (selectedVibes.length > 0) p.vibe = selectedVibes;
    const personalitySides = personalitySidesFromPriorities(matchPriorities);
    if (personalitySides.length > 0) p.personalitySides = personalitySides;
    if (coordinates) {
      p.latitude = coordinates.latitude;
      p.longitude = coordinates.longitude;
      p.radiusKm = DEFAULT_RADIUS_KM;
    }
    return p;
  }, [committedQuery, matchThreshold, matchPriorities, selectedVibes, coordinates]);

  const queryKey = useMemo(
    () => [
      "list-search",
      filterParams.query ?? "",
      filterParams.matchMin ?? null,
      filterParams.vibe ?? [],
      filterParams.personalitySides ?? [],
      filterParams.latitude ?? null,
      filterParams.longitude ?? null,
      filterParams.radiusKm ?? null,
    ],
    [filterParams],
  );

  const listQuery = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      fetchListSearch({
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

  const lists = useMemo(
    () => listQuery.data?.pages.flat() ?? [],
    [listQuery.data],
  );

  useEffect(() => {
    setActiveResultCount(lists.length);
  }, [lists.length, setActiveResultCount]);

  return {
    lists,
    isLoading: listQuery.isFetching && lists.length > 0,
    isPending: listQuery.isPending && listQuery.data === undefined,
    isRefetching: listQuery.isRefetching && !listQuery.isFetchingNextPage,
    error: listQuery.error?.message ?? null,
    refetch: listQuery.refetch,
    fetchNextPage: listQuery.fetchNextPage,
    hasNextPage: listQuery.hasNextPage ?? false,
    isFetchingNextPage: listQuery.isFetchingNextPage,
  };
}
