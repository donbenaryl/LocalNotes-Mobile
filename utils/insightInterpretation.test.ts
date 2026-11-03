import en from '@/locales/en';
import type { BusinessInsightInterpretationDAO } from '@/http/business-api/types';
import {
  buildInterpretationSentence,
  formatFreeBodyDeltas,
  getInterpretationCardState,
  isNotEntitledError,
} from '@/utils/insightInterpretation';

function lookup(key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined,
      en,
    );
}
const t = (key: string, options?: Record<string, unknown>) => {
  const raw = lookup(key);
  const text = typeof raw === 'string' ? raw : `MISSING:${key}`;
  return text.replace(/\{\{(\w+)\}\}/g, (_m, name) => String(options?.[name] ?? ''));
};

const base = (over: Partial<BusinessInsightInterpretationDAO> = {}): BusinessInsightInterpretationDAO => ({
  status: 'ready',
  reason: null,
  kind: 'change',
  period: {
    date_from: '2026-11-01',
    date_to: '2026-11-30',
    prev_date_from: '2026-10-02',
    prev_date_to: '2026-10-31',
  },
  metrics: {
    views: { current: 240, previous: 200, delta_pct: 20 },
    saves: { current: 53, previous: 50, delta_pct: 6 },
  },
  headline: { metric: 'views', direction: 'up', delta_pct: 20 },
  secondary: null,
  driver: null,
  ...over,
});

describe('buildInterpretationSentence', () => {
  it('names the channel when most of a rise came from it', () => {
    const data = base({ driver: { type: 'channel', key: 'search', share_pct: 64, strength: 'most' } });
    expect(buildInterpretationSentence(data, t)).toBe(
      'Views increased 20%, and most of the additional views came from Search.',
    );
  });

  it('names a removed list for a drop', () => {
    const data = base({
      headline: { metric: 'saves', direction: 'down', delta_pct: 15 },
      driver: { type: 'list_removed', list_id: 'l1', list_name: 'Best Brunch in Austin' },
    });
    expect(buildInterpretationSentence(data, t)).toBe(
      'Saves dropped 15% after you stopped appearing on the list “Best Brunch in Austin”.',
    );
  });

  it('builds list_added, top_list, pick_favorites and channelLargest clauses', () => {
    const added = base({ driver: { type: 'list_added', list_id: 'l', list_name: 'Tacos' } });
    expect(buildInterpretationSentence(added, t)).toBe(
      'Views increased 20% after you were added to the list “Tacos”.',
    );
    const top = base({
      headline: { metric: 'saves', direction: 'down', delta_pct: 30 },
      driver: { type: 'top_list', list_id: 'l', list_name: 'Tacos', share_pct: 70 },
    });
    expect(buildInterpretationSentence(top, t)).toBe(
      'Saves dropped 30%, and the list “Tacos” drove most of the change in saves.',
    );
    const picks = base({
      headline: { metric: 'saves', direction: 'up', delta_pct: 30 },
      driver: { type: 'pick_favorites', share_pct: 60 },
    });
    expect(buildInterpretationSentence(picks, t)).toBe(
      'Saves increased 30%, and most of the change came from favorites on your picks.',
    );
    const largest = base({ driver: { type: 'channel', key: 'discovery', share_pct: 35, strength: 'largest' } });
    expect(buildInterpretationSentence(largest, t)).toBe(
      'Views increased 20%, and Discovery was the biggest source of the change in views.',
    );
  });

  it('appends the secondary metric', () => {
    const data = base({
      driver: { type: 'channel', key: 'search', share_pct: 64, strength: 'most' },
      secondary: { metric: 'saves', direction: 'up', delta_pct: 6 },
    });
    expect(buildInterpretationSentence(data, t)).toBe(
      'Views increased 20%, and most of the additional views came from Search. Saves rose 6%.',
    );
    const fell = base({ secondary: { metric: 'saves', direction: 'down', delta_pct: 4 } });
    expect(buildInterpretationSentence(fell, t)).toBe('Views increased 20%. Saves fell 4%.');
  });

  it('uses the steady line', () => {
    const data = base({ kind: 'steady', headline: null });
    expect(buildInterpretationSentence(data, t)).toBe(
      'Views and saves held steady compared with the previous period',
    );
  });

  it('shows the headline only without a driver', () => {
    expect(buildInterpretationSentence(base(), t)).toBe('Views increased 20%.');
  });

  it('omits a flat or null secondary', () => {
    const flat = base({ secondary: { metric: 'saves', direction: 'flat', delta_pct: 0 } });
    expect(buildInterpretationSentence(flat, t)).toBe('Views increased 20%.');
  });

  it('uses the "lost" wording for a drop with a dominant channel', () => {
    const data = base({
      headline: { metric: 'views', direction: 'down', delta_pct: 25 },
      driver: { type: 'channel', key: 'share_link', share_pct: 70, strength: 'most' },
    });
    expect(buildInterpretationSentence(data, t)).toBe(
      'Views dropped 25%, and most of the lost views were from shared links.',
    );
  });

  it('falls back to the headline for unknown driver types and origins without throwing', () => {
    const unknownType = base({ driver: { type: 'weather' } as never });
    expect(buildInterpretationSentence(unknownType, t)).toBe('Views increased 20%.');
    const unknownOrigin = base({
      driver: { type: 'channel', key: 'carrier_pigeon' as never, share_pct: 80, strength: 'most' },
    });
    expect(buildInterpretationSentence(unknownOrigin, t)).toBe('Views increased 20%.');
  });

  it('returns an empty string when a change has no headline', () => {
    expect(buildInterpretationSentence(base({ headline: null }), t)).toBe('');
  });
});

describe('isNotEntitledError', () => {
  it('detects status 403 only', () => {
    expect(isNotEntitledError({ statusCode: 403 })).toBe(true);
    expect(isNotEntitledError({ statusCode: 500 })).toBe(false);
    expect(isNotEntitledError(new Error('x'))).toBe(false);
    expect(isNotEntitledError(null)).toBe(false);
    expect(isNotEntitledError('403')).toBe(false);
  });
});

describe('getInterpretationCardState', () => {
  it('maps loading, errors and data', () => {
    expect(getInterpretationCardState({ isPending: true, error: null, data: undefined })).toEqual({
      kind: 'loading',
    });
    expect(
      getInterpretationCardState({
        isPending: false,
        error: Object.assign(new Error('no'), { statusCode: 403 }),
        data: undefined,
      }),
    ).toEqual({ kind: 'notEntitled' });
    expect(
      getInterpretationCardState({ isPending: false, error: new Error('boom'), data: undefined }),
    ).toEqual({ kind: 'error' });
    const data = base();
    expect(getInterpretationCardState({ isPending: false, error: null, data })).toEqual({
      kind: 'ready',
      data,
    });
  });

  it('maps insufficient_data reasons, defaulting unknown reasons to low_volume', () => {
    const state = (reason: unknown) =>
      getInterpretationCardState({
        isPending: false,
        error: null,
        data: base({ status: 'insufficient_data', reason: reason as never, kind: null }),
      });
    expect(state('no_previous')).toEqual({ kind: 'insufficient', reason: 'no_previous' });
    expect(state('low_volume')).toEqual({ kind: 'insufficient', reason: 'low_volume' });
    expect(state('something_new')).toEqual({ kind: 'insufficient', reason: 'low_volume' });
    expect(state(null)).toEqual({ kind: 'insufficient', reason: 'low_volume' });
  });

  it('treats a settled query with no data as an error', () => {
    expect(getInterpretationCardState({ isPending: false, error: null, data: undefined })).toEqual({
      kind: 'error',
    });
  });
});

describe('formatFreeBodyDeltas', () => {
  it('formats arrows and shows 0% for zero', () => {
    expect(formatFreeBodyDeltas({ viewsChange: 18, savesChange: -6 })).toEqual({
      views: '↑18%',
      saves: '↓6%',
    });
    expect(formatFreeBodyDeltas({ viewsChange: 0, savesChange: 0 })).toEqual({
      views: '0%',
      saves: '0%',
    });
  });
});
