import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import businessService from "@/http/business-api/business.service";
import type { BusinessItemDAO, searchBusinessDTO } from "@/http/business-api/types";
import type { Location as GeoLocation } from "@/http/list-api/types";
import type { HomeListFilter } from "@/components/PageComponents/Home/Home/HomeFilterHeader";
import { useUserCoordinates } from "@/hooks/useUserCoordinates";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";
import { dedupeById } from "@/utils/dedupeById";

const NEAR_YOU_RADIUS_KM = 5;
const DEFAULT_RADIUS_KM = 15;
const PAGE_SIZE = 20;

export interface UseHomeBusinessesOptions {
  activeFilters: HomeListFilter[];
  locationOverride: GeoLocation | null;
  skipLocationFilter?: boolean;
  /** When false, queries stay idle (Home lists/picks mode). */
  enabled?: boolean;
}

interface BusinessPage {
  businesses: BusinessItemDAO[];
  next: number | null;
}

async function fetchBusinessPage(params: searchBusinessDTO): Promise<BusinessPage> {
  const response = await businessService.searchBusiness(params);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return {
    businesses: response.data?.data ?? [],
    next: response.data?.pagination?.next ?? null,
  };
}

export function useHomeBusinesses(options: UseHomeBusinessesOptions) {
  const { coordinates: userCoordinates } = useUserCoordinates();
  const enabled = options.enabled !== false;
  const isDistance = options.activeFilters.includes("distance");

  const params = useMemo((): searchBusinessDTO => {
    if (options.skipLocationFilter) return {};

    const coordinates = options.locationOverride ?? userCoordinates;
    if (!coordinates) return {};

    return {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      radiusKm: isDistance ? NEAR_YOU_RADIUS_KM : DEFAULT_RADIUS_KM,
    };
  }, [options.skipLocationFilter, options.locationOverride, userCoordinates, isDistance]);

  const query = useInfiniteQuery({
    queryKey: [
      "home-businesses",
      params.latitude ?? null,
      params.longitude ?? null,
      params.radiusKm ?? null,
    ],
    queryFn: ({ pageParam }) =>
      fetchBusinessPage({ ...params, page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    enabled,
    staleTime: FEED_STALE_TIME_MS,
  });

  const businesses = useMemo(
    () => dedupeById(query.data?.pages.flatMap((page) => page.businesses) ?? []),
    [query.data],
  );

  return {
    businesses,
    isLoading: enabled && query.isPending && query.data === undefined,
    isRefetching: query.isRefetching && !query.isFetchingNextPage,
    error: query.error?.message ?? null,
    refetch: async () => {
      await query.refetch();
    },
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
