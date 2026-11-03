/** Treats NaN, null, undefined, negatives and non-finite values as 0. */
function safe(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Pixel heights for a bar chart: the tallest value gets `maxPx`, the rest scale linearly.
 * All-zero or empty input yields zeros (never NaN).
 */
export function barHeights(values: (number | null | undefined)[], maxPx: number): number[] {
  const cleaned = values.map(safe);
  const max = Math.max(0, ...cleaned);
  const cap = safe(maxPx);
  if (max === 0 || cap === 0) return cleaned.map(() => 0);
  return cleaned.map((value) => (value / max) * cap);
}

/** 0 to 1 intensity of a heatmap cell relative to the grid maximum. */
export function heatmapIntensity(value: number | null | undefined, max: number): number {
  const v = safe(value);
  const m = safe(max);
  if (v === 0 || m === 0) return 0;
  return Math.min(1, v / m);
}

/** Largest usable value in a grid (null and invalid cells count as 0). */
export function gridMax(grid: (number | null | undefined)[][]): number {
  return Math.max(0, ...grid.flatMap((row) => row.map(safe)));
}
