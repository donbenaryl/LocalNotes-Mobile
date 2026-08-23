import { useCallback, useMemo } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import listService from "@/http/list-api/list.service";
import type { ListItemDAO, Location as GeoLocation, serchDTO } from "@/http/list-api/types";
import type { HomeListFilter } from "@/components/PageComponents/Home/Home/HomeFilterHeader";
import type { MatchPriorities } from "@/components/ui/MatchThreshhold";
import { useCategories } from "@/hooks/useProfileList";
import { useUserCoordinates } from "@/hooks/useUserCoordinates";
import { isCreatedToday } from "@/utils/time";
import { personalitySidesFromPriorities } from "@/utils/personalityQuiz";
import {
  countCategoryMatchingLists,
  getListPersonalityMatch,
} from "@/utils/homePicks";
import {
  FEED_MAX_POOL,
  FEED_PAGE_SIZE_LISTS,
} from "@/constants/feedPagination";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";
import { dedupeById } from "@/utils/dedupeById";

const NEAR_YOU_RADIUS_KM = 5;
const DEFAULT_RADIUS_KM = 15;

export interface UseHomeListsOptions {
  activeFilters: HomeListFilter[];
  matchThreshold: number | null;
  matchPriorities?: MatchPriorities;
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
): Omit<serchDTO, "limit" | "offset"> {
  const { activeFilters, matchThreshold, selectedVibes, selectedCategories } = options;

  const params: Omit<serchDTO, "limit" | "offset"> = {};

  const personalitySides = personalitySidesFromPriorities(
    options.matchPriorities ?? {},
  );
  if (personalitySides.length > 0) {
    params.personalitySides = personalitySides;
  }

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
    params.vibe = selectedVibes;
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

async function fetchLists(params: serchDTO): Promise<ListItemDAO[]> {
  const response = await listService.searchLists(params);

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.data ?? [];
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
      searchParams.personalitySides,
      options.skipLocationFilter,
      options.locationOverride?.latitude,
      options.locationOverride?.longitude,
      options.selectedVibes,
      options.selectedCategories,
      effectiveCoordinates?.latitude,
      effectiveCoordinates?.longitude,
    ],
    [options, effectiveCoordinates, searchParams.personalitySides],
  );

  const discoverQuery = useInfiniteQuery({
    queryKey: ["home-lists-discover", ...filterQueryKey],
    queryFn: ({ pageParam }) =>
      fetchLists({
        ...searchParams,
        limit: FEED_PAGE_SIZE_LISTS,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.length < FEED_PAGE_SIZE_LISTS) return undefined;
      const nextOffset = lastPageParam + lastPage.length;
      if (nextOffset >= FEED_MAX_POOL) return undefined;
      return nextOffset;
    },
    enabled,
    staleTime: FEED_STALE_TIME_MS,
  });

  const nearYouSearchParams = useMemo((): serchDTO => {
    return {
      ...searchParams,
      limit: FEED_PAGE_SIZE_LISTS,
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
    const lists = dedupeById(discoverQuery.data?.pages.flat() ?? []);
    return lists.filter((list) => !nearYouIds.has(list.id));
  }, [discoverQuery.data, nearYouIds]);

  const discoverLists = discoverListsRaw;

  const unfilteredDiscoverLists = useMemo(
    () => dedupeById(discoverQuery.data?.pages.flat() ?? []),
    [discoverQuery.data],
  );

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
    forYouLists: [] as ListItemDAO[],
    topMatchPercent: null as number | null,
    discoverLists,
    isLoading,
    isRefetching:
      (discoverQuery.isRefetching && !discoverQuery.isFetchingNextPage) ||
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
    fetchNextPage: discoverQuery.fetchNextPage,
    hasNextPage: discoverQuery.hasNextPage ?? false,
    isFetchingNextPage: discoverQuery.isFetchingNextPage,
  };
}
