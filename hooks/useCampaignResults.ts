import { useQuery } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import type { BusinessCampaignResultsDAO } from '@/http/business-api/types';
import { FEED_STALE_TIME_MS } from '@/constants/queryCache';

export function campaignResultsQueryKey(businessId: string) {
  return ['business-campaign-results', businessId] as const;
}

export function useCampaignResults(
  businessId: string | undefined,
  options?: { enabled?: boolean },
) {
  const enabled = Boolean(businessId) && (options?.enabled ?? true);
  const query = useQuery({
    queryKey: campaignResultsQueryKey(businessId ?? ''),
    queryFn: async (): Promise<BusinessCampaignResultsDAO> => {
      const response = await businessService.getCampaignResults(businessId!);
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.data) throw new Error('Empty campaign results response');
      return response.data.data;
    },
    enabled,
    staleTime: FEED_STALE_TIME_MS,
  });

  return {
    campaign: query.data?.campaign ?? null,
    previous: query.data?.previous ?? null,
    insight: query.data?.insight ?? null,
    isLoading: query.isPending && query.data === undefined,
    isError: query.isError,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
