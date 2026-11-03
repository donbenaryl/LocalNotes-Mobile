import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import { buildingRefetchInterval, insightsStaleTime } from '@/utils/insightsPolling';
import { nextKeywordPage } from '@/utils/insightsPagination';
import { businessInsightsDetailQueryKey } from '@/hooks/useBusinessInsightsDetail';
import type {
  BusinessCustomerInsightsDAO,
  BusinessInsightsWindow,
} from '@/http/business-api/types';

export const CUSTOMER_KEYWORDS_PAGE_SIZE = 50;

/**
 * Customers detail with paged keywords. Every page response carries the full personality and
 * differentiators parts too; the screen reads those from the first page. Shares the
 * `building` stale time and poll cap with the other insights queries.
 */
export function useBusinessCustomersDetail(businessId: string, window: BusinessInsightsWindow) {
  return useInfiniteQuery({
    queryKey: [...businessInsightsDetailQueryKey('customers', businessId, window), 'pages'],
    queryFn: async ({ pageParam }): Promise<BusinessCustomerInsightsDAO> => {
      const response = await businessService.getCustomersInsightsDetail(businessId, {
        window,
        page: pageParam,
        page_size: CUSTOMER_KEYWORDS_PAGE_SIZE,
      });
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.data) throw new Error('Empty insights detail response');
      return response.data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const keywords = last.customer_detail?.keywords;
      if (!keywords || keywords.status !== 'ready') return undefined;
      const loaded = all.reduce(
        (sum, page) => sum + (page.customer_detail?.keywords.chips.length ?? 0),
        0,
      );
      return nextKeywordPage(keywords, loaded);
    },
    enabled: Boolean(businessId),
    staleTime: (query) => insightsStaleTime({ state: { ...query.state, data: query.state.data?.pages[0] } }),
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      buildingRefetchInterval({ state: { ...query.state, data: query.state.data?.pages[0] } }),
  });
}
