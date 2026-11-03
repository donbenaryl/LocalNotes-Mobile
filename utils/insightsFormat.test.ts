import { formatDelta, visibleInsightNote } from '@/utils/insightsFormat';

describe('formatDelta', () => {
  it('formats positive and negative deltas', () => {
    expect(formatDelta(12.4)).toBe('↑12%');
    expect(formatDelta(-4.6)).toBe('↓5%');
  });
  it('is empty for zero, null, undefined and NaN', () => {
    expect(formatDelta(0)).toBe('');
    expect(formatDelta(null)).toBe('');
    expect(formatDelta(undefined)).toBe('');
    expect(formatDelta(Number.NaN)).toBe('');
  });
});

describe('visibleInsightNote', () => {
  it('returns a trimmed note', () => {
    expect(visibleInsightNote('  Be specific.  ')).toBe('Be specific.');
  });
  it('is null for null, undefined, empty and whitespace', () => {
    expect(visibleInsightNote(null)).toBeNull();
    expect(visibleInsightNote(undefined)).toBeNull();
    expect(visibleInsightNote('')).toBeNull();
    expect(visibleInsightNote('   ')).toBeNull();
  });
});
