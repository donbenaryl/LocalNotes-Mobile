import type {
  BusinessDemandTrendPointDAO,
  BusinessPeerDistributionDAO,
} from '@/http/business-api/types';

/** Peer percentile only reads as a win in the top half. */
export const MIN_PERCENTILE_TO_SHOW = 50;

/** "Top N%" value for a peer percentile, or null when it should not be shown. */
export function topPercentValue(percentile: number | null | undefined): number | null {
  if (typeof percentile !== 'number' || !Number.isFinite(percentile)) return null;
  if (percentile < MIN_PERCENTILE_TO_SHOW) return null;
  return Math.max(1, Math.round(100 - percentile));
}

/** Trend counts for bars; buckets under the privacy threshold (null) draw as 0. */
export function trendCounts(trend: BusinessDemandTrendPointDAO[] | null | undefined): number[] {
  return (trend ?? []).map((point) => point.count ?? 0);
}

/** True when at least one bucket cleared the privacy threshold. */
export function hasTrendData(trend: BusinessDemandTrendPointDAO[] | null | undefined): boolean {
  return (trend ?? []).some((point) => typeof point.count === 'number');
}

/**
 * Position (0 to 1) of the business's own value inside the peer min..max range.
 * Null without a distribution or when the range is degenerate (no spread to draw).
 */
export function peerRangePosition(
  value: number,
  peers: BusinessPeerDistributionDAO | null | undefined,
): number | null {
  if (!peers || !Number.isFinite(value)) return null;
  const span = peers.max - peers.min;
  if (!Number.isFinite(span) || span <= 0) return null;
  return Math.min(1, Math.max(0, (value - peers.min) / span));
}

/** Narrow weekday label (M, T, W…) for heatmap rows; index 0 is Monday, matching the API. */
export function weekdayLabel(index: number, locale: string): string {
  // 2024-01-01 was a Monday.
  const safe = Math.min(6, Math.max(0, Math.trunc(Number.isFinite(index) ? index : 0)));
  return new Date(2024, 0, 1 + safe).toLocaleDateString(locale, { weekday: 'narrow' });
}

/** Full weekday name (Monday…) for the heatmap readout; index 0 is Monday. */
export function weekdayLongLabel(index: number, locale: string): string {
  const safe = Math.min(6, Math.max(0, Math.trunc(Number.isFinite(index) ? index : 0)));
  return new Date(2024, 0, 1 + safe).toLocaleDateString(locale, { weekday: 'long' });
}

/** Zero-padded hour label, e.g. 9 -> "09:00"; 24 wraps to "00:00". */
export function hourLabel(hour: number): string {
  return `${String(((Math.trunc(hour) % 24) + 24) % 24).padStart(2, '0')}:00`;
}
