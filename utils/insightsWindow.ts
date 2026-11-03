import type { BusinessInsightsWindow } from '@/http/business-api/types';

export const DEFAULT_INSIGHTS_WINDOW: BusinessInsightsWindow = '30d';

const WINDOWS: readonly BusinessInsightsWindow[] = ['7d', '30d', '90d'];

/** Route param to a valid window; arrays take the first entry, anything unknown is the default. */
export function parseInsightsWindow(
  raw: string | string[] | undefined | null,
): BusinessInsightsWindow {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return WINDOWS.find((w) => w === value) ?? DEFAULT_INSIGHTS_WINDOW;
}
