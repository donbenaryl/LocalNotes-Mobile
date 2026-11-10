import { useQuery } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import { businessBriefActionsQueryKey } from '@/hooks/useBriefActionMutations';
import { INSIGHTS_STALE_TIME_MS } from '@/constants/queryCache';
import type { BusinessBriefActionsListDAO } from '@/http/business-api/types';

export interface UseBriefActionsOptions {
  businessId: string;
  enabled: boolean;
  limit?: number;
}

/** Active and past plans for the plans sheet. Fetched only while the sheet is open. */
export function useBriefActions({ businessId, enabled, limit = 10 }: UseBriefActionsOptions) {
  return useQuery<BusinessBriefActionsListDAO>({
    queryKey: [...businessBriefActionsQueryKey(businessId), limit],
    queryFn: async (): Promise<BusinessBriefActionsListDAO> => {
      const response = await businessService.listBriefActions(businessId, limit);
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.data) throw new Error('Empty brief actions response');
      return response.data.data;
    },
    enabled: Boolean(businessId) && enabled,
    staleTime: INSIGHTS_STALE_TIME_MS,
  });
}
