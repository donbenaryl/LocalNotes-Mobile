import { useQuery } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import { briefRefetchInterval, briefStaleTime, isBriefQueryEnabled } from '@/utils/briefPolling';
import type { BusinessMonthlyReportDAO } from '@/http/business-api/types';

export function businessMonthlyReportQueryKey(businessId: string) {
  return ['business-monthly-report', businessId] as const;
}

export interface UseBusinessMonthlyReportOptions {
  businessId: string;
  isPaidMember: boolean;
  /** Extra gate (e.g. only fetch while the report sheet is open). Defaults to true. */
  enabled?: boolean;
}

/** The latest closed-month report. Polls only while `building`. Paid members only. */
export function useBusinessMonthlyReport({
  businessId,
  isPaidMember,
  enabled = true,
}: UseBusinessMonthlyReportOptions) {
  return useQuery({
    queryKey: businessMonthlyReportQueryKey(businessId),
    queryFn: async (): Promise<BusinessMonthlyReportDAO> => {
      const response = await businessService.getMonthlyReport(businessId);
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.data) throw new Error('Empty monthly report response');
      return response.data.data;
    },
    enabled: enabled && isBriefQueryEnabled(businessId, isPaidMember),
    staleTime: briefStaleTime,
    refetchInterval: briefRefetchInterval,
  });
}
