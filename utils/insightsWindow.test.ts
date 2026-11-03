import { parseInsightsWindow } from './insightsWindow';

describe('parseInsightsWindow', () => {
  it('accepts the three windows', () => {
    expect(parseInsightsWindow('7d')).toBe('7d');
    expect(parseInsightsWindow('30d')).toBe('30d');
    expect(parseInsightsWindow('90d')).toBe('90d');
  });
  it('takes the first entry of an array param', () => {
    expect(parseInsightsWindow(['90d', '7d'])).toBe('90d');
  });
  it('falls back to 30d for missing or unknown values', () => {
    expect(parseInsightsWindow(undefined)).toBe('30d');
    expect(parseInsightsWindow(null)).toBe('30d');
    expect(parseInsightsWindow('')).toBe('30d');
    expect(parseInsightsWindow('1y')).toBe('30d');
    expect(parseInsightsWindow([])).toBe('30d');
  });
});
