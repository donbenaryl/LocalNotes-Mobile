import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import searchService from "@/http/search-api/search.service";
import type { UnifiedSearchParams } from "@/http/search-api/type";
import type { ListItemDAO, Location as GeoLocation } from "@/http/list-api/types";
import type { HomeListFilter } from "@/components/PageComponents/Home/Home/HomeFilterHeader";
import { useCategories } from "@/hooks/useProfileList";
import { useUserCoordinates } from "@/hooks/useUserCoordinates";
import { isCreatedToday } from "@/utils/time";
import {
  getListPersonalityMatch,
  countCategoryMatchingLists,
} from "@/utils/homePicks";
import { getListMatchPercent } from "@/utils/matchScore";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";

const NEAR_YOU_RADIUS_KM = 5;
const DEFAULT_RADIUS_KM = 15;
const LIST_LIMIT = 25;
const FOR_YOU_LIMIT = 3;

export interface UseHomeListsOptions {
  activeFilters: HomeListFilter[];
  matchThreshold: number | null;
  locationOverride: GeoLocation | null;
  skipLocationFilter?: boolean;
  selectedVibes: string[];
  selectedCategories: string[];
  /** When false, queries stay idle (Home picks mode). */
  enabled?: boolean;
}

interface EffectiveCoordinates {
  latitude: number;
  longitude: number;
}

function buildSearchParams(
  options: UseHomeListsOptions,
  coordinates: EffectiveCoordinates | null,
): UnifiedSearchParams {
  const { activeFilters, matchThreshold, selectedVibes, selectedCategories } = options;

  const params: UnifiedSearchParams = {
    query: "",
    type: "individual_lists",
    limit: LIST_LIMIT,
  };

  if (coordinates) {
    params.latitude = coordinates.latitude;
    params.longitude = coordinates.longitude;
    params.radiusKm = activeFilters.includes("distance")
      ? NEAR_YOU_RADIUS_KM
      : DEFAULT_RADIUS_KM;
  }

  if (matchThreshold !== null) {
    params.matchMin = matchThreshold;
  }

  if (selectedVibes.length > 0) {
    params.vibes = selectedVibes;
  }

  if (selectedCategories.length > 0) {
    params.categoryIds = selectedCategories;
  }

  if (activeFilters.includes("newest")) {
    params.sortBy = "created_at";
    params.sortOrder = "desc";
  }

  return params;
}

async function fetchLists(params: UnifiedSearchParams): Promise<ListItemDAO[]> {
  const response = await searchService.unifiedSearch(params);

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.data?.lists ?? [];
}

function listMatchesVibes(list: ListItemDAO, vibes: string[]): boolean {
  if (vibes.length === 0) return true;

  const normalizedVibes = vibes.map((v) => v.toLowerCase());
  return (list.items ?? []).some((item) =>
    (item.tags ?? []).some((tag) =>
      normalizedVibes.some((vibe) => tag.name.toLowerCase().includes(vibe)),
    ),
  );
}

function countMatchingLists(
  lists: ListItemDAO[],
  threshold: number | null,
): number {
  if (threshold === null) return lists.length;

  return lists.filter((list) => getListPersonalityMatch(list) >= threshold).length;
}

function countVibeMatchingLists(
  lists: ListItemDAO[],
  vibes: string[],
): number {
  if (vibes.length === 0) return lists.length;

  return lists.filter((list) => listMatchesVibes(list, vibes)).length;
}

export function useHomeLists(options: UseHomeListsOptions) {
  const queryClient = useQueryClient();
  const { coordinates: userCoordinates } = useUserCoordinates();
  const { categories: categoryCatalog } = useCategories();
  const enabled = options.enabled !== false;

  const effectiveCoordinates = useMemo((): EffectiveCoordinates | null => {
    if (options.skipLocationFilter) {
      return null;
    }

    if (options.locationOverride) {
      return {
        latitude: options.locationOverride.latitude,
        longitude: options.locationOverride.longitude,
      };
    }

    if (userCoordinates) {
      return {
        latitude: userCoordinates.latitude,
        longitude: userCoordinates.longitude,
      };
    }

    return null;
  }, [options.locationOverride, options.skipLocationFilter, userCoordinates]);

  const searchParams = useMemo(
    () => buildSearchParams(options, effectiveCoordinates),
    [options, effectiveCoordinates],
  );

  const filterQueryKey = useMemo(
    () => [
      options.activeFilters,
      options.matchThreshold,
      options.skipLocationFilter,
      options.locationOverride?.latitude,
      options.locationOverride?.longitude,
      options.selectedVibes,
      options.selectedCategories,
      effectiveCoordinates?.latitude,
      effectiveCoordinates?.longitude,
    ],
    [options, effectiveCoordinates],
  );

  const discoverQuery = useQuery({
    queryKey: ["home-lists-discover", ...filterQueryKey],
    queryFn: () => fetchLists(searchParams),
    enabled,
    staleTime: FEED_STALE_TIME_MS,
  });

  const nearYouSearchParams = useMemo((): UnifiedSearchParams => {
    return {
      ...searchParams,
      radiusKm: NEAR_YOU_RADIUS_KM,
      sortBy: "created_at",
      sortOrder: "desc",
    };
  }, [searchParams]);

  const nearYouQuery = useQuery({
    queryKey: ["home-lists-near-you", ...filterQueryKey],
    queryFn: async () => {
      const lists = await fetchLists(nearYouSearchParams);
      return lists.filter((list) => isCreatedToday(list.created_at));
    },
    enabled: enabled && effectiveCoordinates !== null,
    staleTime: FEED_STALE_TIME_MS,
  });

  const nearYouLists = nearYouQuery.data ?? [];
  const nearYouIds = useMemo(
    () => new Set(nearYouLists.map((list) => list.id)),
    [nearYouLists],
  );

  const discoverListsRaw = useMemo(() => {
    const lists = discoverQuery.data ?? [];
    return lists.filter((list) => !nearYouIds.has(list.id));
  }, [discoverQuery.data, nearYouIds]);

  const { forYouLists, topMatchPercent } = useMemo(() => {
    const scored = discoverListsRaw
      .map((list) => ({
        list,
        match: getListMatchPercent(list),
      }))
      .sort((a, b) => (b.match ?? 0) - (a.match ?? 0));

    const topLists = scored.slice(0, FOR_YOU_LIMIT).map((entry) => entry.list);
    const topMatch = scored[0]?.match ?? null;

    return {
      forYouLists: topLists,
      topMatchPercent: topMatch,
    };
  }, [discoverListsRaw]);

  const forYouIds = useMemo(
    () => new Set(forYouLists.map((list) => list.id)),
    [forYouLists],
  );

  const discoverLists = useMemo(
    () => discoverListsRaw.filter((list) => !forYouIds.has(list.id)),
    [discoverListsRaw, forYouIds],
  );

  const unfilteredDiscoverLists = discoverQuery.data ?? [];

  const matchingCount = useMemo(
    () => countMatchingLists(unfilteredDiscoverLists, options.matchThreshold),
    [unfilteredDiscoverLists, options.matchThreshold],
  );

  const vibeMatchCount = useMemo(
    () => countVibeMatchingLists(unfilteredDiscoverLists, options.selectedVibes),
    [unfilteredDiscoverLists, options.selectedVibes],
  );

  const getMatchingCount = useCallback(
    (threshold: number | null) =>
      countMatchingLists(unfilteredDiscoverLists, threshold),
    [unfilteredDiscoverLists],
  );

  const getVibeMatchCount = useCallback(
    (vibes: string[]) => countVibeMatchingLists(unfilteredDiscoverLists, vibes),
    [unfilteredDiscoverLists],
  );

  const categoryMatchCount = useMemo(
    () =>
      countCategoryMatchingLists(
        unfilteredDiscoverLists,
        categoryCatalog,
        options.selectedCategories,
      ),
    [unfilteredDiscoverLists, categoryCatalog, options.selectedCategories],
  );

  const getCategoryMatchCount = useCallback(
    (categoryIds: string[]) =>
      countCategoryMatchingLists(
        unfilteredDiscoverLists,
        categoryCatalog,
        categoryIds,
      ),
    [unfilteredDiscoverLists, categoryCatalog],
  );

  const isLoading =
    enabled && discoverQuery.isPending && discoverQuery.data === undefined;

  const error =
    discoverQuery.error?.message ?? nearYouQuery.error?.message ?? null;

  const refetch = async () => {
    await Promise.all([
      discoverQuery.refetch(),
      effectiveCoordinates ? nearYouQuery.refetch() : Promise.resolve(),
      queryClient.invalidateQueries({ queryKey: ["similar-scores"] }),
    ]);
  };

  const showNearYouSection =
    effectiveCoordinates !== null && nearYouLists.length > 0;

  return {
    nearYouLists,
    forYouLists,
    topMatchPercent,
    discoverLists,
    isLoading,
    isRefetching:
      discoverQuery.isRefetching ||
      (effectiveCoordinates ? nearYouQuery.isRefetching : false),
    error,
    refetch,
    hasCoordinates: effectiveCoordinates !== null,
    showNearYouSection,
    matchingCount,
    vibeMatchCount,
    categoryMatchCount,
    getMatchingCount,
    getVibeMatchCount,
    getCategoryMatchCount,
  };
}
