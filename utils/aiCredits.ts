import type {
  AiCreditsDAO,
  AiCreditsDailyDAO,
  AiCreditsDetailDAO,
  CopilotCostBreakdownDAO,
} from '@/http/business-api/types';

/**
 * Pure helpers for AI credits (meter, usage page, cost sheets). Branch-scoped: every query key
 * carries the branch id so two branches never share a cache entry. The canonical credit
 * formula lives in the backend (`businesses/ai_credits/pricing.py`, plan.md "How credits are
 * calculated"); nothing here recomputes a charge, it only explains the stored numbers.
 */

/** Minimal i18n surface, so the helpers stay pure and testable without react-i18next. */
export type CreditsTranslate = (key: string, options?: Record<string, unknown>) => string;

const COPY = 'businessHome.aiCredits';
const COST = 'businessHome.copilot.costSheet';

// ---------------------------------------------------------------------------
// Query keys, enabled predicate, error mapping
// ---------------------------------------------------------------------------

/** Shared prefix: invalidating it refreshes both the light and the detail query. */
export const AI_CREDITS_QUERY_KEY = 'business-ai-credits';

export function aiCreditsQueryKey(businessId: string, branchId: string) {
  return [AI_CREDITS_QUERY_KEY, businessId, branchId] as const;
}

export function aiCreditsDetailQueryKey(businessId: string, branchId: string) {
  return [AI_CREDITS_QUERY_KEY, businessId, branchId, 'detail'] as const;
}

/** Credits queries run only for a selected, paid branch of a loaded business. */
export function isAiCreditsEnabled(params: {
  businessId?: string | null;
  branchId?: string | null;
  isPaid: boolean;
}): boolean {
  return Boolean(params.businessId) && Boolean(params.branchId) && params.isPaid;
}

/** An `Error` that keeps the HTTP status (`SendRequest` resolves errors, it does not throw). */
export type StatusError = Error & { statusCode?: number };

export function toStatusError(error: { message: string; statusCode: number }): StatusError {
  return Object.assign(new Error(error.message), { statusCode: error.statusCode });
}

export function getErrorStatusCode(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const code = (error as { statusCode?: unknown }).statusCode;
  return typeof code === 'number' ? code : undefined;
}

/** 429 `ai_credits_exhausted`. */
export function isCreditsExhaustedError(error: unknown): boolean {
  return getErrorStatusCode(error) === 429;
}

/** 403 `insights_membership_required` (branch not paid). */
export function isCreditsNotEntitledError(error: unknown): boolean {
  return getErrorStatusCode(error) === 403;
}

// ---------------------------------------------------------------------------
// Meter level
// ---------------------------------------------------------------------------

export type CreditsLevel = 'normal' | 'warning' | 'empty';

/** Mirrors the backend default `AI_CREDITS_WARN_PCT`; the API also sends `warn`. */
export const CREDITS_WARN_PERCENT = 80;

/** Used share of the allowance, 0-100, rounded. A zero allowance reads as fully used. */
export function creditsPercent(used: number, allowance: number): number {
  if (allowance <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((used / allowance) * 100)));
}

export function creditsLevel(
  percent: number,
  remaining: number,
  warnPercent: number = CREDITS_WARN_PERCENT,
): CreditsLevel {
  if (remaining <= 0) return 'empty';
  return percent >= warnPercent ? 'warning' : 'normal';
}

export function levelOf(credits: Pick<AiCreditsDAO, 'percent' | 'remaining'>): CreditsLevel {
  return creditsLevel(credits.percent, credits.remaining);
}

/** Answers are shortened server-side when fewer credits than the per-answer maximum are left. */
export function isShortenedAnswerBudget(
  credits: Pick<AiCreditsDAO, 'remaining' | 'pricing'>,
): boolean {
  return credits.remaining > 0 && credits.remaining < credits.pricing.max_per_answer;
}

export function canAskCopilot(credits: Pick<AiCreditsDAO, 'remaining'> | undefined): boolean {
  return credits === undefined || credits.remaining > 0;
}

// ---------------------------------------------------------------------------
// Reset label + countdown
// ---------------------------------------------------------------------------

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** "Dec 1, 8:00 AM" in the device's local time zone. */
export function resetDateLabel(resetsAt: string, locale?: string): string {
  const date = new Date(resetsAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * "in N days" / "in N hours" from the absolute time difference (so DST never skews it).
 * Under 24 hours counts hours (at least 1); past the reset it reads "any moment now".
 */
export function resetCountdown(resetsAt: string, now: Date, t: CreditsTranslate): string {
  const diff = new Date(resetsAt).getTime() - now.getTime();
  if (Number.isNaN(diff) || diff <= 0) return t(`${COPY}.page.resetsSoon`);
  if (diff < DAY_MS) {
    return t(`${COPY}.page.resetsInHours`, { count: Math.max(1, Math.ceil(diff / HOUR_MS)) });
  }
  return t(`${COPY}.page.resetsInDays`, { count: Math.ceil(diff / DAY_MS) });
}

export type ResetLabel = { date: string; countdown: string };

export function resetLabel(
  resetsAt: string,
  now: Date,
  t: CreditsTranslate,
  locale?: string,
): ResetLabel {
  return { date: resetDateLabel(resetsAt, locale), countdown: resetCountdown(resetsAt, now, t) };
}

/** "Nov 2026" for a `YYYY-MM-DD` period start (read as UTC, shown as UTC). */
export function historyMonthLabel(periodStart: string, locale = 'en-US'): string {
  const [year, month] = periodStart.split('-').map(Number);
  if (!year || !month) return periodStart;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(locale, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// ---------------------------------------------------------------------------
// Usage page helpers
// ---------------------------------------------------------------------------

const KNOWN_FEATURES = ['copilot_question'];

export function featureLabelKey(feature: string): string {
  return KNOWN_FEATURES.includes(feature)
    ? `${COPY}.features.${feature}`
    : `${COPY}.features.other`;
}

/** Team rows show only when more than one account works on the business. */
export function showTeamRows(teamSize: number): boolean {
  return teamSize > 1;
}

/** Credits used by other accounts; never negative. */
export function usedByTeam(used: number, usedByYou: number): number {
  return Math.max(0, used - usedByYou);
}

export function hasPendingCredits(detail: Pick<AiCreditsDetailDAO, 'reserved'>): boolean {
  return detail.reserved > 0;
}

export function dailyBarValues(daily: AiCreditsDailyDAO[]): number[] {
  return daily.map((day) => day.credits);
}

/** Day-of-month under the first bar and every 7th one. */
export function dailyBarLabels(daily: AiCreditsDailyDAO[]): Record<number, string> {
  const labels: Record<number, string> = {};
  daily.forEach((day, index) => {
    if (index % 7 === 0) labels[index] = String(Number(day.date.slice(8, 10)));
  });
  return labels;
}

export function dailyBarDetail(
  daily: AiCreditsDailyDAO[],
  index: number,
  t: CreditsTranslate,
  locale = 'en-US',
): string {
  const day = daily[index];
  if (!day) return '';
  const [year, month, date] = day.date.split('-').map(Number);
  const label = new Date(Date.UTC(year, month - 1, date)).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  return t(`${COPY}.page.dayDetail`, { date: label, credits: day.credits });
}

/** Average credits per question for a by-feature row; 0 questions reads 0, not NaN. */
export function averageCredits(credits: number, count: number): string {
  if (count <= 0) return '0';
  return String(Math.round((credits / count) * 10) / 10);
}

// ---------------------------------------------------------------------------
// Per-answer cost sheet
// ---------------------------------------------------------------------------

export type ConversationLength = 'short' | 'medium' | 'long';

export const SHORT_CONVERSATION_MAX_TOKENS = 15_000;
export const LONG_CONVERSATION_MIN_TOKENS = 30_000;

/** From input tokens per model call: under 15k short, 15-30k medium, over 30k long. */
export function conversationLength(
  breakdown: Pick<CopilotCostBreakdownDAO, 'prompt_tokens' | 'model_calls'>,
): ConversationLength {
  const perCall = breakdown.prompt_tokens / Math.max(1, breakdown.model_calls);
  if (perCall < SHORT_CONVERSATION_MAX_TOKENS) return 'short';
  if (perCall <= LONG_CONVERSATION_MIN_TOKENS) return 'medium';
  return 'long';
}

const LENGTH_KEY: Record<ConversationLength, string> = {
  short: 'lengthShort',
  medium: 'lengthMedium',
  long: 'lengthLong',
};

const DATA_LABEL_KEYS = [
  'offers',
  'lists',
  'thank_you_rewards',
  'list_changes',
  'list_categories',
  'spotlight',
  'customer_mix',
  'ads',
  'pick_notes',
  'smart_pick',
  'profile',
  'alerts',
  'insight_section',
  'metric_totals',
  'metric_series',
  'view_sources',
  'changes',
];

/** i18n key of a tool's "data checked" label; unknown tools read "Your data". */
export function toolDataLabelKey(toolLabel: string): string {
  return DATA_LABEL_KEYS.includes(toolLabel)
    ? `${COST}.data.${toolLabel}`
    : `${COST}.data.other`;
}

/** 14000 -> "14,000" (fixed grouping, so tests and devices agree). */
export function formatTokens(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export type CostRow = { id: string; label: string; value: string };

export type CostSummary = {
  rows: CostRow[];
  whyLine: string;
  /** Visible without expanding the calculation; null when nothing capped the charge. */
  capNote: string | null;
};

/** The always-visible part of the cost sheet: data checked, steps, length, why, cap note. */
export function formatCostBreakdown(
  breakdown: CopilotCostBreakdownDAO,
  t: CreditsTranslate,
  maxPerAnswer?: number,
): CostSummary {
  const checked = Array.from(new Set(breakdown.tool_labels));
  const dataChecked =
    checked.length === 0
      ? t(`${COST}.answeredFromSummary`)
      : checked.map((label) => t(toolDataLabelKey(label))).join(', ');

  let capNote: string | null = null;
  if (breakdown.capped_by === 'max') {
    capNote = t(`${COST}.cappedMax`, { max: maxPerAnswer ?? breakdown.credits_charged });
  } else if (breakdown.capped_by === 'reserved') {
    capNote = t(`${COST}.cappedReserved`, { count: breakdown.credits_charged });
  }

  return {
    rows: [
      { id: 'dataChecked', label: t(`${COST}.dataChecked`), value: dataChecked },
      { id: 'steps', label: t(`${COST}.steps`), value: String(breakdown.model_calls) },
      {
        id: 'conversationLength',
        label: t(`${COST}.conversationLength`),
        value: t(`${COST}.${LENGTH_KEY[conversationLength(breakdown)]}`),
      },
    ],
    whyLine: t(`${COST}.whyLine`),
    capNote,
  };
}

export type CostCalculation = {
  /** One line per step, in order: read, written, total, division, (charged when capped). */
  lines: { id: string; text: string }[];
  rawCredits: string;
  creditsCharged: number;
  tokenExplainer: string;
};

/** Integer ceiling division, so exact boundaries (15,000 / 30,000) never round up an extra credit. */
function ceilDiv(value: number, divisor: number): number {
  return divisor <= 0 ? 0 : Math.ceil(value / divisor);
}

/** The exact calculation behind "Show calculation", reproducing the stored charge. */
export function formatCostCalculation(
  breakdown: CopilotCostBreakdownDAO,
  t: CreditsTranslate,
): CostCalculation {
  const written = breakdown.completion_tokens * breakdown.output_weight;
  const raw = breakdown.raw_credits.toFixed(2);
  const rounded = ceilDiv(breakdown.weighted_tokens, breakdown.tokens_per_credit);
  const lines = [
    {
      id: 'read',
      text: t(`${COST}.read`, { tokens: formatTokens(breakdown.prompt_tokens) }),
    },
    {
      id: 'written',
      text: t(`${COST}.written`, {
        tokens: formatTokens(breakdown.completion_tokens),
        weight: breakdown.output_weight,
        weighted: formatTokens(written),
      }),
    },
    {
      id: 'total',
      text: t(`${COST}.total`, { weighted: formatTokens(breakdown.weighted_tokens) }),
    },
    {
      id: 'division',
      text: t(`${COST}.division`, {
        weighted: formatTokens(breakdown.weighted_tokens),
        perCredit: formatTokens(breakdown.tokens_per_credit),
        raw,
        rounded,
      }),
    },
  ];
  // A cap or the 1-credit minimum made the charge differ from the plain rounding: show it.
  if (breakdown.capped_by || rounded !== breakdown.credits_charged) {
    lines.push({
      id: 'charged',
      text: t(`${COST}.charged`, { count: breakdown.credits_charged }),
    });
  }
  return {
    lines,
    rawCredits: raw,
    creditsCharged: breakdown.credits_charged,
    tokenExplainer: t(`${COST}.tokenExplainer`),
  };
}
