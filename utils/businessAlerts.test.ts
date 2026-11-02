import en from '@/locales/en';
import type { BusinessAlertDAO, BusinessAlertsDAO } from '@/http/business-api/types';
import {
  buildAlertParams,
  markAlertReadInCache,
  removeAlertFromCache,
  resolveAlertAction,
  resolveAlertCopy,
  restoreAlertsSnapshot,
  unreadAlertIds,
} from '@/utils/businessAlerts';

// Duplicated from LocalNotes-backend businesses/alerts/rules.py (keys only).
const RULE_KEYS = [
  { what: 'activity_up', why: 'activity_up', action: 'new_visitors_offer', cta: 'create_offer_web' },
  { what: 'activity_down', why: 'activity_down', action: 'refresh_profile', cta: 'edit_profile' },
  { what: 'customer_concern', why: 'customer_concern', action: 'address_concern', cta: 'edit_profile' },
  { what: 'list_added', why: 'list_added', action: 'thank_pickers', cta: 'thank_you' },
  { what: 'list_removed', why: 'list_removed', action: 'win_back', cta: 'open_customers' },
  { what: 'campaign_up', why: 'campaign_up', action: 'extend_campaign', cta: 'open_campaign' },
  { what: 'campaign_down', why: 'campaign_down', action: 'refresh_offer', cta: 'create_offer_web' },
  { what: 'profile_incomplete', why: 'profile_incomplete', action: 'complete_profile', cta: 'edit_profile' },
];
// Lexicon themes in businesses/alerts/concern_lexicon.py.
const THEMES = [
  'long_wait', 'price', 'cleanliness', 'staff', 'quality', 'noise_crowd', 'parking_access', 'hours_info',
];

function lookup(key: string): unknown {
  return key.split('.').reduce<unknown>(
    (node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined),
    en,
  );
}
const exists = (key: string) => typeof lookup(key) === 'string';
const t = (key: string, options?: Record<string, unknown>) => {
  const raw = lookup(key);
  const text = typeof raw === 'string' ? raw : `MISSING:${key}`;
  return text.replace(/\{\{(\w+)\}\}/g, (_m, name) => String(options?.[name] ?? ''));
};

const alert = (over: Partial<BusinessAlertDAO> = {}): BusinessAlertDAO => ({
  id: 'a1',
  alert_type: 'activity_change',
  direction: 'down',
  severity: 'important',
  what_key: 'activity_down',
  why_key: 'activity_down',
  action_key: 'refresh_profile',
  cta: 'edit_profile',
  params: { metric: 'views', delta_pct: 31 },
  created_at: '2026-11-02T04:31:00Z',
  read_at: null,
  ...over,
});

const cache = (): BusinessAlertsDAO => ({
  unread_count: 2,
  alerts: [alert({ id: 'a1' }), alert({ id: 'a2' })],
});

describe('alert i18n keys', () => {
  it.each(RULE_KEYS)('resolves every key of $what', ({ what, why, action, cta }) => {
    expect(exists(`businessHome.alert.what.${what}`)).toBe(true);
    expect(exists(`businessHome.alert.why.${why}`)).toBe(true);
    expect(exists(`businessHome.alert.action.${action}`)).toBe(true);
    expect(exists(`businessHome.alert.cta.${cta}`)).toBe(true);
  });

  it('labels every concern theme and metric', () => {
    for (const theme of THEMES) expect(exists(`businessHome.alert.concern.theme.${theme}`)).toBe(true);
    for (const m of ['views', 'saves', 'follows', 'shares'])
      expect(exists(`businessHome.alert.metric.${m}`)).toBe(true);
  });

  it('falls back to generic copy for unknown keys without throwing', () => {
    const copy = resolveAlertCopy(
      alert({ what_key: 'nope', why_key: '', action_key: 'nope', params: { term: 'zzz', metric: 'zzz' as never } }),
      t,
      exists,
    );
    expect(copy.what).toBe(en.businessHome.alert.what.fallback);
    expect(copy.why).toBe(en.businessHome.alert.why.fallback);
    expect(copy.action).toBe(en.businessHome.alert.action.fallback);
  });

  it('renders the three parts with numbers (absolute delta)', () => {
    const copy = resolveAlertCopy(alert({ params: { metric: 'views', delta_pct: -31 } }), t, exists);
    expect(copy.what).toBe('Profile views are down 31%');
  });

  it('uses generic labels for unknown concern themes', () => {
    const params = buildAlertParams(alert({ params: { term: 'weird' } }), t, exists);
    expect(params.term).toBe('a recurring issue');
  });

  it('lists profile gaps', () => {
    const params = buildAlertParams(
      alert({ params: { gaps: [{ group: 'hours' }, { group: 'importantInfo', missing: ['Menu', 'Seating'] }] } }),
      t,
      exists,
    );
    expect(params.gaps).toBe('set opening hours, add menu, seating');
  });
});

describe('resolveAlertAction', () => {
  it('maps every CTA to exactly one action', () => {
    const map = {
      create_offer_web: 'create_offer_web',
      edit_profile: 'edit_profile',
      thank_you: 'thank_you',
      open_customers: 'open_customers',
      open_campaign: 'open_campaign',
    } as const;
    for (const [cta, kind] of Object.entries(map)) {
      expect(resolveAlertAction(alert({ cta: cta as BusinessAlertDAO['cta'] })).kind).toBe(kind);
    }
  });

  it('opens the hours editor only for a profile alert with an hours gap', () => {
    const profile = (gaps: { group: string }[]) =>
      alert({ alert_type: 'profile_incomplete', direction: null, cta: 'edit_profile', params: { gaps } });
    expect(resolveAlertAction(profile([{ group: 'hours' }])).kind).toBe('edit_hours');
    expect(resolveAlertAction(profile([{ group: 'photo' }])).kind).toBe('edit_profile');
  });

  it('is a safe no-op for unknown or missing CTAs', () => {
    expect(resolveAlertAction(alert({ cta: 'launch_rocket' as never })).kind).toBe('none');
    expect(resolveAlertAction(alert({ cta: 'toString' as never })).kind).toBe('none');
    expect(resolveAlertAction(alert({ cta: null })).kind).toBe('none');
  });
});

describe('cache transforms', () => {
  it('marks read and lowers the unread count once', () => {
    const once = markAlertReadInCache(cache(), 'a1', 'now')!;
    expect(once.unread_count).toBe(1);
    expect(once.alerts[0].read_at).toBe('now');
    expect(markAlertReadInCache(once, 'a1', 'later')).toBe(once);
  });

  it('leaves the cache alone for unknown ids and empty data', () => {
    const data = cache();
    expect(markAlertReadInCache(data, 'zzz', 'now')).toBe(data);
    expect(removeAlertFromCache(data, 'zzz')).toBe(data);
    expect(markAlertReadInCache(undefined, 'a1', 'now')).toBeUndefined();
    expect(removeAlertFromCache({ unread_count: 0, alerts: [] }, 'a1')?.alerts).toEqual([]);
  });

  it('removes a dismissed alert and recomputes unread', () => {
    const unread = removeAlertFromCache(cache(), 'a1')!;
    expect(unread.alerts.map((a) => a.id)).toEqual(['a2']);
    expect(unread.unread_count).toBe(1);

    const read = { unread_count: 1, alerts: [alert({ id: 'a1', read_at: 'x' }), alert({ id: 'a2' })] };
    expect(removeAlertFromCache(read, 'a1')!.unread_count).toBe(1);
  });

  it('never goes below zero', () => {
    const data = { unread_count: 0, alerts: [alert()] };
    expect(markAlertReadInCache(data, 'a1', 'now')!.unread_count).toBe(0);
  });

  it('restores the snapshot on rollback', () => {
    const snapshot = cache();
    expect(restoreAlertsSnapshot({ unread_count: 0, alerts: [] }, snapshot)).toBe(snapshot);
    const current = cache();
    expect(restoreAlertsSnapshot(current, undefined)).toBe(current);
  });

  it('lists unread ids', () => {
    expect(unreadAlertIds({ unread_count: 1, alerts: [alert({ id: 'a1', read_at: 'x' }), alert({ id: 'a2' })] })).toEqual(['a2']);
    expect(unreadAlertIds(undefined)).toEqual([]);
  });
});
