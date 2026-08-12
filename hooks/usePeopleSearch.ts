import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import accountService from "@/http/account-api/account.services";
import type { peopleDiscoverySearchDTO } from "@/http/account-api/types";
import type { UnifiedSearchPersonDAO } from "@/http/search-api/type";
import { useSearchStore } from "@/stores/useSearchStore";
import { useSearchChromeStore } from "@/stores/useSearchChromeStore";
import { useEffectiveSearchLocation } from "@/hooks/useEffectiveSearchLocation";
import { SEARCH_MAP_RADIUS_KM } from "@/utils/searchMapMarkers";
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

/** Backs the People search tab via GET /accounts/search-friends?scope=all. */
export function usePeopleSearch() {
  const committedQuery = useSearchStore((s) => s.committedQuery);
  const matchThreshold = useSearchStore((s) => s.matchThreshold);
  const coordinates = useEffectiveSearchLocation();
  const setActiveResultCount = useSearchChromeStore((s) => s.setActiveResultCount);

  const params = useMemo((): peopleDiscoverySearchDTO => {
    const p: peopleDiscoverySearchDTO = { query: committedQuery, limit: SEARCH_LIMIT };
    if (matchThreshold !== null) p.matchMin = matchThreshold;
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
  }, [committedQuery, matchThreshold, coordinates]);

  const queryKey = useMemo(
    () => [
      "people-search",
      params.query ?? "",
      params.matchMin ?? null,
      params.city ?? null,
      params.region ?? null,
      params.latitude ?? null,
      params.longitude ?? null,
      params.radiusKm ?? null,
    ],
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
    isRefetching: peopleQuery.isRefetching,
    error: peopleQuery.error?.message ?? null,
    refetch: peopleQuery.refetch,
  };
}
