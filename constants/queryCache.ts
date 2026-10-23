/** Default stale window for main tab feeds — avoids refetch skeletons on switch. */
export const FEED_STALE_TIME_MS = 60_000;

/** Business insights are recomputed nightly, so a long stale window is safe. */
export const INSIGHTS_STALE_TIME_MS = 30 * 60_000;
