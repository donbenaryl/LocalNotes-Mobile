import { useQuery } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import { briefRefetchInterval, briefStaleTime, isBriefQueryEnabled } from '@/utils/briefPolling';
import type { BusinessWeeklyBriefDAO } from '@/http/business-api/types';

export function businessWeeklyBriefQueryKey(
  businessId: string,
  dateFrom?: string,
  dateTo?: string,
) {
  return ['business-weekly-brief', businessId, dateFrom ?? null, dateTo ?? null] as const;
}

export interface UseBusinessWeeklyBriefOptions {
  businessId: string;
  isPaidMember: boolean;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * The weekly brief for Business Home. Both THIS WEEK and NEXT ACTIONS read it, so the
 * overview page calls this once and passes `brief` down (a single request).
 * When dateFrom/dateTo are set, the API returns the most recent brief intersecting that range.
 */
export function useBusinessWeeklyBrief({
  businessId,
  isPaidMember,
  dateFrom,
  dateTo,
}: UseBusinessWeeklyBriefOptions) {
  return useQuery({
    queryKey: businessWeeklyBriefQueryKey(businessId, dateFrom, dateTo),
    queryFn: async (): Promise<BusinessWeeklyBriefDAO> => {
      const range =
        dateFrom && dateTo ? { date_from: dateFrom, date_to: dateTo } : undefined;
      const response = await businessService.getWeeklyBrief(businessId, range);
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.data) throw new Error('Empty weekly brief response');
      return response.data.data;
    },
    enabled: isBriefQueryEnabled(businessId, isPaidMember),
    staleTime: briefStaleTime,
    refetchInterval: briefRefetchInterval,
  });
}
