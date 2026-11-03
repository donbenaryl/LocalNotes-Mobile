import { useEffect } from 'react';
import {
  keepPreviousData,
  queryOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
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

const INSIGHTS_TABS: BusinessInsightsTab[] = ['customers', 'demand', 'performance'];

type BusinessInsightsByTab = {
  customers: BusinessCustomerInsightsDAO;
  demand: BusinessDemandInsightsDAO;
  performance: BusinessPerformanceInsightsDAO;
};

const INSIGHTS_FETCHERS: {
  [T in BusinessInsightsTab]: (
    businessId: string,
    params: BusinessInsightsParams,
  ) => HttpServiceResolverDTO<BusinessInsightsByTab[T]>;
} = {
  customers: (businessId, params) => businessService.getCustomersInsights(businessId, params),
  demand: (businessId, params) => businessService.getDemandInsights(businessId, params),
  performance: (businessId, params) =>
    businessService.getPerformanceInsights(businessId, params),
};

export function businessInsightsQueryKey(
  tab: BusinessInsightsTab,
  businessId: string,
  window: BusinessInsightsWindow,
) {
  return ['business-insights', tab, businessId, window] as const;
}

function businessInsightsQueryOptions<T extends BusinessInsightsTab>(
  tab: T,
  businessId: string,
  window: BusinessInsightsWindow,
) {
  return queryOptions({
    queryKey: businessInsightsQueryKey(tab, businessId, window),
    queryFn: async (): Promise<BusinessInsightsByTab[T]> => {
      const response = await INSIGHTS_FETCHERS[tab](businessId, { window });
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.data) throw new Error('Empty insights response');
      return response.data.data;
    },
    staleTime: insightsStaleTime,
  });
}

export interface UseBusinessInsightsOptions {
  businessId: string;
  window: BusinessInsightsWindow;
  activeTab: BusinessInsightsTab;
}

/**
 * Lazy per-tab insights: only the visible tab fetches; once it resolves the other two
 * are prefetched so switching tabs is instant. The window is the caller's UI state.
 */
export function useBusinessInsights({
  businessId,
  window,
  activeTab,
}: UseBusinessInsightsOptions) {
  const queryClient = useQueryClient();
  const hasBusiness = Boolean(businessId);

  const customers = useQuery({
    ...businessInsightsQueryOptions('customers', businessId, window),
    enabled: hasBusiness && activeTab === 'customers',
    placeholderData: keepPreviousData,
    refetchInterval: buildingRefetchInterval,
  });

  const demand = useQuery({
    ...businessInsightsQueryOptions('demand', businessId, window),
    enabled: hasBusiness && activeTab === 'demand',
    placeholderData: keepPreviousData,
    refetchInterval: buildingRefetchInterval,
  });

  const performance = useQuery({
    ...businessInsightsQueryOptions('performance', businessId, window),
    enabled: hasBusiness && activeTab === 'performance',
    placeholderData: keepPreviousData,
    refetchInterval: buildingRefetchInterval,
  });

  const byTab = { customers, demand, performance };
  const active = byTab[activeTab];
  const activeResolved = active.isSuccess && !active.isPlaceholderData;

  useEffect(() => {
    if (!hasBusiness || !activeResolved) return;
    for (const tab of INSIGHTS_TABS) {
      if (tab === activeTab) continue;
      void queryClient.prefetchQuery(businessInsightsQueryOptions(tab, businessId, window));
    }
  }, [activeResolved, activeTab, businessId, hasBusiness, queryClient, window]);

  return { customers, demand, performance, active };
}
