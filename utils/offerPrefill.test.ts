import { buildCreateOfferUrl, quietestToPrefill } from '@/utils/offerPrefill';

const BASE = 'https://app.example.com/business/offers/new';

describe('buildCreateOfferUrl', () => {
  it('appends all three params, encoded', () => {
    const url = buildCreateOfferUrl(BASE, {
      start_hour: 14,
      end_hour: 16,
      timezone: 'America/New_York',
    });
    expect(url).toBe(`${BASE}?start_hour=14&end_hour=16&timezone=America%2FNew_York`);
  });

  it('returns the base URL when there is no prefill', () => {
    expect(buildCreateOfferUrl(BASE)).toBe(BASE);
    expect(buildCreateOfferUrl(BASE, null)).toBe(BASE);
  });

  it('uses & when the base already has a query string', () => {
    expect(buildCreateOfferUrl(`${BASE}?ref=app`, { start_hour: 1, end_hour: 2, timezone: 'UTC' })).toBe(
      `${BASE}?ref=app&start_hour=1&end_hour=2&timezone=UTC`,
    );
  });

  it('keeps start_hour 0', () => {
    expect(buildCreateOfferUrl(BASE, { start_hour: 0, end_hour: 2, timezone: 'UTC' })).toContain(
      'start_hour=0',
    );
  });

  it('omits empty timezone and non-finite hours', () => {
    const url = buildCreateOfferUrl(BASE, {
      start_hour: Number.NaN,
      end_hour: 5,
      timezone: '  ',
    });
    expect(url).toBe(`${BASE}?end_hour=5`);
    expect(buildCreateOfferUrl(BASE, { timezone: '' })).toBe(BASE);
  });
});

describe('quietestToPrefill', () => {
  it('maps a ready quietest range', () => {
    expect(
      quietestToPrefill({
        status: 'ready',
        timezone: 'Europe/London',
        quietest: { start_hour: 9, end_hour: 11 },
      }),
    ).toEqual({ start_hour: 9, end_hour: 11, timezone: 'Europe/London' });
  });

  it('maps start_hour 0', () => {
    expect(
      quietestToPrefill({
        status: 'ready',
        timezone: 'UTC',
        quietest: { start_hour: 0, end_hour: 2 },
      }),
    ).toEqual({ start_hour: 0, end_hour: 2, timezone: 'UTC' });
  });

  it('returns null for null, undefined and insufficient data', () => {
    expect(quietestToPrefill(null)).toBeNull();
    expect(quietestToPrefill(undefined)).toBeNull();
    expect(quietestToPrefill({ status: 'insufficient_data', quietest: null })).toBeNull();
    expect(
      quietestToPrefill({ status: 'ready', timezone: 'UTC', quietest: null }),
    ).toBeNull();
  });

  it('returns null when the timezone is missing', () => {
    expect(
      quietestToPrefill({ status: 'ready', quietest: { start_hour: 1, end_hour: 2 } }),
    ).toBeNull();
  });
});
