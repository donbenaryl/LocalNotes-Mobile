import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import spotlightBidsService from '@/http/spotlight-api/spotlight-bids.service';
import type { SpotlightBidRoundDAO } from '@/http/spotlight-api/type';
import { FEED_STALE_TIME_MS } from '@/constants/queryCache';
import { useBusinessStore } from '@/stores/useBusinessStore';

const OPEN_ROUND_REFETCH_MS = 30_000;

export const SPOTLIGHT_BID_CITIES_KEY = 'spotlight-bid-cities';
export const SPOTLIGHT_BID_ROUND_KEY = 'spotlight-bid-round';

async function fetchCities(businessId: string): Promise<string[]> {
  const response = await spotlightBidsService.fetchCities(businessId);
  if (response.error) throw new Error(response.error.message);
  return response.data?.data ?? [];
}

async function fetchRound(businessId: string, city: string): Promise<SpotlightBidRoundDAO> {
  const response = await spotlightBidsService.fetchRound(businessId, city);
  if (response.error) throw new Error(response.error.message);
  if (!response.data?.data) throw new Error('Empty spotlight round');
  return response.data.data;
}

/** Current (upcoming) spotlight bidding round for the active business. */
export function useSpotlightBidRound() {
  const businessId = useBusinessStore((s) => s.businessId);
  const branchCity = useBusinessStore((s) => {
    const branches = s.businessInfo?.branches ?? [];
    const branch = branches.find((b) => b.id === s.selectedBranchId) ?? branches[0];
    return branch?.location?.city;
  });

  const citiesQuery = useQuery({
    queryKey: [SPOTLIGHT_BID_CITIES_KEY, businessId],
    queryFn: () => fetchCities(businessId),
    enabled: Boolean(businessId),
    staleTime: FEED_STALE_TIME_MS,
  });

  const cities = citiesQuery.data;
  const city =
    cities?.find((c) => c.toLowerCase() === branchCity?.toLowerCase()) ?? cities?.[0];

  const roundQuery = useQuery({
    queryKey: [SPOTLIGHT_BID_ROUND_KEY, businessId, city],
    queryFn: () => fetchRound(businessId, city!),
    enabled: Boolean(businessId && city),
    // Bids are placed on the web, so always refetch on mount (tab switch).
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: (query) =>
      query.state.data?.status === 'open' ? OPEN_ROUND_REFETCH_MS : false,
  });

  const { refetch: refetchRound } = roundQuery;
  const roundEnabled = Boolean(businessId && city);
  // Coming back from the browser after bidding on web.
  useEffect(() => {
    if (!roundEnabled) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refetchRound();
    });
    return () => sub.remove();
  }, [roundEnabled, refetchRound]);

  const noCities = citiesQuery.isSuccess && !city;

  return {
    round: roundQuery.data,
    isLoading: citiesQuery.isPending || (Boolean(city) && roundQuery.isPending),
    isError: citiesQuery.isError || roundQuery.isError || noCities,
  };
}
