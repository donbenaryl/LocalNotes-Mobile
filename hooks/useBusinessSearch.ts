import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import businessService from "@/http/business-api/business.service";
import type { BusinessItemDAO, searchBusinessDTO } from "@/http/business-api/types";
import { useSearchStore } from "@/stores/useSearchStore";
import { useSearchChromeStore } from "@/stores/useSearchChromeStore";
import { useEffectiveSearchLocation } from "@/hooks/useEffectiveSearchLocation";

const DEFAULT_RADIUS_KM = 10;

async function fetchBusinessSearch(params: searchBusinessDTO): Promise<BusinessItemDAO[]> {
  const response = await businessService.searchBusiness(params);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data?.data ?? [];
}

/** Backs the Places search tab via GET /businesses/ (replaces the shared unified-search call). */
export function useBusinessSearch() {
  const committedQuery = useSearchStore((s) => s.committedQuery);
  const coordinates = useEffectiveSearchLocation();
  const setActiveResultCount = useSearchChromeStore((s) => s.setActiveResultCount);

  const params = useMemo((): searchBusinessDTO => {
    const p: searchBusinessDTO = { query: committedQuery };
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
  }, [committedQuery, coordinates]);

  const queryKey = useMemo(
    () => [
      "business-search",
      params.query ?? "",
      params.latitude ?? null,
      params.longitude ?? null,
      params.radiusKm ?? null,
      params.city ?? null,
      params.region ?? null,
    ],
    [params],
  );

  const businessQuery = useQuery({
    queryKey,
    queryFn: () => fetchBusinessSearch(params),
  });

  const businesses = businessQuery.data ?? [];

  useEffect(() => {
    setActiveResultCount(businesses.length);
  }, [businesses.length, setActiveResultCount]);

  return {
    businesses,
    isLoading: businessQuery.isPending || businessQuery.isFetching,
    isPending: businessQuery.isPending,
    error: businessQuery.error?.message ?? null,
    refetch: businessQuery.refetch,
  };
}
