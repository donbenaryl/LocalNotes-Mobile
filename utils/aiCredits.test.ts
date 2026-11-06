import en from '@/locales/en';
import type {
  AiCreditsDAO,
  CopilotCostBreakdownDAO,
} from '@/http/business-api/types';
import fixtures from './aiCredits.fixtures.json';
import {
  aiCreditsDetailQueryKey,
  aiCreditsQueryKey,
  AI_CREDITS_QUERY_KEY,
  averageCredits,
  canAskCopilot,
  conversationLength,
  creditsLevel,
  creditsPercent,
  dailyBarDetail,
  dailyBarLabels,
  dailyBarValues,
  featureLabelKey,
  formatCostBreakdown,
  formatCostCalculation,
  formatTokens,
  getErrorStatusCode,
  historyMonthLabel,
  isAiCreditsEnabled,
  isCreditsExhaustedError,
  isCreditsNotEntitledError,
  isShortenedAnswerBudget,
  levelOf,
  resetCountdown,
  resetLabel,
  showTeamRows,
  toStatusError,
  toolDataLabelKey,
  usedByTeam,
} from './aiCredits';

function lookup(key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined,
      en,
    );
}

/** Interpolating `t` over the real locale, with i18next-style `_one` / `_other` plurals. */
const t = (key: string, options?: Record<string, unknown>) => {
  let raw = lookup(key);
  if (typeof raw !== 'string' && typeof options?.count === 'number') {
    raw = lookup(`${key}_${options.count === 1 ? 'one' : 'other'}`);
  }
  const text = typeof raw === 'string' ? raw : `MISSING:${key}`;
  return text.replace(/\{\{(\w+)\}\}/g, (_m, name) => String(options?.[name] ?? `{{${name}}}`));
};

const breakdown = (over: Partial<CopilotCostBreakdownDAO> = {}): CopilotCostBreakdownDAO => ({
  model_calls: 2,
  tool_labels: ['view_sources'],
  prompt_tokens: 26000,
  completion_tokens: 440,
  output_weight: 5,
  weighted_tokens: 28200,
  tokens_per_credit: 15000,
  raw_credits: 1.88,
  credits_charged: 2,
  capped_by: null,
  ...over,
});

describe('query keys and enabled predicate', () => {
  it('includes business and branch, and the detail key shares the light key prefix', () => {
    const light = aiCreditsQueryKey('b1', 'br1');
    const detail = aiCreditsDetailQueryKey('b1', 'br1');
    expect(light).toEqual([AI_CREDITS_QUERY_KEY, 'b1', 'br1']);
    expect(detail.slice(0, 3)).toEqual(light);
    expect(aiCreditsQueryKey('b1', 'br2')).not.toEqual(light);
  });

  it('is enabled only for a business, a branch and a paid branch', () => {
    expect(isAiCreditsEnabled({ businessId: 'b', branchId: 'x', isPaid: true })).toBe(true);
    expect(isAiCreditsEnabled({ businessId: 'b', branchId: null, isPaid: true })).toBe(false);
    expect(isAiCreditsEnabled({ businessId: '', branchId: 'x', isPaid: true })).toBe(false);
    expect(isAiCreditsEnabled({ businessId: 'b', branchId: 'x', isPaid: false })).toBe(false);
  });
});

describe('error mapping', () => {
  it('keeps the status code on the thrown error', () => {
    const error = toStatusError({ message: 'nope', statusCode: 429 });
    expect(error.message).toBe('nope');
    expect(getErrorStatusCode(error)).toBe(429);
    expect(isCreditsExhaustedError(error)).toBe(true);
  });

  it('recognises 429 and 403 only', () => {
    expect(isCreditsExhaustedError(toStatusError({ message: '', statusCode: 403 }))).toBe(false);
    expect(isCreditsExhaustedError(toStatusError({ message: '', statusCode: 500 }))).toBe(false);
    expect(isCreditsExhaustedError(new Error('x'))).toBe(false);
    expect(isCreditsExhaustedError(null)).toBe(false);
    expect(isCreditsExhaustedError('429')).toBe(false);
    expect(isCreditsNotEntitledError(toStatusError({ message: '', statusCode: 403 }))).toBe(true);
  });
});

describe('credits level', () => {
  it('moves normal -> warning at 80% and empty at 0 left', () => {
    expect(creditsLevel(79, 31)).toBe('normal');
    expect(creditsLevel(80, 30)).toBe('warning');
    expect(creditsLevel(99, 1)).toBe('warning');
    expect(creditsLevel(100, 0)).toBe('empty');
    expect(creditsLevel(10, 0)).toBe('empty');
  });

  it('computes the used percent safely', () => {
    expect(creditsPercent(120, 150)).toBe(80);
    expect(creditsPercent(0, 150)).toBe(0);
    expect(creditsPercent(200, 150)).toBe(100);
    expect(creditsPercent(5, 0)).toBe(100);
    expect(creditsPercent(-5, 150)).toBe(0);
  });

  it('reads the level from the credits payload', () => {
    expect(levelOf({ percent: 85, remaining: 20 })).toBe('warning');
  });

  it('flags a shortened answer budget under the per-answer maximum', () => {
    const credits = (remaining: number) =>
      ({ remaining, pricing: fixtures.pricing }) as Pick<AiCreditsDAO, 'remaining' | 'pricing'>;
    expect(isShortenedAnswerBudget(credits(4))).toBe(true);
    expect(isShortenedAnswerBudget(credits(5))).toBe(false);
    expect(isShortenedAnswerBudget(credits(0))).toBe(false);
  });

  it('allows asking while credits load or remain', () => {
    expect(canAskCopilot(undefined)).toBe(true);
    expect(canAskCopilot({ remaining: 1 })).toBe(true);
    expect(canAskCopilot({ remaining: 0 })).toBe(false);
  });
});

describe('reset countdown', () => {
  const now = new Date('2026-11-30T12:00:00Z');

  it('shows hours under 24 hours away and days from then on', () => {
    expect(resetCountdown('2026-12-01T11:00:00Z', now, t)).toBe('in 23 hours');
    expect(resetCountdown('2026-12-01T12:00:00Z', now, t)).toBe('in 1 day');
    expect(resetCountdown('2026-12-02T00:00:00Z', now, t)).toBe('in 2 days');
  });

  it('counts the last hour as 1 hour, never 0', () => {
    expect(resetCountdown('2026-11-30T12:20:00Z', now, t)).toBe('in 1 hour');
  });

  it('reads "any moment now" at or past the reset', () => {
    expect(resetCountdown('2026-11-30T12:00:00Z', now, t)).toBe('any moment now');
    expect(resetCountdown('2026-11-29T12:00:00Z', now, t)).toBe('any moment now');
    expect(resetCountdown('garbage', now, t)).toBe('any moment now');
  });

  it('uses absolute time, so a DST change between now and the reset does not move it', () => {
    // 30 days of 24 h each, whatever the local clock does in between.
    const start = new Date('2026-03-01T00:00:00Z');
    expect(resetCountdown('2026-03-31T00:00:00Z', start, t)).toBe('in 30 days');
  });

  it('rolls December into January and formats the local date', () => {
    const label = resetLabel('2027-01-01T00:00:00Z', new Date('2026-12-31T00:00:00Z'), t, 'en-US');
    expect(label.countdown).toBe('in 1 day');
    expect(label.date).toMatch(/\d/);
    expect(resetLabel('nope', now, t).date).toBe('');
  });
});

describe('history and usage page helpers', () => {
  it('labels a period start as a UTC month', () => {
    expect(historyMonthLabel('2026-11-01')).toBe('Nov 2026');
    expect(historyMonthLabel('2027-01-01')).toBe('Jan 2027');
    expect(historyMonthLabel('bad')).toBe('bad');
  });

  it('maps features to labels with a fallback', () => {
    expect(featureLabelKey('copilot_question')).toBe('businessHome.aiCredits.features.copilot_question');
    expect(featureLabelKey('campaign_draft')).toBe('businessHome.aiCredits.features.other');
    expect(typeof lookup(featureLabelKey('copilot_question'))).toBe('string');
    expect(typeof lookup(featureLabelKey('zzz'))).toBe('string');
  });

  it('shows team rows only for more than one account and splits used credits', () => {
    expect(showTeamRows(1)).toBe(false);
    expect(showTeamRows(2)).toBe(true);
    expect(usedByTeam(30, 12)).toBe(18);
    expect(12 + usedByTeam(30, 12)).toBe(30);
    expect(usedByTeam(5, 9)).toBe(0);
  });

  it('turns daily credits into bar values, labels and details', () => {
    const daily = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-11-${String(i + 1).padStart(2, '0')}`,
      credits: i,
    }));
    expect(dailyBarValues(daily)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(dailyBarLabels(daily)).toEqual({ 0: '1', 7: '8' });
    expect(dailyBarDetail(daily, 2, t)).toBe('Nov 3 · 2 credits');
    expect(dailyBarDetail(daily, 99, t)).toBe('');
    expect(dailyBarLabels([{ date: '2026-11-01', credits: 0 }])).toEqual({ 0: '1' });
  });

  it('averages credits per question without dividing by zero', () => {
    expect(averageCredits(10, 4)).toBe('2.5');
    expect(averageCredits(0, 0)).toBe('0');
  });
});

describe('conversation length', () => {
  it.each([
    [14_999, 1, 'short'],
    [15_000, 1, 'medium'],
    [30_000, 1, 'medium'],
    [30_001, 1, 'long'],
    [60_000, 2, 'medium'],
  ])('%i prompt tokens over %i call(s) is %s', (prompt, calls, expected) => {
    expect(conversationLength({ prompt_tokens: prompt, model_calls: calls })).toBe(expected);
  });

  it('guards zero model calls', () => {
    expect(conversationLength({ prompt_tokens: 100, model_calls: 0 })).toBe('short');
  });
});

describe('formatTokens', () => {
  it('groups thousands', () => {
    expect(formatTokens(14000)).toBe('14,000');
    expect(formatTokens(104500)).toBe('104,500');
    expect(formatTokens(320)).toBe('320');
    expect(formatTokens(0)).toBe('0');
  });
});

describe('cost sheet content (backend worked examples)', () => {
  it.each(fixtures.examples)('reproduces "$name"', (example) => {
    const b = breakdown({
      model_calls: example.model_calls,
      tool_labels: example.tool_labels,
      prompt_tokens: example.prompt_tokens,
      completion_tokens: example.completion_tokens,
      weighted_tokens: example.weighted,
      raw_credits: Number(example.raw),
      credits_charged: example.charged,
      capped_by: example.capped_by as CopilotCostBreakdownDAO['capped_by'],
    });
    const calc = formatCostCalculation(b, t);
    expect(calc.rawCredits).toBe(example.raw);
    expect(calc.creditsCharged).toBe(example.charged);
    const division = calc.lines.find((line) => line.id === 'division');
    expect(division?.text).toContain(`= ${example.raw}`);
    expect(division?.text).toContain(`rounded up to ${example.rounded}`);
    expect(division?.text).toContain(formatTokens(example.weighted));
    // Weighted total is read + weight x written, exactly as the backend computes it.
    expect(example.prompt_tokens + fixtures.pricing.output_weight * example.completion_tokens).toBe(
      example.weighted,
    );
    expect(calc.lines.some((line) => line.id === 'charged')).toBe(
      example.capped_by !== null || example.rounded !== example.charged,
    );
    expect(calc.lines.map((line) => line.text).join(' ')).not.toContain('MISSING');
    expect(calc.tokenExplainer).not.toContain('MISSING');
  });

  it('rows read, written and total match the stored tokens', () => {
    const calc = formatCostCalculation(breakdown(), t);
    expect(calc.lines[0].text).toBe('Read: 26,000 tokens');
    expect(calc.lines[1].text).toBe('Written: 440 tokens x 5 = 2,200');
    expect(calc.lines[2].text).toBe('Total: 28,200 weighted tokens');
    expect(calc.lines[3].text).toBe('28,200 / 15,000 = 1.88, rounded up to 2');
  });

  it('shows the 1-credit minimum as a charged line', () => {
    const calc = formatCostCalculation(
      breakdown({ prompt_tokens: 0, completion_tokens: 0, weighted_tokens: 0, raw_credits: 0, credits_charged: 1 }),
      t,
    );
    expect(calc.lines.find((line) => line.id === 'charged')?.text).toBe('Charged: 1 credit');
  });

  it('exact boundaries do not round up an extra credit', () => {
    const calc = formatCostCalculation(
      breakdown({ prompt_tokens: 30000, completion_tokens: 0, weighted_tokens: 30000, raw_credits: 2, credits_charged: 2 }),
      t,
    );
    expect(calc.lines[3].text).toContain('rounded up to 2');
  });

  it('summarises data checked, steps and length, with the cap note when capped', () => {
    const plain = formatCostBreakdown(breakdown({ tool_labels: ['view_sources', 'lists', 'lists'] }), t);
    expect(plain.rows.find((r) => r.id === 'dataChecked')?.value).toBe('Your view sources, Your lists');
    expect(plain.rows.find((r) => r.id === 'steps')?.value).toBe('2');
    expect(plain.rows.find((r) => r.id === 'conversationLength')?.value).toBe('Short');
    const medium = formatCostBreakdown(breakdown({ prompt_tokens: 40000 }), t);
    expect(medium.rows.find((r) => r.id === 'conversationLength')?.value).toBe('Medium');
    expect(plain.capNote).toBeNull();
    expect(plain.whyLine).toContain('longer conversations');

    const none = formatCostBreakdown(breakdown({ tool_labels: [], model_calls: 1, prompt_tokens: 12000 }), t);
    expect(none.rows[0].value).toBe('Answered from your summary');
    expect(none.rows[2].value).toBe('Short');

    expect(formatCostBreakdown(breakdown({ capped_by: 'max', credits_charged: 5 }), t, 5).capNote).toBe(
      'Capped at the 5-credit maximum',
    );
    expect(formatCostBreakdown(breakdown({ capped_by: 'reserved', credits_charged: 2 }), t).capNote).toBe(
      'Capped at the 2 credits you had left',
    );
  });

  it('falls back to "Your data" for an unknown tool label', () => {
    expect(t(toolDataLabelKey('brand_new_tool'))).toBe('Your data');
    expect(t(toolDataLabelKey('lists'))).toBe('Your lists');
  });

  it('titles the sheet with the charged credits (singular and plural)', () => {
    expect(t('businessHome.copilot.costSheet.title', { count: 1 })).toBe('This answer used 1 credit');
    expect(t('businessHome.copilot.costSheet.title', { count: 3 })).toBe('This answer used 3 credits');
  });

  it('never mentions money, models or cost text in the sheet strings', () => {
    const sheet = JSON.stringify(
      (en as unknown as { businessHome: { copilot: { costSheet: unknown } } }).businessHome.copilot.costSheet,
    ).toLowerCase();
    expect(sheet).not.toMatch(/usd|\$|haiku|gemini|sonnet|openrouter/);
  });
});
