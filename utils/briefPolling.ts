import { INSIGHTS_STALE_TIME_MS } from '@/constants/queryCache';
import type { BusinessBriefStatus } from '@/http/business-api/types';
import { BUILDING_MAX_POLLS, BUILDING_POLL_INTERVAL_MS } from '@/utils/insightsPolling';

/** The slice of a TanStack query the brief polling helpers read. */
export type BriefQueryState = {
  state: {
    data?: { status: BusinessBriefStatus };
    dataUpdateCount: number;
    errorUpdateCount: number;
  };
};

/** A `building` brief must not sit in cache as fresh: the first brief may land any minute. */
export function briefStaleTime(query: BriefQueryState): number {
  return query.state.data?.status === 'building' ? 0 : INSIGHTS_STALE_TIME_MS;
}

/** Poll only while `building`, and stop after the same bound the insights tabs use. */
export function briefRefetchInterval(query: BriefQueryState): number | false {
  if (query.state.data?.status !== 'building') return false;
  const attempts = query.state.dataUpdateCount + query.state.errorUpdateCount;
  return attempts <= BUILDING_MAX_POLLS ? BUILDING_POLL_INTERVAL_MS : false;
}

/** The brief is paid-only; free owners never hit the endpoint (it would be a 403). */
export function isBriefQueryEnabled(businessId: string | undefined, isPaidMember: boolean): boolean {
  return Boolean(businessId) && isPaidMember;
}
