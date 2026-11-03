import { keepPreviousData, useQuery } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import { INSIGHTS_STALE_TIME_MS } from '@/constants/queryCache';
import type {
  BusinessInsightInterpretationDAO,
  StatsDateRangeParams,
} from '@/http/business-api/types';
import { INTERPRETATION_QUERY_KEY, isNotEntitledError } from '@/utils/insightInterpretation';

const MAX_RETRIES = 3;

interface UseBusinessInterpretationOptions {
  businessId: string;
  range: StatsDateRangeParams;
  isPaidMember: boolean;
}

/** Rule-based "why did it change" summary for a paid business and date range. */
export function useBusinessInterpretation({
  businessId,
  range,
  isPaidMember,
}: UseBusinessInterpretationOptions) {
  return useQuery({
    queryKey: [INTERPRETATION_QUERY_KEY, businessId, range],
    queryFn: async (): Promise<BusinessInsightInterpretationDAO> => {
      const response = await businessService.getInsightInterpretation(businessId, range);
      if (response.error) {
        // Keep the HTTP status so a 403 can be told apart from a real failure.
        throw Object.assign(new Error(response.error.message), {
          statusCode: response.error.statusCode,
        });
      }
      if (!response.data?.data) throw new Error('Empty interpretation response');
      return response.data.data;
    },
    enabled: Boolean(businessId) && isPaidMember,
    staleTime: INSIGHTS_STALE_TIME_MS,
    placeholderData: keepPreviousData,
    retry: (failureCount, error) => !isNotEntitledError(error) && failureCount < MAX_RETRIES,
  });
}
