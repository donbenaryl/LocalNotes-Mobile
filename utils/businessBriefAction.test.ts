import en from '@/locales/en';
import type { BusinessBriefActiveActionDAO } from '@/http/business-api/types';
import {
  ACTION_KEY_LIST,
  actionCopyKeys,
  actionParams,
  activeActionSubtitle,
  canMarkDone,
  ctaDestination,
  formatMetricValue,
  noActionLine,
  pastPlanChipKey,
  progressPercent,
} from './businessBriefAction';

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

function active(partial: Partial<BusinessBriefActiveActionDAO>): BusinessBriefActiveActionDAO {
  return {
    id: 'a1',
    key: 'fill_profile_gaps',
    status: 'completed',
    cta: 'edit_profile',
    effort: 'low',
    params: {},
    target_metric: 'visit_save_rate',
    started_at: '2026-10-20T09:12:00Z',
    completed_at: null,
    day: 12,
    of_days: 28,
    baseline_value: 0.07,
    baseline_n: 100,
    progress: null,
    result: null,
    ...partial,
  };
}

describe('en.ts completeness', () => {
  it('has title, summary, step and did copy for every action key', () => {
    for (const key of ACTION_KEY_LIST) {
      const keys = actionCopyKeys(key);
      expect(lookup(keys.title)).toBeTruthy();
      expect(lookup(keys.summary)).toBeTruthy();
      expect(lookup(keys.step)).toBeTruthy();
      expect(lookup(keys.did)).toBeTruthy();
    }
  });
  it('has the shared action copy', () => {
    for (const k of [
      'measureLine',
      'noAction',
      'alreadyTracking',
      'buttons.start',
      'buttons.done',
      'buttons.notNow',
      'status.started',
      'status.completed',
      'status.measured',
      'verdict.improved',
      'verdict.no_change',
      'verdict.declined',
      'verdict.inconclusive',
    ]) {
      expect(lookup(`businessHome.action.${k}`)).toBeTruthy();
    }
  });
  it('has no Priority field', () => {
    expect(lookup('businessHome.action.priority')).toBeUndefined();
  });
});

describe('ctaDestination', () => {
  it('maps each CTA to one destination', () => {
    expect(ctaDestination('create_offer_web')).toEqual({ kind: 'offer_web' });
    expect(ctaDestination('edit_profile')).toEqual({ kind: 'route', path: '/edit-profile' });
    expect(ctaDestination('thank_you')).toEqual({ kind: 'route', path: '/thank-you' });
    expect(ctaDestination('open_customers')).toEqual({ kind: 'prop', name: 'customers' });
    expect(ctaDestination('open_campaign')).toEqual({ kind: 'prop', name: 'campaign' });
  });
  it('is a no-op for an unknown or missing CTA', () => {
    expect(ctaDestination('bogus')).toBeNull();
    expect(ctaDestination('toString')).toBeNull();
    expect(ctaDestination(null)).toBeNull();
  });
});

describe('actionParams', () => {
  it('builds tags, term, gaps and archetype', () => {
    const p = actionParams(
      { params: { tags: ['street-food', 'cozy'], gaps: ['photo', 'hours'], archetype: 'explorer', new_recommenders: 6 } },
      tr,
    );
    expect(p.tags).toBe('street-food, cozy');
    expect(p.term).toBe('street-food');
    expect(p.gaps).toBe('add a photo, set opening hours');
    expect(p.count).toBe(6);
    expect(p.archetype).toBe(tr('businessHome.brief.archetype.explorer'));
  });
  it('collapses importantInfo and survives empty params', () => {
    expect(actionParams({ params: { gaps: ['importantInfo'] } }, tr).gaps).toBe('your key details');
    const p = actionParams({ params: {} }, tr);
    expect(p.tags).toBe('');
    expect(p.count).toBe(0);
  });
});

describe('formatMetricValue', () => {
  it('formats rates as percentages and counts as numbers', () => {
    expect(formatMetricValue('visit_save_rate', 0.075)).toBe('8%');
    expect(formatMetricValue('group_savers', 4)).toBe('4');
    expect(formatMetricValue('recommenders', 1.5)).toBe('1.5');
    expect(formatMetricValue('visit_save_rate', null)).toBe('—');
  });
});

describe('activeActionSubtitle', () => {
  it('started shows the date and mark-done hint', () => {
    expect(activeActionSubtitle(active({ status: 'started' }), tr, 'en-US')).toMatch(/^Started .+Mark done/);
  });
  it('started without a date still reads', () => {
    expect(activeActionSubtitle(active({ status: 'started', started_at: null }), tr, 'en-US')).toBe(
      'Started. Mark done when finished.',
    );
  });
  it('completed shows the day counter, then early progress when available', () => {
    expect(activeActionSubtitle(active({}), tr, 'en')).toBe('Day 12 of 28 · tracking Save rate');
    const early = active({ progress: { value: 0.09, n: 210, early: true } });
    expect(activeActionSubtitle(early, tr, 'en')).toContain('7% → 9% so far');
  });
  it('measured words the verdict', () => {
    const improved = active({
      status: 'measured',
      result: { value: 0.1, n: 200, delta: 0.03, verdict: 'improved', measured_at: null },
    });
    expect(activeActionSubtitle(improved, tr, 'en')).toBe(
      'Since you filled the gaps in your profile, Save rate went from 7% to 10%.',
    );
    const inconclusive = active({
      status: 'measured',
      result: { value: null, n: 3, delta: null, verdict: 'inconclusive', measured_at: null },
    });
    expect(activeActionSubtitle(inconclusive, tr, 'en')).toContain("enough activity to tell yet");
  });
  it('a measured action with no result reads as inconclusive', () => {
    expect(activeActionSubtitle(active({ status: 'measured' }), tr, 'en')).toContain('tell yet');
  });
});

describe('noActionLine', () => {
  it('maps status and suppression', () => {
    expect(noActionLine('quiet', false)).toBe('noAction');
    expect(noActionLine('insight', false)).toBe('noAction');
    expect(noActionLine('insight', true)).toBe('alreadyTracking');
    expect(noActionLine('insufficient_data', false)).toBeNull();
    expect(noActionLine('building', true)).toBeNull();
  });
});

describe('canMarkDone', () => {
  it('only a started action', () => {
    expect(canMarkDone('started')).toBe(true);
    expect(canMarkDone('completed')).toBe(false);
  });
});

describe('progressPercent', () => {
  it('computes and clamps', () => {
    expect(progressPercent(12, 28)).toBe(43);
    expect(progressPercent(40, 28)).toBe(100);
  });
  it('is 0 for a zero or missing total', () => {
    expect(progressPercent(5, 0)).toBe(0);
    expect(progressPercent(5, null)).toBe(0);
    expect(progressPercent(null, 28)).toBe(0);
  });
});

describe('pastPlanChipKey', () => {
  it('resolves to existing copy', () => {
    expect(lookup(pastPlanChipKey('measured', 'improved'))).toBe('Improved');
    expect(lookup(pastPlanChipKey('measured', null))).toBe('Too early to tell');
    expect(lookup(pastPlanChipKey('expired', null))).toBe('Expired');
    expect(lookup(pastPlanChipKey('completed', null))).toBeTruthy();
  });
});
