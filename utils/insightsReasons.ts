const PEAK_HOURS_REASON_KEYS: Record<string, string> = {
  no_timezone: 'businessHome.explore.peakHoursNoTimezone',
  small_cohort: 'businessHome.explore.peakHoursSmallCohort',
};

const FALLBACK_KEY = 'businessHome.explore.insufficientData';

/** Locale key for why peak hours are unavailable; unknown reasons use the generic copy. */
export function peakHoursReasonKey(reason?: string | null): string {
  if (typeof reason !== 'string') return FALLBACK_KEY;
  return Object.prototype.hasOwnProperty.call(PEAK_HOURS_REASON_KEYS, reason)
    ? PEAK_HOURS_REASON_KEYS[reason]
    : FALLBACK_KEY;
}
