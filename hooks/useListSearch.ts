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
import { dedupeById } from "@/utils/dedupeById";

const DEFAULT_RADIUS_KM = 15;

type ListSearchPage = {
  items: ListItemDAO[];
  total: number;
};

async function fetchListSearch(params: serchDTO): Promise<ListSearchPage> {
  const response = await listService.searchLists(params);
  if (response.error) {
    throw new Error(response.error.message);
  }
  const items = response.data?.data ?? [];
  return {
    items,
    total: response.data?.pagination?.total ?? items.length,
  };
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
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.items.length < FEED_PAGE_SIZE_LISTS) return undefined;
      const nextOffset = lastPageParam + lastPage.items.length;
      if (nextOffset >= FEED_MAX_POOL) return undefined;
      if (nextOffset >= lastPage.total) return undefined;
      return nextOffset;
    },
    staleTime: FEED_STALE_TIME_MS,
  });

  const lists = useMemo(
    () =>
      dedupeById(listQuery.data?.pages.flatMap((page) => page.items) ?? []),
    [listQuery.data],
  );

  const totalCount = listQuery.data?.pages[0]?.total ?? lists.length;

  useEffect(() => {
    setActiveResultCount(totalCount);
  }, [totalCount, setActiveResultCount]);

  return {
    lists,
    totalCount,
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
