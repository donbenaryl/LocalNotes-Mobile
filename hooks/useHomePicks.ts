import { useCallback, useMemo } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import listService from "@/http/list-api/list.service";
import type { ListItemPublic, Location as GeoLocation } from "@/http/list-api/types";
import type { HomeListFilter } from "@/components/PageComponents/Home/Home/HomeFilterHeader";
import type { MatchPriorities } from "@/components/ui/MatchThreshhold";
import { useCategories } from "@/hooks/useProfileList";
import { useUserCoordinates } from "@/hooks/useUserCoordinates";
import { isCreatedToday } from "@/utils/time";
import { personalitySidesFromPriorities } from "@/utils/personalityQuiz";
import {
  countCategoryMatchingPublicPicks,
  countMatchingPublicPicks,
  countVibeMatchingPublicPicks,
  getPickMatchPercent,
} from "@/utils/homePicks";
import {
  FEED_MAX_POOL,
  FEED_PAGE_SIZE_PICKS,
} from "@/constants/feedPagination";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";

const NEAR_YOU_RADIUS_KM = 5;
const DEFAULT_RADIUS_KM = 15;
const FOR_YOU_LIMIT = 6;

export interface UseHomePicksOptions {
  activeFilters: HomeListFilter[];
  matchThreshold: number | null;
  matchPriorities?: MatchPriorities;
  locationOverride: GeoLocation | null;
  skipLocationFilter?: boolean;
  selectedVibes: string[];
  selectedCategories: string[];
  /** When false, queries stay idle (Home lists mode). */
  enabled?: boolean;
}

interface EffectiveCoordinates {
  latitude: number;
  longitude: number;
}

type ListItemsParams = NonNullable<Parameters<typeof listService.fetchListItems>[0]>;

function buildPickParams(
  options: UseHomePicksOptions,
  coordinates: EffectiveCoordinates | null,
  radiusKm: number,
): Omit<ListItemsParams, "limit" | "offset"> {
  const { matchThreshold, selectedVibes, selectedCategories } = options;

  const params: Omit<ListItemsParams, "limit" | "offset"> = {
    scope: "all",
  };

  const personalitySides = personalitySidesFromPriorities(
    options.matchPriorities ?? {},
  );
  if (personalitySides.length > 0) {
    params.personality_sides = personalitySides;
  }

  if (coordinates) {
    params.latitude = coordinates.latitude;
    params.longitude = coordinates.longitude;
    params.radius_km = radiusKm;
  }

  if (matchThreshold !== null) {
    params.match_min = matchThreshold;
  }

  if (selectedVibes.length > 0) {
    params.vibes = selectedVibes;
  }

  if (selectedCategories.length > 0) {
    params.category_ids = selectedCategories;
  }

  return params;
}

async function fetchPicks(params: ListItemsParams): Promise<ListItemPublic[]> {
  const response = await listService.fetchListItems(params);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data?.data ?? [];
}

export function useHomePicks(options: UseHomePicksOptions) {
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

  const discoverRadiusKm = options.activeFilters.includes("distance")
    ? NEAR_YOU_RADIUS_KM
    : DEFAULT_RADIUS_KM;

  const discoverParams = useMemo(
    () => buildPickParams(options, effectiveCoordinates, discoverRadiusKm),
    [options, effectiveCoordinates, discoverRadiusKm],
  );

  const nearYouParams = useMemo(
    (): ListItemsParams => ({
      ...buildPickParams(options, effectiveCoordinates, NEAR_YOU_RADIUS_KM),
      limit: FEED_PAGE_SIZE_PICKS,
    }),
    [options, effectiveCoordinates],
  );

  const filterQueryKey = useMemo(
    () => [
      options.activeFilters,
      options.matchThreshold,
      discoverParams.personality_sides,
      options.skipLocationFilter,
      options.locationOverride?.latitude,
      options.locationOverride?.longitude,
      options.selectedVibes,
      options.selectedCategories,
      effectiveCoordinates?.latitude,
      effectiveCoordinates?.longitude,
      discoverRadiusKm,
    ],
    [options, effectiveCoordinates, discoverRadiusKm, discoverParams.personality_sides],
  );

  const discoverQuery = useInfiniteQuery({
    queryKey: ["home-picks-discover", ...filterQueryKey],
    queryFn: ({ pageParam }) =>
      fetchPicks({
        ...discoverParams,
        limit: FEED_PAGE_SIZE_PICKS,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((sum, page) => sum + page.length, 0);
      if (
        lastPage.length < FEED_PAGE_SIZE_PICKS ||
        totalLoaded >= FEED_MAX_POOL
      ) {
        return undefined;
      }
      return totalLoaded;
    },
    enabled,
    staleTime: FEED_STALE_TIME_MS,
  });

  const nearYouQuery = useQuery({
    queryKey: ["home-picks-near-you", ...filterQueryKey],
    queryFn: async () => {
      const picks = await fetchPicks(nearYouParams);
      return picks.filter(
        (pick) => pick.created_at != null && isCreatedToday(pick.created_at),
      );
    },
    enabled: enabled && effectiveCoordinates !== null,
    staleTime: FEED_STALE_TIME_MS,
  });

  const nearYouPicks = nearYouQuery.data ?? [];
  const nearYouIds = useMemo(
    () => new Set(nearYouPicks.map((pick) => pick.id)),
    [nearYouPicks],
  );

  const discoverPicksRaw = useMemo(() => {
    const picks = discoverQuery.data?.pages.flat() ?? [];
    return picks.filter((pick) => !nearYouIds.has(pick.id));
  }, [discoverQuery.data, nearYouIds]);

  const { forYouPicks, topMatchPercent } = useMemo(() => {
    const scored = discoverPicksRaw
      .map((pick) => ({
        pick,
        match: getPickMatchPercent(pick),
      }))
      .sort((a, b) => (b.match ?? 0) - (a.match ?? 0));

    const topPicks = scored.slice(0, FOR_YOU_LIMIT).map((entry) => entry.pick);
    const topMatch = scored[0]?.match ?? null;

    return {
      forYouPicks: topPicks,
      topMatchPercent: topMatch,
    };
  }, [discoverPicksRaw]);

  const forYouIds = useMemo(
    () => new Set(forYouPicks.map((pick) => pick.id)),
    [forYouPicks],
  );

  const discoverPicks = useMemo(
    () => discoverPicksRaw.filter((pick) => !forYouIds.has(pick.id)),
    [discoverPicksRaw, forYouIds],
  );

  const nearYouPicksExclusive = useMemo(
    () => nearYouPicks.filter((pick) => !forYouIds.has(pick.id)),
    [nearYouPicks, forYouIds],
  );

  const unfilteredDiscoverPicks = useMemo(
    () => discoverQuery.data?.pages.flat() ?? [],
    [discoverQuery.data],
  );

  const matchingCount = useMemo(
    () =>
      countMatchingPublicPicks(
        unfilteredDiscoverPicks,
        options.matchThreshold,
        options.selectedVibes,
      ),
    [unfilteredDiscoverPicks, options.matchThreshold, options.selectedVibes],
  );

  const vibeMatchCount = useMemo(
    () =>
      countVibeMatchingPublicPicks(
        unfilteredDiscoverPicks,
        options.selectedVibes,
      ),
    [unfilteredDiscoverPicks, options.selectedVibes],
  );

  const categoryMatchCount = useMemo(
    () =>
      countCategoryMatchingPublicPicks(
        unfilteredDiscoverPicks,
        categoryCatalog,
        options.selectedCategories,
      ),
    [unfilteredDiscoverPicks, categoryCatalog, options.selectedCategories],
  );

  const getMatchingCount = useCallback(
    (threshold: number | null) =>
      countMatchingPublicPicks(
        unfilteredDiscoverPicks,
        threshold,
        options.selectedVibes,
      ),
    [unfilteredDiscoverPicks, options.selectedVibes],
  );

  const getVibeMatchCount = useCallback(
    (vibes: string[]) =>
      countVibeMatchingPublicPicks(unfilteredDiscoverPicks, vibes),
    [unfilteredDiscoverPicks],
  );

  const getCategoryMatchCount = useCallback(
    (categoryIds: string[]) =>
      countCategoryMatchingPublicPicks(
        unfilteredDiscoverPicks,
        categoryCatalog,
        categoryIds,
      ),
    [unfilteredDiscoverPicks, categoryCatalog],
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
    effectiveCoordinates !== null && nearYouPicksExclusive.length > 0;

  return {
    forYouPicks,
    topMatchPercent,
    nearYouPicks: nearYouPicksExclusive,
    discoverPicks,
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
