import en from '@/locales/en';
import type {
  CampaignResultsInsightDAO,
  CampaignResultsItemDAO,
} from '@/http/business-api/types';
import {
  compareSheetView,
  expireAfterLabelKey,
  formatCampaignCaption,
  formatEfficiency,
  formatSpendCents,
  insightCopyParams,
  insightHeadlineI18nKey,
  insightMeaningI18nKey,
} from './campaignResults';

function lookup(key: string): unknown {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, en as unknown);
}

const sample: CampaignResultsItemDAO = {
  note_id: 'n1',
  name: 'Morning special',
  status: 'active',
  ended_at: null,
  expires_at: '2026-12-01T00:00:00Z',
  currency: 'usd',
  spend_cents: 5000,
  redeemed: 96,
  sales_cents: null,
  roas: null,
  description: 'Bun deal',
  expire_after: '7d',
  is_redeemable: true,
};

describe('formatSpendCents', () => {
  it('formats whole dollars without cents', () => {
    expect(formatSpendCents(5000, 'usd')).toMatch(/\$50/);
  });

  it('formats fractional dollars', () => {
    expect(formatSpendCents(750, 'usd')).toMatch(/\$7\.50/);
  });
});

describe('formatEfficiency', () => {
  it('formats finite values with ×', () => {
    expect(formatEfficiency(1.92)).toBe('1.9×');
    expect(formatEfficiency(15.4)).toBe('15×');
  });

  it('returns em dash for null/invalid', () => {
    expect(formatEfficiency(null)).toBe('—');
    expect(formatEfficiency(undefined)).toBe('—');
    expect(formatEfficiency(Number.NaN)).toBe('—');
  });
});

describe('formatCampaignCaption', () => {
  it('includes name, spend, and redeemed', () => {
    const caption = formatCampaignCaption(sample);
    expect(caption).toContain('Morning special');
    expect(caption).toContain('96 ✓');
    expect(caption).toMatch(/\$50/);
  });
});

describe('expireAfterLabelKey', () => {
  it('maps known presets', () => {
    expect(expireAfterLabelKey('7d')).toBe('businessHome.sheets.setup.duration.7d');
    expect(expireAfterLabelKey('never')).toBe('businessHome.sheets.setup.duration.never');
  });

  it('falls back for unknown or null', () => {
    expect(expireAfterLabelKey(null)).toBe('businessHome.sheets.setup.duration.unknown');
    expect(expireAfterLabelKey('weird')).toBe('businessHome.sheets.setup.duration.unknown');
  });
});

describe('insight keys and params', () => {
  const insight: CampaignResultsInsightDAO = {
    status: 'ready',
    headline_key: 'better',
    ratio: 3.49,
    current_redeemed_per_dollar: 1.92,
    previous_redeemed_per_dollar: 0.55,
  };

  it('maps headline and meaning keys', () => {
    expect(insightHeadlineI18nKey('better')).toBe(
      'businessHome.sheets.compare.insight.better',
    );
    expect(insightMeaningI18nKey('single')).toBe(
      'businessHome.sheets.compare.meaning.single',
    );
  });

  it('builds copy params with formatted ratio', () => {
    const previous: CampaignResultsItemDAO = {
      ...sample,
      note_id: 'n2',
      name: 'Afternoon special',
      spend_cents: 4000,
      redeemed: 22,
    };
    const params = insightCopyParams(insight, sample, previous);
    expect(params.ratio).toBe('3.5×');
    expect(params.currentName).toBe('Morning special');
    expect(params.previousName).toBe('Afternoon special');
    expect(params.currentRedeemed).toBe(96);
  });
});

describe('compareSheetView', () => {
  it('returns loading / error / empty / single / ready', () => {
    expect(
      compareSheetView({
        isLoading: true,
        isError: false,
        campaign: null,
        previous: null,
      }),
    ).toBe('loading');
    expect(
      compareSheetView({
        isLoading: false,
        isError: true,
        campaign: null,
        previous: null,
      }),
    ).toBe('error');
    expect(
      compareSheetView({
        isLoading: false,
        isError: false,
        campaign: null,
        previous: null,
      }),
    ).toBe('empty');
    expect(
      compareSheetView({
        isLoading: false,
        isError: false,
        campaign: sample,
        previous: null,
      }),
    ).toBe('single');
    expect(
      compareSheetView({
        isLoading: false,
        isError: false,
        campaign: sample,
        previous: sample,
      }),
    ).toBe('ready');
  });
});

describe('locale keys exist', () => {
  const keys = [
    'businessHome.sheets.compare.insight.better',
    'businessHome.sheets.compare.insight.worse',
    'businessHome.sheets.compare.insight.similar',
    'businessHome.sheets.compare.insight.single',
    'businessHome.sheets.compare.insight.none',
    'businessHome.sheets.compare.meaning.better',
    'businessHome.sheets.compare.meaning.worse',
    'businessHome.sheets.compare.meaning.similar',
    'businessHome.sheets.compare.meaning.single',
    'businessHome.sheets.compare.meaning.none',
    'businessHome.sheets.compare.insufficient',
    'businessHome.sheets.compare.empty',
    'businessHome.sheets.compare.error',
    'businessHome.sheets.compare.retry',
    'businessHome.sheets.snapshot.title',
    'businessHome.sheets.snapshot.empty',
    'businessHome.sheets.setup.title',
    'businessHome.sheets.setup.duration.7d',
    'businessHome.sheets.setup.duration.unknown',
    'businessHome.sheets.setup.noDescription',
    'businessHome.campaign.paidNote',
    'businessHome.campaign.efficiency',
    'businessHome.sheets.compare.loading',
    'businessHome.sheets.snapshot.loading',
    'businessHome.sheets.setup.loading',
  ];

  it.each(keys)('%s', (key) => {
    expect(typeof lookup(key)).toBe('string');
  });
});
