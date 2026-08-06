import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import listService from "@/http/list-api/list.service";
import type { ListItemPublic } from "@/http/list-api/types";
import { useSearchStore } from "@/stores/useSearchStore";
import { useSearchChromeStore } from "@/stores/useSearchChromeStore";
import { useEffectiveSearchLocation } from "@/hooks/useEffectiveSearchLocation";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";

const DEFAULT_RADIUS_KM = 10;
const SEARCH_LIMIT = 30;

type PicksSearchParams = NonNullable<Parameters<typeof listService.fetchListItems>[0]>;

async function fetchPicksSearch(params: PicksSearchParams): Promise<ListItemPublic[]> {
  const response = await listService.fetchListItems(params);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data?.data ?? [];
}

/** Backs the Picks search tab via GET /lists/list-items?scope=all (discovery across every pick). */
export function usePicksSearch() {
  const committedQuery = useSearchStore((s) => s.committedQuery);
  const matchThreshold = useSearchStore((s) => s.matchThreshold);
  const selectedVibes = useSearchStore((s) => s.selectedVibes);
  const coordinates = useEffectiveSearchLocation();
  const setActiveResultCount = useSearchChromeStore((s) => s.setActiveResultCount);

  const params = useMemo((): PicksSearchParams => {
    const p: PicksSearchParams = { scope: "all", limit: SEARCH_LIMIT };
    if (committedQuery) p.keyword = committedQuery;
    if (matchThreshold !== null) p.match_min = matchThreshold;
    if (selectedVibes.length > 0) p.vibes = selectedVibes;
    if (coordinates) {
      p.latitude = coordinates.latitude;
      p.longitude = coordinates.longitude;
      p.radius_km = DEFAULT_RADIUS_KM;
      if (coordinates.city) {
        p.city = coordinates.city;
        if (coordinates.region) p.region = coordinates.region;
      }
    }
    return p;
  }, [committedQuery, matchThreshold, selectedVibes, coordinates]);

  const queryKey = useMemo(
    () => [
      "picks-search",
      params.keyword ?? "",
      params.match_min ?? null,
      params.vibes ?? [],
      params.latitude ?? null,
      params.longitude ?? null,
      params.radius_km ?? null,
      params.city ?? null,
      params.region ?? null,
    ],
    [params],
  );

  const picksQuery = useQuery({
    queryKey,
    queryFn: () => fetchPicksSearch(params),
    staleTime: FEED_STALE_TIME_MS,
  });

  const picks = picksQuery.data ?? [];

  useEffect(() => {
    setActiveResultCount(picks.length);
  }, [picks.length, setActiveResultCount]);

  return {
    picks,
    isLoading: picksQuery.isFetching && picks.length > 0,
    isPending: picksQuery.isPending && picksQuery.data === undefined,
    error: picksQuery.error?.message ?? null,
    refetch: picksQuery.refetch,
  };
}
