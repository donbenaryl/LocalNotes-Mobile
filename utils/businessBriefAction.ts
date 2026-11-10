import type {
  BusinessBriefActionDAO,
  BusinessBriefActionKey,
  BusinessBriefActionStatus,
  BusinessBriefActiveActionDAO,
  BusinessBriefCta,
  BusinessBriefStatus,
  BusinessBriefVerdict,
} from '@/http/business-api/types';
import {
  formatCount,
  formatRatePct,
  knownArchetype,
  type BriefTranslate,
} from '@/utils/businessBrief';

/** Pure logic behind the NEXT ACTIONS section and the plans sheet (Jest cannot render the .tsx). */

const ACTION = 'businessHome.action';
const BRIEF = 'businessHome.brief';

export const ACTION_KEY_LIST: readonly BusinessBriefActionKey[] = [
  'fill_profile_gaps',
  'add_shared_interest_tags',
  'feature_group_interests',
  'thank_recommenders',
  'feature_term',
  'extend_campaign',
  'refresh_offer',
];

export type CtaDestination =
  | { kind: 'offer_web' }
  | { kind: 'route'; path: '/edit-profile' | '/thank-you' }
  | { kind: 'prop'; name: 'customers' | 'campaign' };

const CTA_DESTINATIONS: Record<BusinessBriefCta, CtaDestination> = {
  create_offer_web: { kind: 'offer_web' },
  edit_profile: { kind: 'route', path: '/edit-profile' },
  thank_you: { kind: 'route', path: '/thank-you' },
  open_customers: { kind: 'prop', name: 'customers' },
  open_campaign: { kind: 'prop', name: 'campaign' },
};

/** One destination per CTA. An unknown CTA is `null` (a no-op). */
export function ctaDestination(cta: string | null | undefined): CtaDestination | null {
  return cta && Object.prototype.hasOwnProperty.call(CTA_DESTINATIONS, cta)
    ? CTA_DESTINATIONS[cta as BusinessBriefCta]
    : null;
}

export interface ActionCopyKeys {
  title: string;
  summary: string;
  step: string;
  did: string;
}

export function actionCopyKeys(key: string): ActionCopyKeys {
  return {
    title: `${ACTION}.title.${key}`,
    summary: `${ACTION}.summary.${key}`,
    step: `${ACTION}.step.${key}`,
    did: `${ACTION}.did.${key}`,
  };
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v !== '') : [];
}

/** Gap group -> readable label (the profile-health copy). `importantInfo` has no per-item label here. */
function gapLabel(group: string, tr: BriefTranslate): string {
  const key = `businessHome.profileHealth.gap.${group}`;
  const label = tr(key);
  return label === key || group === 'importantInfo' || group === 'importantInfoMany'
    ? tr('businessHome.profileHealth.gap.importantInfoFallback')
    : label;
}

/** Interpolation params for an action's title, summary and step. Aggregates only. */
export function actionParams(
  action: Pick<BusinessBriefActionDAO, 'params'>,
  tr: BriefTranslate,
): Record<string, string | number> {
  const p = action.params ?? {};
  const tags = stringList(p.tags);
  const gaps = stringList(p.gaps);
  const slug = knownArchetype(p.archetype);
  const count = typeof p.new_recommenders === 'number' ? p.new_recommenders : 0;
  return {
    archetype: tr(`${BRIEF}.archetype.${slug}`),
    tags: tags.join(', '),
    term: tags[0] ?? '',
    gaps: Array.from(new Set(gaps.map((g) => gapLabel(g, tr)))).join(', '),
    count,
  };
}

const RATE_METRICS: ReadonlySet<string> = new Set([
  'visit_save_rate',
  'visit_recommend_rate',
  'redemption_rate',
  'spotlight_save_rate',
]);

/** Rates as whole percentages, counts as numbers; '—' when missing. */
export function formatMetricValue(metric: string, value: number | null | undefined): string {
  if (RATE_METRICS.has(metric)) {
    const pct = formatRatePct(value);
    return pct === null ? '—' : `${pct}%`;
  }
  return formatCount(value) ?? '—';
}

export function metricName(metric: string, tr: BriefTranslate): string {
  const key = `${BRIEF}.metric.${metric}`;
  const label = tr(key);
  return label === key ? metric.replace(/_/g, ' ') : label;
}

function formatDate(iso: string | null | undefined, locale: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

/** Verdict wording; a missing or unknown verdict reads as inconclusive. */
export function verdictKey(verdict: BusinessBriefVerdict | string | null | undefined): BusinessBriefVerdict {
  return verdict === 'improved' || verdict === 'no_change' || verdict === 'declined' ? verdict : 'inconclusive';
}

/** The subtitle under the active-action title, chosen by status. */
export function activeActionSubtitle(
  active: BusinessBriefActiveActionDAO,
  tr: BriefTranslate,
  locale: string,
): string {
  const metric = metricName(active.target_metric, tr);
  if (active.status === 'started') {
    const date = formatDate(active.started_at, locale);
    return date
      ? tr(`${ACTION}.status.started`, { date })
      : tr(`${ACTION}.status.startedNoDate`);
  }
  if (active.status === 'measured') {
    const verdict = verdictKey(active.result?.verdict);
    return tr(`${ACTION}.verdict.${verdict}`, {
      did: tr(actionCopyKeys(active.key).did),
      metric,
      baseline: formatMetricValue(active.target_metric, active.baseline_value),
      value: formatMetricValue(active.target_metric, active.result?.value),
    });
  }
  // completed (or any other tracked status): day counter, with early progress when we have it
  const base = {
    day: active.day ?? 0,
    ofDays: active.of_days ?? 0,
    metric,
  };
  if (active.progress && active.progress.value !== null) {
    return tr(`${ACTION}.status.completedEarly`, {
      ...base,
      baseline: formatMetricValue(active.target_metric, active.baseline_value),
      value: formatMetricValue(active.target_metric, active.progress.value),
    });
  }
  return tr(`${ACTION}.status.completed`, base);
}

/** Only a `started` action can be marked done by the owner. */
export function canMarkDone(status: BusinessBriefActionStatus | string): boolean {
  return status === 'started';
}

export type NoActionLine = 'noAction' | 'alreadyTracking' | null;

/**
 * The muted line shown when there is no suggested action: "already tracking" when the brief
 * suppressed one, "no new action" for quiet or insight weeks, nothing while the brief is
 * insufficient or still building (THIS WEEK already explains those).
 */
export function noActionLine(
  status: BusinessBriefStatus | string,
  alreadyTracking: boolean,
): NoActionLine {
  if (status === 'insufficient_data' || status === 'building') return null;
  if (alreadyTracking) return 'alreadyTracking';
  if (status === 'quiet' || status === 'insight') return 'noAction';
  return null;
}

/** 0..100 progress for the bar; clamps day above `of_days` and treats a zero/missing total as 0. */
export function progressPercent(day: number | null | undefined, ofDays: number | null | undefined): number {
  if (!ofDays || ofDays <= 0 || !day || day <= 0) return 0;
  return Math.min(100, Math.round((day / ofDays) * 100));
}

/** Chip label key for a past plan: its verdict once measured, otherwise its status. */
export function pastPlanChipKey(
  status: BusinessBriefActionStatus | string,
  verdict: BusinessBriefVerdict | string | null | undefined,
): string {
  if (status === 'measured') return `${ACTION}.verdict.chip.${verdictKey(verdict)}`;
  if (status === 'expired') return `${ACTION}.verdict.chip.expired`;
  return `${ACTION}.status.${status === 'started' || status === 'completed' ? status : 'measured'}`;
}
