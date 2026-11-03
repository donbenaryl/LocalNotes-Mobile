import type { BusinessInsightStatus } from '@/http/business-api/types';
import { INSIGHTS_STALE_TIME_MS } from '@/constants/queryCache';

export const BUILDING_POLL_INTERVAL_MS = 10_000;
/** ~1 minute of polling; after that the nightly job or a manual refetch takes over. */
export const BUILDING_MAX_POLLS = 6;

/** The slice of a TanStack query the polling helpers read. */
export type InsightsQueryState = {
  state: {
    data?: { status: BusinessInsightStatus };
    dataUpdateCount: number;
    errorUpdateCount: number;
  };
};

/** A `building` tab must not sit in cache as fresh for 30 minutes. */
export function insightsStaleTime(query: InsightsQueryState): number {
  return query.state.data?.status === 'building' ? 0 : INSIGHTS_STALE_TIME_MS;
}

export function buildingRefetchInterval(query: InsightsQueryState): number | false {
  if (query.state.data?.status !== 'building') return false;
  const attempts = query.state.dataUpdateCount + query.state.errorUpdateCount;
  return attempts <= BUILDING_MAX_POLLS ? BUILDING_POLL_INTERVAL_MS : false;
}
