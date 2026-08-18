import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import listService from "@/http/list-api/list.service";
import accountService from "@/http/account-api/account.services";
import type { MatchHistogramDAO } from "@/http/list-api/types";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";

export type MatchHistogramSurface = "lists" | "picks" | "people";

export interface MatchHistogramFilters {
  query?: string;
  vibes?: string[];
  /** TraitSide slugs; AND across all selected sides. Sides shrink the pool; match_min never does. */
  personalitySides?: string[];
  categoryIds?: string[];
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

const EMPTY_BINS = Array.from({ length: 20 }, () => 0);

async function fetchMatchHistogram(
  surface: MatchHistogramSurface,
  filters: MatchHistogramFilters,
): Promise<MatchHistogramDAO> {
  if (surface === "lists") {
    const response = await listService.fetchListsMatchHistogram({
      query: filters.query,
      vibe: filters.vibes,
      personalitySides: filters.personalitySides,
      categoryIds: filters.categoryIds,
      city: filters.city,
      region: filters.region,
      latitude: filters.latitude,
      longitude: filters.longitude,
      radiusKm: filters.radiusKm,
    });
    if (response.error) throw new Error(response.error.message);
    return response.data?.data ?? { bins: EMPTY_BINS, total: 0 };
  }

  if (surface === "picks") {
    const response = await listService.fetchPicksMatchHistogram({
      keyword: filters.query,
      vibes: filters.vibes,
      personality_sides: filters.personalitySides,
      category_ids: filters.categoryIds,
      city: filters.city,
      region: filters.region,
      latitude: filters.latitude,
      longitude: filters.longitude,
      radius_km: filters.radiusKm,
    });
    if (response.error) throw new Error(response.error.message);
    return response.data?.data ?? { bins: EMPTY_BINS, total: 0 };
  }

  const response = await accountService.fetchPeopleMatchHistogram({
    query: filters.query,
    personalitySides: filters.personalitySides,
    city: filters.city,
    region: filters.region,
    latitude: filters.latitude,
    longitude: filters.longitude,
    radiusKm: filters.radiusKm,
  });
  if (response.error) throw new Error(response.error.message);
  return response.data?.data ?? { bins: EMPTY_BINS, total: 0 };
}

/** Count items at or above a draft threshold from 20×5% histogram bins. */
export function countFromMatchHistogramBins(
  bins: number[] | null | undefined,
  threshold: number | null,
): number | undefined {
  if (!bins || bins.length === 0) return undefined;
  if (threshold === null || threshold === 0) {
    return bins.reduce((sum, n) => sum + n, 0);
  }
  let count = 0;
  for (let i = 0; i < bins.length; i += 1) {
    if (i * 5 >= threshold) count += bins[i] ?? 0;
  }
  return count;
}

export function useMatchHistogram(
  surface: MatchHistogramSurface,
  filters: MatchHistogramFilters,
  enabled: boolean,
) {
  const queryKey = useMemo(
    () => [
      "match-histogram",
      surface,
      filters.query ?? "",
      filters.vibes ?? [],
      filters.personalitySides ?? [],
      filters.categoryIds ?? [],
      filters.city ?? null,
      filters.region ?? null,
      filters.latitude ?? null,
      filters.longitude ?? null,
      filters.radiusKm ?? null,
    ],
    [surface, filters],
  );

  const query = useQuery({
    queryKey,
    queryFn: () => fetchMatchHistogram(surface, filters),
    enabled,
    staleTime: FEED_STALE_TIME_MS,
    placeholderData: keepPreviousData,
  });

  return {
    bins: query.data?.bins ?? null,
    total: query.data?.total ?? null,
    isLoading: query.isPending || query.isFetching,
    error: query.error?.message ?? null,
  };
}
