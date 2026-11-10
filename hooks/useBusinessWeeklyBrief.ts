import { useQuery } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import { briefRefetchInterval, briefStaleTime, isBriefQueryEnabled } from '@/utils/briefPolling';
import type { BusinessWeeklyBriefDAO } from '@/http/business-api/types';

export function businessWeeklyBriefQueryKey(businessId: string) {
  return ['business-weekly-brief', businessId] as const;
}

export interface UseBusinessWeeklyBriefOptions {
  businessId: string;
  isPaidMember: boolean;
}

/**
 * The weekly brief for Business Home. Both THIS WEEK and NEXT ACTIONS read it, so the
 * overview page calls this once and passes `brief` down (a single request).
 */
export function useBusinessWeeklyBrief({ businessId, isPaidMember }: UseBusinessWeeklyBriefOptions) {
  return useQuery({
    queryKey: businessWeeklyBriefQueryKey(businessId),
    queryFn: async (): Promise<BusinessWeeklyBriefDAO> => {
      const response = await businessService.getWeeklyBrief(businessId);
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.data) throw new Error('Empty weekly brief response');
      return response.data.data;
    },
    enabled: isBriefQueryEnabled(businessId, isPaidMember),
    staleTime: briefStaleTime,
    refetchInterval: briefRefetchInterval,
  });
}
