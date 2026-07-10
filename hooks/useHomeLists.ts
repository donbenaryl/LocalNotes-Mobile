import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import searchService from "@/http/search-api/search.service";
import type { UnifiedSearchParams } from "@/http/search-api/type";
import type { ListItemDAO, Location as GeoLocation } from "@/http/list-api/types";
import type { HomeListFilter } from "@/components/PageComponents/Home/Home/HomeFilterHeader";
import { useUserCoordinates } from "@/hooks/useUserCoordinates";
import { useUserSimilarityScores } from "@/hooks/useUserSimilarityScores";
import { useAuthStore } from "@/stores/useAuthStore";
import { isCreatedToday } from "@/utils/time";
import {
  countMatchingPicks,
  countVibeMatchingPicks,
  flattenListsToPicks,
  type HomeContentType,
} from "@/utils/homePicks";

const NEAR_YOU_RADIUS_KM = 5;
const DEFAULT_RADIUS_KM = 10;
const LIST_LIMIT = 25;
const FOR_YOU_LIMIT = 3;

export interface UseHomeListsOptions {
  activeFilters: HomeListFilter[];
  matchThreshold: number | null;
  locationOverride: GeoLocation | null;
  skipLocationFilter?: boolean;
  selectedVibes: string[];
  contentType?: HomeContentType;
}

interface EffectiveCoordinates {
  latitude: number;
  longitude: number;
}

function buildSearchParams(
  options: UseHomeListsOptions,
  coordinates: EffectiveCoordinates | null,
): UnifiedSearchParams {
  const { activeFilters, matchThreshold, selectedVibes } = options;

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
  matchByAccountId: Record<string, number | null>,
  threshold: number | null,
): number {
  if (threshold === null) return lists.length;

  return lists.filter(
    (list) => (matchByAccountId[list.account.id] ?? 0) >= threshold,
  ).length;
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
  const { user } = useAuthStore();
  const { coordinates: userCoordinates } = useUserCoordinates();

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
      effectiveCoordinates?.latitude,
      effectiveCoordinates?.longitude,
    ],
    [options, effectiveCoordinates],
  );

  const discoverQuery = useQuery({
    queryKey: ["home-lists-discover", ...filterQueryKey],
    queryFn: () => fetchLists(searchParams),
  });

  const nearYouSearchParams = useMemo(
    (): UnifiedSearchParams => ({
      ...searchParams,
      radiusKm: NEAR_YOU_RADIUS_KM,
      sortBy: "created_at",
      sortOrder: "desc",
    }),
    [searchParams],
  );

  const nearYouQuery = useQuery({
    queryKey: ["home-lists-near-you", ...filterQueryKey],
    queryFn: async () => {
      const lists = await fetchLists(nearYouSearchParams);
      return lists.filter((list) => isCreatedToday(list.created_at));
    },
    enabled: effectiveCoordinates !== null,
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

  const accountIds = useMemo(
    () => [
      ...nearYouLists.map((list) => list.account.id),
      ...discoverListsRaw.map((list) => list.account.id),
    ],
    [nearYouLists, discoverListsRaw],
  );

  const listsLoaded = !discoverQuery.isPending;
  const { matchByAccountId } = useUserSimilarityScores({
    accountIds,
    currentUserId: user?.id,
    enabled: listsLoaded && accountIds.length > 0,
  });

  const { forYouLists, topMatchPercent } = useMemo(() => {
    const scored = discoverListsRaw
      .map((list) => ({
        list,
        match: matchByAccountId[list.account.id] ?? null,
      }))
      .sort((a, b) => (b.match ?? 0) - (a.match ?? 0));

    const topLists = scored.slice(0, FOR_YOU_LIMIT).map((entry) => entry.list);
    const topMatch = scored[0]?.match ?? null;

    return {
      forYouLists: topLists,
      topMatchPercent: topMatch,
    };
  }, [discoverListsRaw, matchByAccountId]);

  const forYouIds = useMemo(
    () => new Set(forYouLists.map((list) => list.id)),
    [forYouLists],
  );

  const discoverLists = useMemo(
    () => discoverListsRaw.filter((list) => !forYouIds.has(list.id)),
    [discoverListsRaw, forYouIds],
  );

  const { forYouPicks, nearYouPicks, discoverPicks } = useMemo(() => {
    const forYou = flattenListsToPicks(
      forYouLists,
      options.selectedVibes,
    );
    const forYouPickIds = new Set(forYou.map((pick) => pick.id));

    const nearYou = flattenListsToPicks(
      nearYouLists,
      options.selectedVibes,
      forYouPickIds,
    );
    const nearYouPickIds = new Set([
      ...forYouPickIds,
      ...nearYou.map((pick) => pick.id),
    ]);

    const discover = flattenListsToPicks(
      discoverLists,
      options.selectedVibes,
      nearYouPickIds,
    );

    return {
      forYouPicks: forYou,
      nearYouPicks: nearYou,
      discoverPicks: discover,
    };
  }, [
    forYouLists,
    nearYouLists,
    discoverLists,
    options.selectedVibes,
  ]);

  const unfilteredDiscoverLists = discoverQuery.data ?? [];
  const contentType = options.contentType ?? "lists";

  const matchingCount = useMemo(() => {
    if (contentType === "picks") {
      return countMatchingPicks(
        unfilteredDiscoverLists,
        matchByAccountId,
        options.matchThreshold,
        options.selectedVibes,
      );
    }
    return countMatchingLists(
      unfilteredDiscoverLists,
      matchByAccountId,
      options.matchThreshold,
    );
  }, [
    contentType,
    unfilteredDiscoverLists,
    matchByAccountId,
    options.matchThreshold,
    options.selectedVibes,
  ]);

  const vibeMatchCount = useMemo(() => {
    if (contentType === "picks") {
      return countVibeMatchingPicks(
        unfilteredDiscoverLists,
        options.selectedVibes,
      );
    }
    return countVibeMatchingLists(unfilteredDiscoverLists, options.selectedVibes);
  }, [contentType, unfilteredDiscoverLists, options.selectedVibes]);

  const getMatchingCount = useCallback(
    (threshold: number | null) => {
      if (contentType === "picks") {
        return countMatchingPicks(
          unfilteredDiscoverLists,
          matchByAccountId,
          threshold,
          options.selectedVibes,
        );
      }
      return countMatchingLists(unfilteredDiscoverLists, matchByAccountId, threshold);
    },
    [
      contentType,
      unfilteredDiscoverLists,
      matchByAccountId,
      options.selectedVibes,
    ],
  );

  const getVibeMatchCount = useCallback(
    (vibes: string[]) => {
      if (contentType === "picks") {
        return countVibeMatchingPicks(unfilteredDiscoverLists, vibes);
      }
      return countVibeMatchingLists(unfilteredDiscoverLists, vibes);
    },
    [contentType, unfilteredDiscoverLists],
  );

  const isLoading =
    discoverQuery.isPending ||
    discoverQuery.isFetching ||
    (effectiveCoordinates !== null &&
      (nearYouQuery.isPending || nearYouQuery.isFetching));

  const error =
    discoverQuery.error?.message ??
    nearYouQuery.error?.message ??
    null;

  const refetch = async () => {
    await Promise.all([
      discoverQuery.refetch(),
      effectiveCoordinates ? nearYouQuery.refetch() : Promise.resolve(),
      queryClient.invalidateQueries({ queryKey: ["similar-scores"] }),
    ]);
  };

  const showNearYouSection =
    effectiveCoordinates !== null &&
    (contentType === "picks" ? nearYouPicks.length > 0 : nearYouLists.length > 0);

  return {
    nearYouLists,
    forYouLists,
    topMatchPercent,
    discoverLists,
    forYouPicks,
    nearYouPicks,
    discoverPicks,
    isLoading,
    error,
    refetch,
    hasCoordinates: effectiveCoordinates !== null,
    showNearYouSection,
    matchingCount,
    vibeMatchCount,
    getMatchingCount,
    getVibeMatchCount,
  };
}
