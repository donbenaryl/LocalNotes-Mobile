import { INSIGHTS_STALE_TIME_MS } from '@/constants/queryCache';
import {
  BUILDING_MAX_POLLS,
  BUILDING_POLL_INTERVAL_MS,
  buildingRefetchInterval,
  insightsStaleTime,
  type InsightsQueryState,
} from './insightsPolling';

function query(
  status: 'ready' | 'building' | 'insufficient_data' | undefined,
  dataUpdateCount = 0,
  errorUpdateCount = 0,
): InsightsQueryState {
  return {
    state: {
      data: status ? { status } : undefined,
      dataUpdateCount,
      errorUpdateCount,
    },
  };
}

describe('insightsStaleTime', () => {
  it('is 0 while building', () => {
    expect(insightsStaleTime(query('building'))).toBe(0);
  });

  it('uses the long stale time for ready and insufficient data', () => {
    expect(insightsStaleTime(query('ready'))).toBe(INSIGHTS_STALE_TIME_MS);
    expect(insightsStaleTime(query('insufficient_data'))).toBe(INSIGHTS_STALE_TIME_MS);
  });

  it('uses the long stale time before any data arrives', () => {
    expect(insightsStaleTime(query(undefined))).toBe(INSIGHTS_STALE_TIME_MS);
  });
});

describe('buildingRefetchInterval', () => {
  it('polls every 10s while building', () => {
    expect(buildingRefetchInterval(query('building', 1))).toBe(BUILDING_POLL_INTERVAL_MS);
    expect(BUILDING_POLL_INTERVAL_MS).toBe(10_000);
  });

  it('does not poll when ready, insufficient or without data', () => {
    expect(buildingRefetchInterval(query('ready'))).toBe(false);
    expect(buildingRefetchInterval(query('insufficient_data'))).toBe(false);
    expect(buildingRefetchInterval(query(undefined))).toBe(false);
  });

  it('polls at the limit and stops one over it', () => {
    expect(buildingRefetchInterval(query('building', BUILDING_MAX_POLLS))).toBe(
      BUILDING_POLL_INTERVAL_MS,
    );
    expect(buildingRefetchInterval(query('building', BUILDING_MAX_POLLS + 1))).toBe(false);
  });

  it('counts errored fetches toward the limit', () => {
    expect(buildingRefetchInterval(query('building', 3, 3))).toBe(BUILDING_POLL_INTERVAL_MS);
    expect(buildingRefetchInterval(query('building', 3, 4))).toBe(false);
    expect(buildingRefetchInterval(query('building', 0, BUILDING_MAX_POLLS + 1))).toBe(false);
  });
});
