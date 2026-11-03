import { barHeights, gridMax, heatmapIntensity } from './insightsCharts';

describe('barHeights', () => {
  it('gives the tallest value maxPx and keeps proportions', () => {
    expect(barHeights([5, 10, 2.5], 100)).toEqual([50, 100, 25]);
  });

  it('returns zeros for all-zero and empty input', () => {
    expect(barHeights([0, 0, 0], 40)).toEqual([0, 0, 0]);
    expect(barHeights([], 40)).toEqual([]);
  });

  it('handles a single value and an outlier', () => {
    expect(barHeights([7], 40)).toEqual([40]);
    const out = barHeights([1, 1000], 100);
    expect(out[1]).toBe(100);
    expect(out[0]).toBeCloseTo(0.1);
  });

  it('handles a 24-length input', () => {
    const out = barHeights(Array.from({ length: 24 }, (_, i) => i), 46);
    expect(out).toHaveLength(24);
    expect(out[23]).toBe(46);
    expect(out[0]).toBe(0);
  });

  it('treats negative, NaN and null entries as 0 without throwing', () => {
    const out = barHeights([-5, Number.NaN, null, undefined, Infinity, 4], 20);
    expect(out).toEqual([0, 0, 0, 0, 0, 20]);
    out.forEach((h) => expect(Number.isNaN(h)).toBe(false));
  });

  it('returns zeros when maxPx is invalid', () => {
    expect(barHeights([1, 2], Number.NaN)).toEqual([0, 0]);
    expect(barHeights([1, 2], -3)).toEqual([0, 0]);
  });
});

describe('heatmapIntensity', () => {
  it('scales against the max', () => {
    expect(heatmapIntensity(5, 10)).toBe(0.5);
    expect(heatmapIntensity(10, 10)).toBe(1);
  });

  it('returns 0 for null, zero, negative, NaN or a zero max', () => {
    expect(heatmapIntensity(null, 10)).toBe(0);
    expect(heatmapIntensity(0, 10)).toBe(0);
    expect(heatmapIntensity(-1, 10)).toBe(0);
    expect(heatmapIntensity(Number.NaN, 10)).toBe(0);
    expect(heatmapIntensity(5, 0)).toBe(0);
    expect(heatmapIntensity(5, Number.NaN)).toBe(0);
  });

  it('never exceeds 1', () => {
    expect(heatmapIntensity(20, 10)).toBe(1);
  });
});

describe('gridMax', () => {
  it('finds the max and ignores nulls', () => {
    expect(gridMax([[1, null], [7, 3]])).toBe(7);
  });

  it('is 0 for empty or all-null grids', () => {
    expect(gridMax([])).toBe(0);
    expect(gridMax([[null, null]])).toBe(0);
  });
});
