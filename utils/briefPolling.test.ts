import { INSIGHTS_STALE_TIME_MS } from '@/constants/queryCache';
import type { BusinessBriefStatus } from '@/http/business-api/types';
import { BUILDING_MAX_POLLS, BUILDING_POLL_INTERVAL_MS } from '@/utils/insightsPolling';
import {
  briefRefetchInterval,
  briefStaleTime,
  isBriefQueryEnabled,
  type BriefQueryState,
} from './briefPolling';

function query(
  status: BusinessBriefStatus | undefined,
  dataUpdateCount = 0,
  errorUpdateCount = 0,
): BriefQueryState {
  return {
    state: { data: status ? { status } : undefined, dataUpdateCount, errorUpdateCount },
  };
}

describe('briefRefetchInterval', () => {
  it('polls while building', () => {
    expect(briefRefetchInterval(query('building'))).toBe(BUILDING_POLL_INTERVAL_MS);
  });

  it('stops after the bound is passed', () => {
    expect(briefRefetchInterval(query('building', BUILDING_MAX_POLLS))).toBe(
      BUILDING_POLL_INTERVAL_MS,
    );
    expect(briefRefetchInterval(query('building', BUILDING_MAX_POLLS + 1))).toBe(false);
  });

  it('counts errors toward the bound', () => {
    expect(briefRefetchInterval(query('building', 3, BUILDING_MAX_POLLS - 2))).toBe(false);
  });

  it.each(['insight', 'quiet', 'insufficient_data'] as const)('does not poll for %s', (status) => {
    expect(briefRefetchInterval(query(status))).toBe(false);
  });

  it('does not poll before any data arrives', () => {
    expect(briefRefetchInterval(query(undefined))).toBe(false);
  });
});

describe('briefStaleTime', () => {
  it('is 0 while building', () => {
    expect(briefStaleTime(query('building'))).toBe(0);
  });

  it('uses the long window otherwise, including before data', () => {
    expect(briefStaleTime(query('insight'))).toBe(INSIGHTS_STALE_TIME_MS);
    expect(briefStaleTime(query('quiet'))).toBe(INSIGHTS_STALE_TIME_MS);
    expect(briefStaleTime(query(undefined))).toBe(INSIGHTS_STALE_TIME_MS);
  });
});

describe('isBriefQueryEnabled', () => {
  it('requires a business and a paid membership', () => {
    expect(isBriefQueryEnabled('b1', true)).toBe(true);
    expect(isBriefQueryEnabled('b1', false)).toBe(false);
    expect(isBriefQueryEnabled('', true)).toBe(false);
    expect(isBriefQueryEnabled(undefined, true)).toBe(false);
  });
});
