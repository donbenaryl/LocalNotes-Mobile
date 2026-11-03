import type { BusinessInsightInterpretationDAO } from '@/http/business-api/types';
import { formatDelta } from '@/utils/insightsFormat';

/** Minimal translate signature so the util stays free of React / i18next imports. */
export type InterpretationTranslate = (
  key: string,
  options?: Record<string, unknown>,
) => string;

/** Query key prefix, shared with the pull-to-refresh invalidation. */
export const INTERPRETATION_QUERY_KEY = 'business-insight-interpretation';

const KNOWN_METRICS = ['views', 'saves'] as const;
const KNOWN_CHANNELS = [
  'search',
  'spotlight',
  'discovery',
  'profile',
  'notification',
  'share_link',
  'smart_pick',
  'recommendation',
  'offer',
] as const;

const isKnownMetric = (value: unknown): value is (typeof KNOWN_METRICS)[number] =>
  KNOWN_METRICS.includes(value as (typeof KNOWN_METRICS)[number]);
const isKnownChannel = (value: unknown): value is (typeof KNOWN_CHANNELS)[number] =>
  KNOWN_CHANNELS.includes(value as (typeof KNOWN_CHANNELS)[number]);

const BASE = 'businessHome.insight.auto';

type Driver = NonNullable<BusinessInsightInterpretationDAO['driver']>;

/** Driver clause plus how it joins the headline; null for unknown / unusable drivers. */
function buildDriverClause(
  driver: Driver | null | undefined,
  headline: { metric: string; direction: 'up' | 'down' },
  t: InterpretationTranslate,
): { text: string; joiner: ', and ' | ' ' } | null {
  if (!driver || !isKnownMetric(headline.metric)) return null;
  const metricLower = t(`${BASE}.metricLower.${headline.metric}`);

  switch (driver.type) {
    case 'channel': {
      if (!isKnownChannel(driver.key)) return null;
      const channel = t(`${BASE}.channel.${driver.key}`);
      const key =
        driver.strength === 'largest'
          ? 'channelLargest'
          : headline.direction === 'down'
            ? 'channelMostDown'
            : 'channelMost';
      return { text: t(`${BASE}.driver.${key}`, { metricLower, channel }), joiner: ', and ' };
    }
    case 'list_added':
    case 'list_removed': {
      if (!driver.list_name) return null;
      const key = driver.type === 'list_added' ? 'listAdded' : 'listRemoved';
      return { text: t(`${BASE}.driver.${key}`, { list: driver.list_name }), joiner: ' ' };
    }
    case 'top_list': {
      if (!driver.list_name) return null;
      return {
        text: t(`${BASE}.driver.topList`, { metricLower, list: driver.list_name }),
        joiner: ', and ',
      };
    }
    case 'pick_favorites':
      return { text: t(`${BASE}.driver.pickFavorites`), joiner: ', and ' };
    default:
      // A driver type added by a newer server: show the headline only.
      return null;
  }
}

/** Headline + optional driver clause + optional secondary clause. */
export function buildInterpretationSentence(
  data: BusinessInsightInterpretationDAO,
  t: InterpretationTranslate,
): string {
  if (data.kind === 'steady') return t(`${BASE}.headline.steady`);

  const headline = data.headline;
  if (!headline || !isKnownMetric(headline.metric)) return '';
  const direction = headline.direction === 'down' ? 'down' : 'up';

  let sentence = t(`${BASE}.headline.${direction}`, {
    metric: t(`${BASE}.metric.${headline.metric}`),
    pct: headline.delta_pct,
  });

  const clause = buildDriverClause(data.driver, { metric: headline.metric, direction }, t);
  sentence += clause ? `${clause.joiner}${clause.text}.` : '.';

  const secondary = data.secondary;
  if (
    secondary &&
    isKnownMetric(secondary.metric) &&
    (secondary.direction === 'up' || secondary.direction === 'down')
  ) {
    const word = secondary.direction === 'up' ? 'rose' : 'fell';
    sentence += ` ${t(`${BASE}.secondary`, {
      metric: t(`${BASE}.metric.${secondary.metric}`),
      direction: t(`${BASE}.direction.${word}`),
      pct: secondary.delta_pct,
    })}.`;
  }
  return sentence;
}

/** True when the error carries HTTP status 403 (no Business Insights membership). */
export function isNotEntitledError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { statusCode?: unknown }).statusCode === 403
  );
}

export type InterpretationCardState =
  | { kind: 'loading' }
  | { kind: 'notEntitled' }
  | { kind: 'error' }
  | { kind: 'insufficient'; reason: 'low_volume' | 'no_previous' }
  | { kind: 'ready'; data: BusinessInsightInterpretationDAO };

export function getInterpretationCardState({
  isPending,
  error,
  data,
}: {
  isPending: boolean;
  error: unknown;
  data: BusinessInsightInterpretationDAO | undefined;
}): InterpretationCardState {
  if (error) return isNotEntitledError(error) ? { kind: 'notEntitled' } : { kind: 'error' };
  if (isPending) return { kind: 'loading' };
  if (!data) return { kind: 'error' };
  if (data.status === 'insufficient_data') {
    // Unknown or missing reasons use the generic low-volume copy.
    return {
      kind: 'insufficient',
      reason: data.reason === 'no_previous' ? 'no_previous' : 'low_volume',
    };
  }
  return { kind: 'ready', data };
}

function formatFreeDelta(change: number): string {
  return formatDelta(change) || '0%';
}

/** `{views, saves}` strings for the free card ("↑18%", "↓6%", "0%"). */
export function formatFreeBodyDeltas(topline: { viewsChange: number; savesChange: number }) {
  return {
    views: formatFreeDelta(topline.viewsChange),
    saves: formatFreeDelta(topline.savesChange),
  };
}
