export type OfferPrefill = {
  start_hour: number;
  end_hour: number;
  timezone: string;
};

type QuietestLike = {
  start_hour: number;
  end_hour: number;
} | null;

type PeakHoursLike = {
  status?: string;
  timezone?: string;
  quietest?: QuietestLike;
} | null;

const isHour = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * Appends the quietest-hour window to the web create-offer URL. Params that are
 * missing or invalid are omitted rather than sent empty. `0` is a valid hour.
 */
export function buildCreateOfferUrl(baseUrl: string, prefill?: Partial<OfferPrefill> | null): string {
  if (!prefill) return baseUrl;

  const params = new URLSearchParams();
  if (isHour(prefill.start_hour)) params.set('start_hour', String(prefill.start_hour));
  if (isHour(prefill.end_hour)) params.set('end_hour', String(prefill.end_hour));
  if (typeof prefill.timezone === 'string' && prefill.timezone.trim() !== '') {
    params.set('timezone', prefill.timezone.trim());
  }

  const query = params.toString();
  if (!query) return baseUrl;
  return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${query}`;
}

/** Maps the demand peak-hours section to a prefill, or null when not ready. */
export function quietestToPrefill(peakHours: PeakHoursLike | undefined): OfferPrefill | null {
  if (!peakHours || peakHours.status !== 'ready') return null;
  const { quietest, timezone } = peakHours;
  if (!quietest || !isHour(quietest.start_hour) || !isHour(quietest.end_hour)) return null;
  if (typeof timezone !== 'string' || timezone.trim() === '') return null;
  return {
    start_hour: quietest.start_hour,
    end_hour: quietest.end_hour,
    timezone: timezone.trim(),
  };
}
