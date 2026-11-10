import en from '@/locales/en';
import type { BusinessBriefInsightDAO } from '@/http/business-api/types';
import {
  ARCHETYPE_SLUG_LIST,
  INSIGHT_KEY_LIST,
  audienceChips,
  footnoteParams,
  formatBriefPeriod,
  formatCount,
  formatEvidenceRow,
  formatEvidenceRows,
  formatRatePct,
  insightCopyKeys,
  insightParams,
  insufficientCopy,
  neededMore,
  quietCopy,
  supportingDataTarget,
} from './businessBrief';

/** Resolve a dotted key in en.ts; returns the key itself when missing (like i18next). */
function lookup(key: string): string | undefined {
  let node: unknown = en;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null || !(part in node)) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

const tr = (key: string, params?: Record<string, string | number>): string => {
  const raw = lookup(key);
  if (raw === undefined) return key;
  return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params?.[k] ?? ''));
};

function insight(partial: Partial<BusinessBriefInsightDAO> & { key: BusinessBriefInsightDAO['key'] }): BusinessBriefInsightDAO {
  return { direction: null, confidence: 'high', params: {}, evidence_rows: [], ...partial };
}

describe('en.ts completeness', () => {
  it('has copy for every insight key and direction', () => {
    for (const key of INSIGHT_KEY_LIST) {
      for (const direction of ['up', 'down'] as const) {
        const keys = insightCopyKeys(insight({ key, direction }));
        expect(lookup(keys.headline)).toBeTruthy();
        expect(lookup(keys.evidence)).toBeTruthy();
        expect(lookup(keys.why)).toBeTruthy();
      }
    }
  });

  it('has the leanings variant for archetype_affinity', () => {
    const keys = insightCopyKeys(insight({ key: 'archetype_affinity', params: { top_leanings: ['novel'] } }));
    expect(keys.why).toMatch(/why_leanings$/);
    expect(lookup(keys.why)).toBeTruthy();
  });

  it('has a label for every archetype slug and unknown', () => {
    for (const slug of [...ARCHETYPE_SLUG_LIST, 'unknown']) {
      expect(lookup(`businessHome.brief.archetype.${slug}`)).toBeTruthy();
    }
  });

  it('has the state copy keys', () => {
    for (const k of ['kicker', 'basedOn', 'quietBody', 'insufficientBody', 'firstBriefSoon', 'error', 'retry']) {
      expect(lookup(`businessHome.brief.${k}`)).toBeTruthy();
    }
  });
});

describe('insightCopyKeys', () => {
  it('suffixes directional keys', () => {
    expect(insightCopyKeys(insight({ key: 'list_recommendations', direction: 'down' })).headline).toBe(
      'businessHome.brief.insight.list_recommendations_down.headline',
    );
  });
  it('reads a missing direction as up', () => {
    expect(insightCopyKeys(insight({ key: 'visibility_change' })).headline).toContain('visibility_change_up');
  });
  it('does not suffix non-directional keys', () => {
    expect(insightCopyKeys(insight({ key: 'discovery_conversion_gap', direction: 'down' })).headline).toBe(
      'businessHome.brief.insight.discovery_conversion_gap.headline',
    );
  });
});

describe('supportingDataTarget', () => {
  it('maps per the plan', () => {
    expect(supportingDataTarget('discovery_conversion_gap')).toBe('findyou');
    expect(supportingDataTarget('discovery_quality_up')).toBe('findyou');
    expect(supportingDataTarget('visibility_change')).toBe('findyou');
    expect(supportingDataTarget('archetype_affinity')).toBe('customers');
    expect(supportingDataTarget('untapped_match')).toBe('customers');
    expect(supportingDataTarget('audience_alignment')).toBe('customers');
    expect(supportingDataTarget('list_recommendations')).toBe('customers');
    expect(supportingDataTarget('rising_term')).toBe('customers');
    expect(supportingDataTarget('campaign_results')).toBe('campaign');
  });
  it('falls back safely for an unknown key', () => {
    expect(supportingDataTarget('brand_new_key')).toBe('customers');
  });
});

describe('formatting', () => {
  it('rounds rates to whole percentages, half up', () => {
    expect(formatRatePct(0.075)).toBe('8');
    expect(formatRatePct(0.074)).toBe('7');
    expect(formatRatePct(0.12)).toBe('12');
    expect(formatRatePct(0)).toBe('0');
  });
  it('returns null for missing rates', () => {
    expect(formatRatePct(null)).toBeNull();
    expect(formatRatePct(undefined)).toBeNull();
    expect(formatRatePct(NaN)).toBeNull();
  });
  it('formats counts', () => {
    expect(formatCount(6)).toBe('6');
    expect(formatCount(1.5)).toBe('1.5');
    expect(formatCount(2.04)).toBe('2');
    expect(formatCount(null)).toBeNull();
  });
});

describe('insightParams', () => {
  it('builds archetype_affinity params', () => {
    const p = insightParams(
      insight({
        key: 'archetype_affinity',
        params: { archetype: 'explorer', lift_pct: 35, metric: 'visit_save_rate', top_leanings: ['adventurous', 'novel'] },
      }),
      tr,
    );
    expect(p).toMatchObject({ archetype: 'Explorers', liftPct: '35', verb: 'save', leanings: 'adventurous, novel' });
  });
  it('uses the recommend verb for recommend rate', () => {
    const p = insightParams(
      insight({ key: 'archetype_affinity', params: { archetype: 'tastemaker', metric: 'visit_recommend_rate' } }),
      tr,
    );
    expect(p.verb).toBe('recommend');
  });
  it('builds conversion gap params', () => {
    const p = insightParams(
      insight({
        key: 'discovery_conversion_gap',
        params: { reach_metric: 'discovered', reach_change_pct: 42, rate: 0.07, baseline_rate: 0.12 },
      }),
      tr,
    );
    expect(p).toMatchObject({ reach: 'search visibility', changePct: '42', rate: '7', baselineRate: '12' });
  });
  it('falls back for an unknown archetype and missing numbers', () => {
    const p = insightParams(insight({ key: 'untapped_match', params: { archetype: 'martian' } }), tr);
    expect(p.archetype).toBe('Customers');
    expect(p.avgMatch).toBe('—');
  });
  it('renders a full sentence', () => {
    const k = insightCopyKeys(insight({ key: 'discovery_conversion_gap' }));
    const params = insightParams(
      insight({
        key: 'discovery_conversion_gap',
        params: { reach_metric: 'discovered', reach_change_pct: 42, rate: 0.07, baseline_rate: 0.12 },
      }),
      tr,
    );
    expect(tr(k.evidence, params)).toBe(
      'Your search visibility rose 42%, while your save rate dropped from 12% to 7%.',
    );
  });
});

describe('audienceChips', () => {
  it('returns archetype, up to 3 interests and channel', () => {
    const chips = audienceChips(
      insight({
        key: 'archetype_affinity',
        params: {
          archetype: 'explorer',
          shared_interests: ['a', 'b', 'c', 'd'],
          top_channel: 'search',
        },
      }),
      tr,
    );
    expect(chips).toEqual(['Explorers', 'a', 'b', 'c', 'Found you mostly via search']);
  });
  it('uses missing interests for untapped_match', () => {
    const chips = audienceChips(
      insight({ key: 'untapped_match', params: { archetype: 'explorer', missing_interests: ['street-food'] } }),
      tr,
    );
    expect(chips).toEqual(['Explorers', 'street-food']);
  });
  it('is empty for non-personality insights', () => {
    expect(audienceChips(insight({ key: 'rising_term', params: { archetype: 'explorer' } }), tr)).toEqual([]);
  });
  it('maps an unknown channel to other', () => {
    const chips = audienceChips(
      insight({ key: 'untapped_match', params: { archetype: 'explorer', top_channel: 'carrier_pigeon' } }),
      tr,
    );
    expect(chips[chips.length - 1]).toBe('Found you mostly via other sources');
  });
});

describe('formatEvidenceRow', () => {
  it('formats a rate row with a baseline', () => {
    expect(
      formatEvidenceRow({ metric: 'visit_save_rate', kind: 'rate', current: 0.075, baseline: 0.104, n: 64, scope: 'explorer' }, tr),
    ).toEqual({ label: 'Explorers · Save rate', value: '8%', was: 'was 10%' });
  });
  it('formats a count row', () => {
    expect(formatEvidenceRow({ metric: 'list_adds', kind: 'count', current: 6, baseline: 1.5, n: 6 }, tr)).toEqual({
      label: 'New lists adding you',
      value: '6',
      was: 'was 1.5',
    });
  });
  it('handles a null baseline and null current', () => {
    const row = formatEvidenceRow({ metric: 'visitors', kind: 'count', current: null, baseline: null, n: 0 }, tr);
    expect(row.was).toBeNull();
    expect(row.value).toBe('—');
  });
  it('limits to 3 rows and tolerates null', () => {
    const r = { metric: 'visitors', kind: 'count' as const, current: 1, baseline: 1, n: 1 };
    expect(formatEvidenceRows([r, r, r, r], tr)).toHaveLength(3);
    expect(formatEvidenceRows(null, tr)).toEqual([]);
  });
});

describe('state helpers', () => {
  it('computes needed visitors', () => {
    expect(neededMore({ current: 12, needed: 30 })).toBe(18);
    expect(neededMore({ current: 40, needed: 30 })).toBe(0);
  });
  it('picks insufficient copy by metric', () => {
    expect(insufficientCopy({ metric: 'visitors', current: 12, needed: 30 })).toEqual({
      key: 'businessHome.brief.insufficientBody',
      params: { needed: 18 },
    });
    expect(insufficientCopy({ metric: 'baseline_weeks', current: 1, needed: 2 }).key).toBe(
      'businessHome.brief.insufficientWeeks',
    );
    expect(insufficientCopy(null).params.needed).toBe(0);
  });
  it('builds quiet copy, with a fallback', () => {
    expect(quietCopy({ visitors: 80, visit_save_rate: 0.1, baseline_visit_save_rate: 0.1 })).toEqual({
      key: 'businessHome.brief.quietBody',
      params: { visitors: 80, rate: '10' },
    });
    expect(quietCopy(null).key).toBe('businessHome.brief.quietBodyShort');
  });
  it('builds footnote params', () => {
    expect(footnoteParams({ visitors: 142, savers: 10 })).toEqual({ visitors: 142, savers: 10 });
    expect(footnoteParams(undefined)).toEqual({ visitors: 0, savers: 0 });
  });
  it('formats the period', () => {
    expect(formatBriefPeriod('2026-11-02', '2026-11-08', 'en-US')).toBe('Nov 2 – Nov 8');
    expect(formatBriefPeriod(null, null, 'en-US')).toBe('');
    expect(formatBriefPeriod('nope', '2026-11-08', 'en-US')).toBe('');
  });
});
