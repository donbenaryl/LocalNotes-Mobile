import { keepPreviousData, useQuery } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import type { HttpServiceResolverDTO } from '@/http';
import { buildingRefetchInterval, insightsStaleTime } from '@/utils/insightsPolling';
import type {
  BusinessCustomerInsightsDAO,
  BusinessDemandInsightsDAO,
  BusinessInsightsParams,
  BusinessInsightsTab,
  BusinessInsightsWindow,
  BusinessPerformanceInsightsDAO,
} from '@/http/business-api/types';

type BusinessInsightsDetailByTab = {
  customers: BusinessCustomerInsightsDAO;
  demand: BusinessDemandInsightsDAO;
  performance: BusinessPerformanceInsightsDAO;
};

const DETAIL_FETCHERS: {
  [T in BusinessInsightsTab]: (
    businessId: string,
    params: BusinessInsightsParams,
  ) => HttpServiceResolverDTO<BusinessInsightsDetailByTab[T]>;
} = {
  customers: (businessId, params) => businessService.getCustomersInsightsDetail(businessId, params),
  demand: (businessId, params) => businessService.getDemandInsightsDetail(businessId, params),
  performance: (businessId, params) =>
    businessService.getPerformanceInsightsDetail(businessId, params),
};

export function businessInsightsDetailQueryKey(
  tab: BusinessInsightsTab,
  businessId: string,
  window: BusinessInsightsWindow,
) {
  return ['business-insights-detail', tab, businessId, window] as const;
}

export interface UseBusinessInsightsDetailOptions<T extends BusinessInsightsTab> {
  tab: T;
  businessId: string;
  window: BusinessInsightsWindow;
}

/**
 * Detail (`detail=1`) payload for one insights tab. Shares the `building` stale time and
 * poll cap with `useBusinessInsights`. The customers screen pages keywords through
 * `useBusinessCustomersDetail` instead.
 */
export function useBusinessInsightsDetail<T extends BusinessInsightsTab>({
  tab,
  businessId,
  window,
}: UseBusinessInsightsDetailOptions<T>) {
  return useQuery({
    queryKey: businessInsightsDetailQueryKey(tab, businessId, window),
    queryFn: async (): Promise<BusinessInsightsDetailByTab[T]> => {
      const response = await DETAIL_FETCHERS[tab](businessId, { window });
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.data) throw new Error('Empty insights detail response');
      return response.data.data as BusinessInsightsDetailByTab[T];
    },
    enabled: Boolean(businessId),
    staleTime: insightsStaleTime,
    placeholderData: keepPreviousData,
    refetchInterval: buildingRefetchInterval,
  });
}
