import { useQuery } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import type { BusinessMentionWeekdaysDAO } from '@/http/business-api/types';

export const MENTION_WEEKDAYS_QUERY_KEY = 'business-mention-weekdays';

const STALE_TIME_MS = 60 * 1000;

export function useMentionWeekdays(
  businessId: string | null | undefined,
  branchId: string | null | undefined,
) {
  return useQuery({
    queryKey: [MENTION_WEEKDAYS_QUERY_KEY, businessId, branchId],
    queryFn: async (): Promise<BusinessMentionWeekdaysDAO> => {
      const res = await businessService.getMentionWeekdays(businessId!, {
        branch_id: branchId!,
      });
      if (res.error || !res.data?.data) {
        throw new Error(res.error?.message ?? 'Failed to load mention weekdays');
      }
      return res.data.data;
    },
    enabled: Boolean(businessId && branchId),
    staleTime: STALE_TIME_MS,
  });
}
