import {
  hasTrendData,
  peerRangePosition,
  topPercentValue,
  trendCounts,
  weekdayLabel,
} from './insightsDetailModels';

const peers = { min: 10, p25: 20, median: 30, p75: 40, max: 50, count: 8 };

describe('topPercentValue', () => {
  it('shows top-half percentiles as top N%', () => {
    expect(topPercentValue(90)).toBe(10);
    expect(topPercentValue(50)).toBe(50);
  });

  it('clamps to at least 1%', () => {
    expect(topPercentValue(100)).toBe(1);
    expect(topPercentValue(99.8)).toBe(1);
  });

  it('is null below the half, for null, undefined and NaN', () => {
    expect(topPercentValue(49)).toBeNull();
    expect(topPercentValue(0)).toBeNull();
    expect(topPercentValue(null)).toBeNull();
    expect(topPercentValue(undefined)).toBeNull();
    expect(topPercentValue(Number.NaN)).toBeNull();
  });
});

describe('trendCounts / hasTrendData', () => {
  it('maps counts and treats null as 0', () => {
    const trend = [
      { start: '2026-01-01', count: 6 },
      { start: '2026-01-02', count: null },
    ];
    expect(trendCounts(trend)).toEqual([6, 0]);
    expect(hasTrendData(trend)).toBe(true);
  });

  it('handles empty, all-null and missing trends', () => {
    expect(trendCounts([])).toEqual([]);
    expect(trendCounts(undefined)).toEqual([]);
    expect(hasTrendData([{ start: 'a', count: null }])).toBe(false);
    expect(hasTrendData(null)).toBe(false);
  });

  it('counts a real zero as data', () => {
    expect(hasTrendData([{ start: 'a', count: 0 }])).toBe(true);
  });
});

describe('peerRangePosition', () => {
  it('places a value within the range', () => {
    expect(peerRangePosition(30, peers)).toBe(0.5);
    expect(peerRangePosition(10, peers)).toBe(0);
    expect(peerRangePosition(50, peers)).toBe(1);
  });

  it('clamps values outside the range', () => {
    expect(peerRangePosition(5, peers)).toBe(0);
    expect(peerRangePosition(500, peers)).toBe(1);
  });

  it('is null without peers or spread, or for non-finite values', () => {
    expect(peerRangePosition(30, null)).toBeNull();
    expect(peerRangePosition(30, undefined)).toBeNull();
    expect(peerRangePosition(30, { ...peers, min: 5, max: 5 })).toBeNull();
    expect(peerRangePosition(Number.NaN, peers)).toBeNull();
  });
});

describe('weekdayLabel', () => {
  it('starts on Monday and ends on Sunday', () => {
    expect(weekdayLabel(0, 'en-US')).toBe('M');
    expect(weekdayLabel(6, 'en-US')).toBe('S');
  });
  it('clamps out-of-range and invalid indexes', () => {
    expect(weekdayLabel(-3, 'en-US')).toBe('M');
    expect(weekdayLabel(99, 'en-US')).toBe('S');
    expect(weekdayLabel(Number.NaN, 'en-US')).toBe('M');
  });
});
