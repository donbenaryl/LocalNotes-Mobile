import type {
  ArchetypeSlug,
  BusinessBriefEvidenceRowDAO,
  BusinessBriefInsightDAO,
  BusinessBriefInsightKey,
  BusinessBriefInsufficientDAO,
  BusinessBriefQuietSummaryDAO,
  BusinessBriefVolumeDAO,
} from '@/http/business-api/types';

/** Pure logic behind the THIS WEEK section (Jest cannot render the .tsx). */

export type BriefTranslate = (
  key: string,
  params?: Record<string, string | number>,
) => string;

const BRIEF = 'businessHome.brief';

export const ARCHETYPE_SLUG_LIST: readonly ArchetypeSlug[] = [
  'explorer',
  'social_connector',
  'relaxed_local',
  'social_explorer',
  'adventurer',
  'tastemaker',
  'balanced',
];

export const INSIGHT_KEY_LIST: readonly BusinessBriefInsightKey[] = [
  'archetype_affinity',
  'untapped_match',
  'audience_alignment',
  'discovery_conversion_gap',
  'discovery_quality_up',
  'list_recommendations',
  'rising_term',
  'campaign_results',
  'visibility_change',
];

/** Keys whose copy differs by direction (`_up` / `_down` suffix). */
const DIRECTIONAL_KEYS: ReadonlySet<string> = new Set([
  'audience_alignment',
  'list_recommendations',
  'campaign_results',
  'visibility_change',
]);

/** The personality insights: they show audience chips. */
const PERSONALITY_KEYS: ReadonlySet<string> = new Set(['archetype_affinity', 'untapped_match']);

export type SupportingDataTarget = 'findyou' | 'customers' | 'campaign';

const SUPPORTING_TARGET: Record<BusinessBriefInsightKey, SupportingDataTarget> = {
  discovery_conversion_gap: 'findyou',
  discovery_quality_up: 'findyou',
  visibility_change: 'findyou',
  archetype_affinity: 'customers',
  untapped_match: 'customers',
  audience_alignment: 'customers',
  list_recommendations: 'customers',
  rising_term: 'customers',
  campaign_results: 'campaign',
};

/** Where "Supporting data" goes. An unknown key falls back to the customers page. */
export function supportingDataTarget(key: string): SupportingDataTarget {
  return SUPPORTING_TARGET[key as BusinessBriefInsightKey] ?? 'customers';
}

/** Archetype slug the locale knows, else `unknown`. */
export function knownArchetype(slug: unknown): ArchetypeSlug | 'unknown' {
  return ARCHETYPE_SLUG_LIST.includes(slug as ArchetypeSlug) ? (slug as ArchetypeSlug) : 'unknown';
}

export interface InsightCopyKeys {
  headline: string;
  evidence: string;
  why: string;
}

/**
 * Full i18n keys for an insight. Directional insights use `<key>_up` / `<key>_down`
 * (a missing direction reads as `up`). `archetype_affinity` uses `why_leanings` when the
 * group has leanings to mention.
 */
export function insightCopyKeys(insight: Pick<BusinessBriefInsightDAO, 'key' | 'direction' | 'params'>): InsightCopyKeys {
  const base = DIRECTIONAL_KEYS.has(insight.key)
    ? `${BRIEF}.insight.${insight.key}_${insight.direction === 'down' ? 'down' : 'up'}`
    : `${BRIEF}.insight.${insight.key}`;
  const hasLeanings = insight.key === 'archetype_affinity' && stringList(insight.params.top_leanings).length > 0;
  return {
    headline: `${base}.headline`,
    evidence: `${base}.evidence`,
    why: `${base}.${hasLeanings ? 'why_leanings' : 'why'}`,
  };
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v !== '') : [];
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Whole percentage of a 0..1 rate; half rounds up (0.075 -> 8). Null for a missing rate. */
export function formatRatePct(rate: number | null | undefined): string | null {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return null;
  // The epsilon absorbs binary error: 0.075 * 100 is 7.499999999999999.
  return String(Math.round(rate * 100 + 1e-9));
}

/** A count for display: whole numbers as is, otherwise one decimal ("1.5"). */
export function formatCount(value: number | null | undefined): string | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function pctOrDash(rate: unknown): string {
  return formatRatePct(num(rate)) ?? '—';
}

function absRounded(value: unknown): string {
  const n = num(value);
  return n === null ? '—' : String(Math.round(Math.abs(n)));
}

function metricLabel(metric: unknown, tr: BriefTranslate): string {
  return typeof metric === 'string' && metric ? tr(`${BRIEF}.metric.${metric}`) : '';
}

function leaningLabel(slug: string, tr: BriefTranslate): string {
  const key = `${BRIEF}.leaning.${slug}`;
  const label = tr(key);
  // i18next returns the key itself for a missing entry: show the slug instead.
  return label === key ? slug.replace(/-/g, ' ') : label;
}

function channelLabel(channel: unknown, tr: BriefTranslate): string | null {
  if (typeof channel !== 'string' || !channel) return null;
  const key = `${BRIEF}.channel.${channel}`;
  const label = tr(key);
  return label === key ? tr(`${BRIEF}.channel.other`) : label;
}

/** Interpolation params for an insight's headline, evidence and why. */
export function insightParams(
  insight: Pick<BusinessBriefInsightDAO, 'key' | 'params'>,
  tr: BriefTranslate,
): Record<string, string | number> {
  const p = insight.params;
  const out: Record<string, string | number> = {};
  const archetype = knownArchetype(p.archetype);
  switch (insight.key) {
    case 'archetype_affinity':
      out.archetype = tr(`${BRIEF}.archetype.${archetype}`);
      out.liftPct = absRounded(p.lift_pct);
      out.verb = tr(`${BRIEF}.verb.${p.metric === 'visit_recommend_rate' ? 'recommend' : 'save'}`);
      out.leanings = stringList(p.top_leanings)
        .slice(0, 3)
        .map((l) => leaningLabel(l, tr))
        .join(', ');
      break;
    case 'untapped_match':
      out.archetype = tr(`${BRIEF}.archetype.${archetype}`);
      out.avgMatch = absRounded(p.avg_match);
      break;
    case 'audience_alignment':
      out.saversMatch = absRounded(p.avg_match_savers);
      out.visitorsMatch = absRounded(p.avg_match_visitors);
      break;
    case 'discovery_conversion_gap':
      out.reach = metricLabel(p.reach_metric, tr);
      out.changePct = absRounded(p.reach_change_pct);
      out.rate = pctOrDash(p.rate);
      out.baselineRate = pctOrDash(p.baseline_rate);
      break;
    case 'discovery_quality_up':
      out.rate = pctOrDash(p.rate);
      out.baselineRate = pctOrDash(p.baseline_rate);
      break;
    case 'list_recommendations':
      out.metric = metricLabel(p.metric, tr);
      out.current = formatCount(num(p.current)) ?? '—';
      out.baseline = formatCount(num(p.baseline)) ?? '—';
      break;
    case 'rising_term':
      out.term = typeof p.term === 'string' ? p.term : '';
      out.accounts = formatCount(num(p.accounts)) ?? '—';
      out.baseline = formatCount(num(p.baseline)) ?? '—';
      break;
    case 'campaign_results':
      out.metric = metricLabel(p.metric, tr);
      out.rate = pctOrDash(p.rate);
      out.baselineRate = pctOrDash(p.baseline_rate);
      break;
    case 'visibility_change':
      out.metric = metricLabel(p.metric, tr);
      out.changePct = absRounded(p.change_pct);
      break;
    default:
      break;
  }
  return out;
}

/** True when the insight is a personality one (shows audience chips). */
export function isPersonalityInsight(key: string): boolean {
  return PERSONALITY_KEYS.has(key);
}

/**
 * Audience chips for a personality insight: the archetype, up to 3 interests, and the channel.
 * Interests are the group's shared interests (affinity) or missing interests (untapped).
 */
export function audienceChips(
  insight: Pick<BusinessBriefInsightDAO, 'key' | 'params'>,
  tr: BriefTranslate,
): string[] {
  if (!PERSONALITY_KEYS.has(insight.key)) return [];
  const p = insight.params;
  const chips = [tr(`${BRIEF}.archetype.${knownArchetype(p.archetype)}`)];
  const interests = insight.key === 'archetype_affinity' ? p.shared_interests : p.missing_interests;
  chips.push(...stringList(interests).slice(0, 3));
  const channel = channelLabel(p.top_channel, tr);
  if (channel) chips.push(tr(`${BRIEF}.foundVia`, { channel }));
  return chips;
}

export interface FormattedEvidenceRow {
  label: string;
  value: string;
  /** "was 11%"; null when there is no baseline. */
  was: string | null;
}

/** Rates as whole percentages, counts as numbers, baseline as "was ...". */
export function formatEvidenceRow(row: BusinessBriefEvidenceRowDAO, tr: BriefTranslate): FormattedEvidenceRow {
  const isRate = row.kind === 'rate';
  const format = (v: number | null) => (isRate ? (formatRatePct(v) === null ? null : `${formatRatePct(v)}%`) : formatCount(v));
  const metric = metricLabel(row.metric, tr);
  const base = metric.charAt(0).toUpperCase() + metric.slice(1);
  const scope = row.scope && row.scope !== '' ? scopeLabel(row.scope, tr) : null;
  const baseline = format(row.baseline);
  return {
    label: scope ? `${scope} · ${base}` : base,
    value: format(row.current) ?? tr(`${BRIEF}.evidence.none`),
    was: baseline === null ? null : tr(`${BRIEF}.evidence.was`, { baseline }),
  };
}

function scopeLabel(scope: string, tr: BriefTranslate): string {
  return ARCHETYPE_SLUG_LIST.includes(scope as ArchetypeSlug) ? tr(`${BRIEF}.archetype.${scope}`) : scope;
}

/** At most 3 rows, as the plan specifies; empty hides the card. */
export function formatEvidenceRows(
  rows: BusinessBriefEvidenceRowDAO[] | null | undefined,
  tr: BriefTranslate,
): FormattedEvidenceRow[] {
  return (rows ?? []).slice(0, 3).map((r) => formatEvidenceRow(r, tr));
}

/** How many more of a metric are needed, never negative. */
export function neededMore(insufficient: Pick<BusinessBriefInsufficientDAO, 'current' | 'needed'>): number {
  return Math.max(0, Math.ceil(insufficient.needed - insufficient.current));
}

/** Copy key and params for the `insufficient_data` state. */
export function insufficientCopy(insufficient: BusinessBriefInsufficientDAO | null): {
  key: string;
  params: Record<string, number>;
} {
  if (!insufficient) return { key: `${BRIEF}.insufficientBody`, params: { needed: 0 } };
  return {
    key: insufficient.metric === 'baseline_weeks' ? `${BRIEF}.insufficientWeeks` : `${BRIEF}.insufficientBody`,
    params: { needed: neededMore(insufficient) },
  };
}

/** Copy key and params for the `quiet` state. Without a summary it says only that it was steady. */
export function quietCopy(summary: BusinessBriefQuietSummaryDAO | null): {
  key: string;
  params: Record<string, string | number>;
} {
  const rate = formatRatePct(summary?.visit_save_rate);
  if (!summary || rate === null) return { key: `${BRIEF}.quietBodyShort`, params: {} };
  return { key: `${BRIEF}.quietBody`, params: { visitors: summary.visitors, rate } };
}

/** Params for "Based on {{visitors}} profile visitors and {{savers}} savers". */
export function footnoteParams(volume: BusinessBriefVolumeDAO | null | undefined): {
  visitors: number;
  savers: number;
} {
  return { visitors: volume?.visitors ?? 0, savers: volume?.savers ?? 0 };
}

/** "Nov 2 – Nov 8" from ISO dates (parsed as local dates to avoid a timezone shift); '' if invalid. */
export function formatBriefPeriod(
  start: string | null | undefined,
  end: string | null | undefined,
  locale: string,
): string {
  const parse = (iso: string | null | undefined): Date | null => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const from = parse(start);
  const to = parse(end);
  if (!from || !to) return '';
  const fmt = (d: Date) => d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  return `${fmt(from)} – ${fmt(to)}`;
}
