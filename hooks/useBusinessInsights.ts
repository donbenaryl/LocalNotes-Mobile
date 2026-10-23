import { useEffect } from 'react';
import {
  keepPreviousData,
  queryOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import type { HttpServiceResolverDTO } from '@/http';
import { INSIGHTS_STALE_TIME_MS } from '@/constants/queryCache';
import type {
  BusinessCustomerInsightsDAO,
  BusinessDemandInsightsDAO,
  BusinessInsightStatus,
  BusinessInsightsParams,
  BusinessInsightsTab,
  BusinessInsightsWindow,
  BusinessPerformanceInsightsDAO,
} from '@/http/business-api/types';

const BUILDING_POLL_INTERVAL_MS = 10_000;
/** ~1 minute of polling; after that the nightly job or a manual refetch takes over. */
const BUILDING_MAX_POLLS = 6;

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

type InsightsQueryState = {
  state: {
    data?: { status: BusinessInsightStatus };
    dataUpdateCount: number;
    errorUpdateCount: number;
  };
};

/** A `building` tab must not sit in cache as fresh for 30 minutes. */
function insightsStaleTime(query: InsightsQueryState) {
  return query.state.data?.status === 'building' ? 0 : INSIGHTS_STALE_TIME_MS;
}

function buildingRefetchInterval(query: InsightsQueryState) {
  if (query.state.data?.status !== 'building') return false;
  const attempts = query.state.dataUpdateCount + query.state.errorUpdateCount;
  return attempts <= BUILDING_MAX_POLLS ? BUILDING_POLL_INTERVAL_MS : false;
}

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
