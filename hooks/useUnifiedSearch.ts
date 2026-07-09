import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import searchService from "@/http/search-api/search.service";
import type {
  UnifiedSearchParams,
  UnifiedSearchResultDAO,
} from "@/http/search-api/type";
import type { Location as GeoLocation } from "@/http/list-api/types";
import { useSearchStore } from "@/stores/useSearchStore";
import { useUserCoordinates } from "@/hooks/useUserCoordinates";

const DEFAULT_RADIUS_KM = 10;
const SEARCH_LIMIT = 25;

const EMPTY_RESULT: UnifiedSearchResultDAO = {
  lists: [],
  people: [],
  businesses: [],
};

interface EffectiveCoordinates {
  latitude: number;
  longitude: number;
}

function buildSearchParams(
  query: string,
  matchThreshold: number | null,
  selectedVibes: string[],
  coordinates: EffectiveCoordinates | null,
): UnifiedSearchParams {
  // Web explore always sends type=individual_lists; one response still
  // includes people + businesses. UI tabs only change which slice we show.
  const params: UnifiedSearchParams = {
    query,
    type: "individual_lists",
    limit: SEARCH_LIMIT,
  };

  if (coordinates) {
    params.latitude = coordinates.latitude;
    params.longitude = coordinates.longitude;
    params.radiusKm = DEFAULT_RADIUS_KM;
  }

  if (matchThreshold !== null) {
    params.matchMin = matchThreshold;
  }

  if (selectedVibes.length > 0) {
    params.vibes = selectedVibes;
  }

  return params;
}

async function fetchUnifiedSearch(
  params: UnifiedSearchParams,
): Promise<UnifiedSearchResultDAO> {
  const response = await searchService.unifiedSearch(params);

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.data ?? EMPTY_RESULT;
}

export function useUnifiedSearch() {
  const committedQuery = useSearchStore((s) => s.committedQuery);
  const matchThreshold = useSearchStore((s) => s.matchThreshold);
  const selectedVibes = useSearchStore((s) => s.selectedVibes);
  const locationMode = useSearchStore((s) => s.locationMode);
  const manualLocation = useSearchStore((s) => s.manualLocation);
  const { coordinates: userCoordinates } = useUserCoordinates();

  const effectiveCoordinates = useMemo((): EffectiveCoordinates | null => {
    if (locationMode === "all") {
      return null;
    }

    if (locationMode === "city" && manualLocation) {
      return {
        latitude: manualLocation.latitude,
        longitude: manualLocation.longitude,
      };
    }

    // "auto" — prefer device/profile GPS when available
    if (userCoordinates) {
      return {
        latitude: userCoordinates.latitude,
        longitude: userCoordinates.longitude,
      };
    }

    return null;
  }, [locationMode, manualLocation, userCoordinates]);

  const searchParams = useMemo(
    () =>
      buildSearchParams(
        committedQuery,
        matchThreshold,
        selectedVibes,
        effectiveCoordinates,
      ),
    [committedQuery, matchThreshold, selectedVibes, effectiveCoordinates],
  );

  const queryKey = useMemo(
    () => [
      "unified-search",
      searchParams.query,
      searchParams.matchMin ?? null,
      searchParams.vibes ?? [],
      searchParams.latitude ?? null,
      searchParams.longitude ?? null,
      searchParams.radiusKm ?? null,
    ],
    [searchParams],
  );

  const searchQuery = useQuery({
    queryKey,
    queryFn: () => fetchUnifiedSearch(searchParams),
  });

  const data = searchQuery.data ?? EMPTY_RESULT;
  const lists = data.lists ?? [];
  const people = data.people ?? [];
  const businesses = data.businesses ?? [];

  return {
    lists,
    people,
    businesses,
    counts: {
      lists: lists.length,
      people: people.length,
      businesses: businesses.length,
      total: lists.length + people.length + businesses.length,
    },
    isLoading: searchQuery.isPending || searchQuery.isFetching,
    isPending: searchQuery.isPending,
    error: searchQuery.error?.message ?? null,
    refetch: searchQuery.refetch,
    hasCoordinates: effectiveCoordinates !== null,
    locationOverride: (manualLocation as GeoLocation | null) ?? null,
  };
}
