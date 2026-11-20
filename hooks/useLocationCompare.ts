import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import type {
  BusinessLocationCompareDAO,
  BusinessLocationCompareItemDAO,
  StatsDateRangeParams,
} from '@/http/business-api/types';
import { FEED_STALE_TIME_MS } from '@/constants/queryCache';

export function locationCompareQueryKey(
  businessId: string,
  params?: StatsDateRangeParams,
) {
  return ['business-location-compare', businessId, params?.date_from ?? '', params?.date_to ?? ''] as const;
}

export type LocationCompareInsight = {
  leader: BusinessLocationCompareItemDAO;
  laggard: BusinessLocationCompareItemDAO;
};

export function useLocationCompare(
  businessId: string | undefined,
  options?: { enabled?: boolean; params?: StatsDateRangeParams },
) {
  const enabled = Boolean(businessId) && (options?.enabled ?? true);
  const params = options?.params;
  const query = useQuery({
    queryKey: locationCompareQueryKey(businessId ?? '', params),
    queryFn: async (): Promise<BusinessLocationCompareDAO> => {
      const response = await businessService.getLocationCompareStats(
        businessId!,
        params,
      );
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.data) throw new Error('Empty location compare response');
      return response.data.data;
    },
    enabled,
    staleTime: FEED_STALE_TIME_MS,
  });

  const locations = useMemo(() => {
    const rows = query.data?.locations ?? [];
    return [...rows].sort((a, b) => b.mentions - a.mentions || b.pick_favorites - a.pick_favorites);
  }, [query.data?.locations]);

  const insight = useMemo((): LocationCompareInsight | null => {
    if (locations.length < 2) return null;
    const withMentions = locations.filter((row) => row.mentions > 0);
    if (withMentions.length < 2) return null;
    const leader = withMentions[0];
    const laggard = withMentions[withMentions.length - 1];
    if (leader.branch_id === laggard.branch_id) return null;
    if (leader.mentions === laggard.mentions) return null;
    return { leader, laggard };
  }, [locations]);

  return {
    locations,
    insight,
    isLoading: query.isPending && query.data === undefined,
    isError: query.isError,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
