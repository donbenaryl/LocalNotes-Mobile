import en from '@/locales/en';
import type { BusinessMonthlyReportDAO } from '@/http/business-api/types';
import {
  deltaPercent,
  formatDelta,
  formatReportMonth,
  headlineKey,
  reportView,
  rowCopyKey,
} from './businessMonthlyReport';

function lookup(key: string): string | undefined {
  let node: unknown = en;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null || !(part in node)) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

const report = (status: BusinessMonthlyReportDAO['status']): BusinessMonthlyReportDAO => ({
  status,
  month_start: null,
  month_end: null,
  volume: {},
  previous_volume: {},
  deltas: {},
  top_mover: null,
  insufficient: null,
  summary: null,
  computed_at: null,
});

describe('formatReportMonth', () => {
  it('formats the month and year', () => {
    expect(formatReportMonth('2026-10-01', 'en-US')).toBe('October 2026');
  });
  it('does not shift across timezones (local parse)', () => {
    expect(formatReportMonth('2026-01-01', 'en-US')).toBe('January 2026');
  });
  it('handles the December year edge', () => {
    expect(formatReportMonth('2026-12-01', 'en-US')).toBe('December 2026');
  });
  it('returns empty for missing or invalid input', () => {
    expect(formatReportMonth(null, 'en-US')).toBe('');
    expect(formatReportMonth('nope', 'en-US')).toBe('');
  });
});

describe('delta formatting', () => {
  it('rounds to whole percent', () => {
    expect(deltaPercent(0.236)).toBe(24);
    expect(deltaPercent(-0.2)).toBe(-20);
    expect(deltaPercent(0.004)).toBe(0);
    expect(deltaPercent(-0.004)).toBe(0);
  });
  it('formats with a sign', () => {
    expect(formatDelta(0.2)).toBe('+20%');
    expect(formatDelta(-0.2)).toBe('-20%');
    expect(formatDelta(0)).toBe('0%');
  });
  it('is empty when not comparable', () => {
    expect(formatDelta(null)).toBe('');
    expect(formatDelta(undefined)).toBe('');
    expect(formatDelta(Number.NaN)).toBe('');
  });
});

describe('status mapping', () => {
  it('maps statuses to views', () => {
    expect(reportView(undefined)).toBe('loading');
    expect(reportView(report('building'))).toBe('building');
    expect(reportView(report('insufficient_data'))).toBe('insufficient');
    expect(reportView(report('insight'))).toBe('report');
    expect(reportView(report('quiet'))).toBe('report');
  });
  it('only returns copy keys that exist in en.ts', () => {
    for (const v of ['loading', 'building', 'insufficient', 'report'] as const) {
      expect(lookup(rowCopyKey(v))).toBeDefined();
    }
    expect(lookup(headlineKey('insight'))).toBeDefined();
    expect(lookup(headlineKey('quiet'))).toBeDefined();
  });
});
