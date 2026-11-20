import type {
  CampaignResultsInsightDAO,
  CampaignResultsInsightHeadlineKey,
  CampaignResultsItemDAO,
} from '@/http/business-api/types';

const EXPIRE_AFTER_LABEL_KEYS: Record<string, string> = {
  '1h': 'businessHome.sheets.setup.duration.1h',
  '24h': 'businessHome.sheets.setup.duration.24h',
  '7d': 'businessHome.sheets.setup.duration.7d',
  '30d': 'businessHome.sheets.setup.duration.30d',
  never: 'businessHome.sheets.setup.duration.never',
};

export function formatSpendCents(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
      maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

/** Big-number efficiency display: "1.9×" or "—". */
export function formatEfficiency(redeemedPerDollar: number | null | undefined): string {
  if (redeemedPerDollar == null || !Number.isFinite(redeemedPerDollar)) return '—';
  const rounded =
    Math.abs(redeemedPerDollar) >= 10
      ? Math.round(redeemedPerDollar)
      : Math.round(redeemedPerDollar * 10) / 10;
  return `${rounded}×`;
}

/** "Name · $50 · 96 ✓" for compare column captions. */
export function formatCampaignCaption(campaign: CampaignResultsItemDAO): string {
  const spend = formatSpendCents(campaign.spend_cents, campaign.currency);
  return `${campaign.name}\n${spend} · ${campaign.redeemed} ✓`;
}

export function expireAfterLabelKey(expireAfter: string | null | undefined): string {
  if (!expireAfter) return 'businessHome.sheets.setup.duration.unknown';
  return EXPIRE_AFTER_LABEL_KEYS[expireAfter] ?? 'businessHome.sheets.setup.duration.unknown';
}

export function insightHeadlineI18nKey(
  key: CampaignResultsInsightHeadlineKey,
): string {
  return `businessHome.sheets.compare.insight.${key}`;
}

export function insightMeaningI18nKey(
  key: CampaignResultsInsightHeadlineKey,
): string {
  return `businessHome.sheets.compare.meaning.${key}`;
}

/** Params for insight copy (ratio as "3.7×", etc.). */
export function insightCopyParams(
  insight: CampaignResultsInsightDAO | null | undefined,
  campaign: CampaignResultsItemDAO | null | undefined,
  previous: CampaignResultsItemDAO | null | undefined,
): Record<string, string | number> {
  const ratio =
    insight?.ratio != null && Number.isFinite(insight.ratio)
      ? formatEfficiency(insight.ratio)
      : '—';
  return {
    ratio,
    currentName: campaign?.name ?? '',
    previousName: previous?.name ?? '',
    currentRedeemed: campaign?.redeemed ?? 0,
    previousRedeemed: previous?.redeemed ?? 0,
    currentSpend: campaign
      ? formatSpendCents(campaign.spend_cents, campaign.currency)
      : '',
    previousSpend: previous
      ? formatSpendCents(previous.spend_cents, previous.currency)
      : '',
    currentEfficiency: formatEfficiency(insight?.current_redeemed_per_dollar),
    previousEfficiency: formatEfficiency(insight?.previous_redeemed_per_dollar),
  };
}

export type CampaignSheetView =
  | 'loading'
  | 'error'
  | 'empty'
  | 'single'
  | 'ready';

export function compareSheetView(args: {
  isLoading: boolean;
  isError: boolean;
  campaign: CampaignResultsItemDAO | null;
  previous: CampaignResultsItemDAO | null;
}): CampaignSheetView {
  if (args.isLoading) return 'loading';
  if (args.isError && !args.campaign) return 'error';
  if (!args.campaign) return 'empty';
  if (!args.previous) return 'single';
  return 'ready';
}
