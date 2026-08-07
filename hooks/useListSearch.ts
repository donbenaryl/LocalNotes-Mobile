import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import listService from "@/http/list-api/list.service";
import type { ListItemDAO, serchDTO } from "@/http/list-api/types";
import { useSearchStore } from "@/stores/useSearchStore";
import { useSearchChromeStore } from "@/stores/useSearchChromeStore";
import { useEffectiveSearchLocation } from "@/hooks/useEffectiveSearchLocation";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";

const DEFAULT_RADIUS_KM = 10;
const SEARCH_LIMIT = 25;

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
  const selectedVibes = useSearchStore((s) => s.selectedVibes);
  const coordinates = useEffectiveSearchLocation();
  const setActiveResultCount = useSearchChromeStore((s) => s.setActiveResultCount);

  const params = useMemo((): serchDTO => {
    const p: serchDTO = { query: committedQuery, limit: SEARCH_LIMIT };
    if (matchThreshold !== null) p.matchMin = matchThreshold;
    if (selectedVibes.length > 0) p.vibe = selectedVibes;
    if (coordinates) {
      p.latitude = coordinates.latitude;
      p.longitude = coordinates.longitude;
      p.radiusKm = DEFAULT_RADIUS_KM;
      if (coordinates.city) {
        p.city = coordinates.city;
        if (coordinates.region) p.region = coordinates.region;
      }
    }
    return p;
  }, [committedQuery, matchThreshold, selectedVibes, coordinates]);

  const queryKey = useMemo(
    () => [
      "list-search",
      params.query ?? "",
      params.matchMin ?? null,
      params.vibe ?? [],
      params.latitude ?? null,
      params.longitude ?? null,
      params.radiusKm ?? null,
      params.city ?? null,
      params.region ?? null,
    ],
    [params],
  );

  const listQuery = useQuery({
    queryKey,
    queryFn: () => fetchListSearch(params),
    staleTime: FEED_STALE_TIME_MS,
  });

  const lists = listQuery.data ?? [];

  useEffect(() => {
    setActiveResultCount(lists.length);
  }, [lists.length, setActiveResultCount]);

  return {
    lists,
    isLoading: listQuery.isFetching && lists.length > 0,
    isPending: listQuery.isPending && listQuery.data === undefined,
    isRefetching: listQuery.isRefetching,
    error: listQuery.error?.message ?? null,
    refetch: listQuery.refetch,
  };
}
