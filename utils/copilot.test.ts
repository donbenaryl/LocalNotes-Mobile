import en from '@/locales/en';
import type {
  CopilotMessageDAO,
  CopilotThreadDAO,
  CopilotThreadSummaryDAO,
} from '@/http/business-api/types';
import { toStatusError } from './aiCredits';
import {
  activeThreadAfterDelete,
  appendSentMessages,
  canOpenCostSheet,
  canSendQuestion,
  COPILOT_MAX_MESSAGE_CHARS,
  COPILOT_POLL_INTERVAL_MS,
  COPILOT_POLL_MAX_MS,
  COPILOT_PROGRESS_KEYS,
  COPILOT_SOURCE_KEYS,
  copilotErrorState,
  copilotMessageQueryKey,
  copilotRefetchInterval,
  copilotThreadQueryKey,
  copilotThreadsQueryKey,
  flattenThreads,
  isPollExpired,
  isValidQuestion,
  latestFollowUps,
  markMessageFailed,
  mergeOlderMessages,
  newThreadShell,
  nextThreadsPageParam,
  parseAnswerBlocks,
  pendingMessage,
  prependThreadToCache,
  progressLabelKey,
  questionBeforeMessage,
  questionCount,
  removeThreadFromCache,
  renameThreadInCache,
  resolveOpenTarget,
  restoreSnapshot,
  shouldShowLongConversationHint,
  sourceChip,
  upsertMessage,
  validateThreadTitle,
  type CopilotThreadsData,
} from './copilot';

function lookup(key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined,
      en,
    );
}
const isString = (key: string) => typeof lookup(key) === 'string' && (lookup(key) as string) !== '';

const message = (over: Partial<CopilotMessageDAO> = {}): CopilotMessageDAO => ({
  id: 'm1',
  role: 'assistant',
  status: 'done',
  progress: null,
  content: 'answer',
  sources: [],
  follow_ups: [],
  credits_charged: 2,
  cost_breakdown: {
    model_calls: 1,
    tool_labels: [],
    prompt_tokens: 100,
    completion_tokens: 10,
    output_weight: 5,
    weighted_tokens: 150,
    tokens_per_credit: 15000,
    raw_credits: 0.01,
    credits_charged: 1,
    capped_by: null,
  },
  created_at: '2026-11-01T00:00:00Z',
  ...over,
});

const thread = (id: string, title = id): CopilotThreadSummaryDAO => ({
  id,
  branch_id: 'br1',
  title,
  last_message_at: '2026-11-01T00:00:00Z',
  message_count: 2,
  preview: '',
});

const threadsData = (...pages: CopilotThreadSummaryDAO[][]): CopilotThreadsData => ({
  pageParams: pages.map((_, i) => i + 1),
  pages: pages.map((threads, i) => ({
    threads,
    page: i + 1,
    next: i + 1 < pages.length ? i + 2 : null,
    total: pages.reduce((sum, p) => sum + p.length, 0),
  })),
});

const chat = (...messages: CopilotMessageDAO[]): CopilotThreadDAO => ({
  id: 't1',
  branch_id: 'br1',
  title: 'T',
  messages,
  has_more: false,
});

describe('i18n key parity', () => {
  it('resolves every source key and the generic fallback', () => {
    for (const key of COPILOT_SOURCE_KEYS) {
      expect(isString(`businessHome.copilot.sources.${key}`)).toBe(true);
    }
    expect(isString('businessHome.copilot.sources.other')).toBe(true);
  });

  it('resolves every progress key and the thinking fallback', () => {
    for (const key of COPILOT_PROGRESS_KEYS) {
      expect(isString(`businessHome.copilot.progress.${key}`)).toBe(true);
      expect(isString(`businessHome.copilot.costSheet.data.${key}`)).toBe(true);
    }
    expect(isString('businessHome.copilot.thinking')).toBe(true);
    expect(isString('businessHome.copilot.costSheet.data.other')).toBe(true);
  });

  it('has every static copilot and credits key the screens use', () => {
    const keys = [
      'title', 'newChatTitle', 'intro', 'placeholder', 'send', 'newChat', 'conversationsButton',
      'creditsHint', 'creditsHowLink', 'lowCreditsHint_one', 'lowCreditsHint_other', 'lowBanner',
      'exhaustedBanner', 'seeCredits', 'creditsCharged_one', 'creditsCharged_other',
      'creditsChargedHint', 'charCounter', 'longConversationHint', 'failed', 'retry', 'unavailable',
      'notEntitledBranch', 'notEntitledBody', 'upgradeCta', 'pendingExists', 'invalidMessage',
      'sendFailed', 'loadFailed', 'threadDeleted', 'loadOlder', 'suggestions.s1', 'suggestions.s5',
      'entry.title', 'entry.body', 'entry.resume', 'entry.example1', 'entry.example2',
      'conversations.title', 'conversations.newChat', 'conversations.empty',
      'conversations.untitled', 'conversations.rename', 'conversations.renameTitle',
      'conversations.renamePlaceholder', 'conversations.renameSave', 'conversations.renameTooLong',
      'conversations.renameEmpty', 'conversations.renameFailed', 'conversations.delete',
      'conversations.deleteConfirmTitle', 'conversations.deleteConfirmBody',
      'conversations.deleteFailed', 'conversations.options', 'conversations.error',
      'conversations.retry', 'conversations.retentionNote', 'costSheet.title_one',
      'costSheet.title_other', 'costSheet.showCalculation', 'costSheet.hideCalculation',
      'costSheet.sameModelPrice', 'costSheet.howLink', 'costSheet.lengthShort',
      'costSheet.lengthMedium', 'costSheet.lengthLong',
    ].map((k) => `businessHome.copilot.${k}`);
    keys.push(
      ...[
        'meter.full', 'meter.left', 'meter.compact', 'meter.resets', 'meter.low', 'meter.empty',
        'meter.seeCredits', 'page.title', 'page.left_one', 'page.left_other', 'page.ofAllowance',
        'page.resetsOn', 'page.noRollover', 'page.usedSoFar', 'page.usedSoFarPending',
        'page.remaining', 'page.monthlyAllowance', 'page.byYou', 'page.byTeam', 'page.byFeature',
        'page.featureRow', 'page.thisMonthByDay', 'page.previousMonths', 'page.monthRow',
        'page.howItWorksTitle', 'page.howItWorks.b1', 'page.howItWorks.b6', 'page.seeCalculation',
        'page.askCopilot', 'page.exhausted', 'page.error', 'page.retry', 'page.notEntitledBranch',
        'page.notEntitledBody', 'page.upgradeCta', 'page.navRow', 'page.navRowPreview',
        'howCalculated.title', 'howCalculated.steps.count', 'howCalculated.steps.weight',
        'howCalculated.steps.divide', 'howCalculated.steps.limits', 'howCalculated.formula',
        'howCalculated.typicalTitle', 'howCalculated.typicalRows.quick',
        'howCalculated.allowanceTitle', 'howCalculated.allowance', 'howCalculated.tipsTitle',
        'howCalculated.tips.t1', 'howCalculated.rulesTitle', 'howCalculated.rules.r3',
      ].map((k) => `businessHome.aiCredits.${k}`),
    );
    const missing = keys.filter((key) => !isString(key));
    expect(missing).toEqual([]);
  });

  it('fails the check for a key that does not exist', () => {
    expect(isString('businessHome.copilot.nope')).toBe(false);
  });
});

describe('query keys', () => {
  it('carry business and branch (and thread / message ids)', () => {
    expect(copilotThreadsQueryKey('b', 'x')).toEqual(['business-copilot-threads', 'b', 'x']);
    expect(copilotThreadQueryKey('b', 'x', 't')).toEqual(['business-copilot-thread', 'b', 'x', 't']);
    expect(copilotThreadQueryKey('b', 'x', null)[3]).toBeNull();
    expect(copilotThreadQueryKey('b', 'y', 't')).not.toEqual(copilotThreadQueryKey('b', 'x', 't'));
    expect(copilotMessageQueryKey('b', 'x', 'm')[3]).toBe('m');
  });
});

describe('source chips and progress labels', () => {
  it.each([
    ['customer_keywords', '/business-customers-detail'],
    ['personality', '/business-customers-detail'],
    ['differentiators', '/business-customers-detail'],
    ['demand_topics', '/business-demand-detail'],
    ['peak_hours', '/business-demand-detail'],
    ['performance', '/business-performance-detail'],
    ['metrics', '/business-performance-detail'],
    ['changes', '/business-performance-detail'],
    ['view_sources', '/business-performance-detail'],
    ['profile', '/edit-profile'],
    ['profile_health', '/edit-profile'],
  ])('%s opens %s', (key, route) => {
    expect(sourceChip(key).route).toBe(route);
  });

  it.each(['lists', 'notes', 'offers', 'spotlight', 'ads', 'smart_pick', 'alerts'])(
    '%s is label only',
    (key) => {
      expect(sourceChip(key).route).toBeNull();
      expect(sourceChip(key).labelKey).toBe(`businessHome.copilot.sources.${key}`);
    },
  );

  it('falls back to a label-only chip for an unknown key', () => {
    const chip = sourceChip('brand_new');
    expect(chip.route).toBeNull();
    expect(chip.labelKey).toBe('businessHome.copilot.sources.other');
  });

  it('maps progress keys, with "Thinking..." before the first tool or for unknown keys', () => {
    expect(progressLabelKey('lists')).toBe('businessHome.copilot.progress.lists');
    expect(progressLabelKey(null)).toBe('businessHome.copilot.thinking');
    expect(progressLabelKey(undefined)).toBe('businessHome.copilot.thinking');
    expect(progressLabelKey('nope')).toBe('businessHome.copilot.thinking');
  });
});

describe('message predicates', () => {
  it('opens the cost sheet only for done answers with a breakdown', () => {
    expect(canOpenCostSheet(message())).toBe(true);
    expect(canOpenCostSheet(message({ status: 'pending', cost_breakdown: null }))).toBe(false);
    expect(canOpenCostSheet(message({ status: 'failed', cost_breakdown: null }))).toBe(false);
    expect(canOpenCostSheet(message({ cost_breakdown: null }))).toBe(false);
    expect(canOpenCostSheet(message({ role: 'user', cost_breakdown: null }))).toBe(false);
  });

  it('shows the long-conversation hint at 20 questions, not 19', () => {
    expect(shouldShowLongConversationHint(19)).toBe(false);
    expect(shouldShowLongConversationHint(20)).toBe(true);
    expect(questionCount([message({ role: 'user' }), message(), message({ role: 'user' })])).toBe(2);
  });

  it('shows follow-ups only under a finished latest answer', () => {
    const done = message({ follow_ups: ['a', 'b'] });
    expect(latestFollowUps([done])).toEqual(['a', 'b']);
    expect(latestFollowUps([done, message({ role: 'user' })])).toEqual([]);
    expect(latestFollowUps([message({ status: 'pending', follow_ups: ['x'] })])).toEqual([]);
    expect(latestFollowUps([])).toEqual([]);
  });

  it('validates the question length at 500', () => {
    expect(isValidQuestion('a'.repeat(COPILOT_MAX_MESSAGE_CHARS))).toBe(true);
    expect(isValidQuestion('a'.repeat(COPILOT_MAX_MESSAGE_CHARS + 1))).toBe(false);
    expect(isValidQuestion('   ')).toBe(false);
    expect(isValidQuestion('')).toBe(false);
  });

  it('blocks sending while pending, at 0 credits or with an invalid question', () => {
    const base = { text: 'hello', hasPending: false, credits: { remaining: 3 } };
    expect(canSendQuestion(base)).toBe(true);
    expect(canSendQuestion({ ...base, credits: undefined })).toBe(true);
    expect(canSendQuestion({ ...base, hasPending: true })).toBe(false);
    expect(canSendQuestion({ ...base, credits: { remaining: 0 } })).toBe(false);
    expect(canSendQuestion({ ...base, text: ' ' })).toBe(false);
  });
});

describe('thread title validation', () => {
  it('accepts 1 to 80 characters after trimming', () => {
    expect(validateThreadTitle('a')).toBeNull();
    expect(validateThreadTitle('a'.repeat(80))).toBeNull();
    expect(validateThreadTitle('  ' + 'a'.repeat(80) + '  ')).toBeNull();
  });

  it('rejects empty, whitespace-only and over-long titles', () => {
    expect(validateThreadTitle('')).toBe('empty');
    expect(validateThreadTitle('   ')).toBe('empty');
    expect(validateThreadTitle('a'.repeat(81))).toBe('too_long');
  });
});

describe('polling', () => {
  it('polls every 1.5 s while pending and stops at 100 s', () => {
    expect(copilotRefetchInterval('pending', 0, 1000)).toBe(COPILOT_POLL_INTERVAL_MS);
    expect(copilotRefetchInterval('pending', 0, COPILOT_POLL_MAX_MS - 1)).toBe(COPILOT_POLL_INTERVAL_MS);
    expect(copilotRefetchInterval('pending', 0, COPILOT_POLL_MAX_MS)).toBe(false);
  });

  it('does not poll finished or unknown messages', () => {
    expect(copilotRefetchInterval('done', 0, 0)).toBe(false);
    expect(copilotRefetchInterval('failed', 0, 0)).toBe(false);
    expect(copilotRefetchInterval(undefined, 0, 0)).toBe(false);
  });

  it('treats exactly 100 s as expired', () => {
    expect(isPollExpired(0, 99_999)).toBe(false);
    expect(isPollExpired(0, 100_000)).toBe(true);
  });
});

describe('error to UI state', () => {
  it.each([
    [400, 'invalid'],
    [403, 'not_entitled'],
    [404, 'not_found'],
    [409, 'pending_exists'],
    [429, 'exhausted'],
    [503, 'unavailable'],
    [500, 'generic'],
    [undefined, 'generic'],
  ])('%s -> %s', (status, expected) => {
    const error = status === undefined ? new Error('x') : toStatusError({ message: '', statusCode: status });
    expect(copilotErrorState(error)).toBe(expected);
  });

  it('falls back to generic for non-errors', () => {
    expect(copilotErrorState(null)).toBe('generic');
    expect(copilotErrorState('boom')).toBe('generic');
  });
});

describe('opening rules', () => {
  const threads = [{ id: 'latest' }, { id: 'older' }];

  it('opens the threadId param first', () => {
    expect(resolveOpenTarget({ threadIdParam: 'x', q: 'hello', threads })).toEqual({ threadId: 'x', prefill: '' });
  });

  it('starts a new chat with the composer prefilled for q', () => {
    expect(resolveOpenTarget({ q: ' What now? ', threads })).toEqual({ threadId: null, prefill: 'What now?' });
    expect(resolveOpenTarget({ q: 'a'.repeat(900), threads }).prefill).toHaveLength(COPILOT_MAX_MESSAGE_CHARS);
  });

  it('otherwise resumes the latest conversation or an empty new chat', () => {
    expect(resolveOpenTarget({ threads })).toEqual({ threadId: 'latest', prefill: '' });
    expect(resolveOpenTarget({ threads: [] })).toEqual({ threadId: null, prefill: '' });
    expect(resolveOpenTarget({ threadIdParam: '  ', q: '  ', threads })).toEqual({ threadId: 'latest', prefill: '' });
  });
});

describe('threads cache transforms', () => {
  it('renames optimistically and ignores unknown ids and an empty cache', () => {
    const data = threadsData([thread('a'), thread('b')]);
    expect(renameThreadInCache(data, 'b', 'New')?.pages[0].threads.map((t) => t.title)).toEqual(['a', 'New']);
    expect(renameThreadInCache(data, 'zzz', 'New')?.pages[0].threads.map((t) => t.title)).toEqual(['a', 'b']);
    expect(renameThreadInCache(undefined, 'a', 'x')).toBeUndefined();
  });

  it('removes a thread from any page and lowers the totals', () => {
    const data = threadsData([thread('a')], [thread('b')]);
    const next = removeThreadFromCache(data, 'b');
    expect(flattenThreads(next).map((t) => t.id)).toEqual(['a']);
    expect(next?.pages.every((p) => p.total === 1)).toBe(true);
    expect(removeThreadFromCache(data, 'zzz')).toBe(data);
    expect(removeThreadFromCache(undefined, 'a')).toBeUndefined();
  });

  it('prepends a new thread, moves an existing one to the top, and fills an empty cache', () => {
    const data = threadsData([thread('a'), thread('b')]);
    expect(flattenThreads(prependThreadToCache(data, thread('c'))).map((t) => t.id)).toEqual(['c', 'a', 'b']);
    expect(prependThreadToCache(data, thread('c'))?.pages[0].total).toBe(3);
    const moved = prependThreadToCache(data, thread('b'));
    expect(flattenThreads(moved).map((t) => t.id)).toEqual(['b', 'a']);
    expect(moved?.pages[0].total).toBe(2);
    expect(flattenThreads(prependThreadToCache({ pages: [], pageParams: [] }, thread('c'))).map((t) => t.id)).toEqual(['c']);
    expect(prependThreadToCache(undefined, thread('c'))).toBeUndefined();
  });

  it('rollback restores the snapshot, so the original order is back', () => {
    const snapshot = threadsData([thread('a'), thread('b')]);
    const optimistic = removeThreadFromCache(snapshot, 'a');
    expect(restoreSnapshot(optimistic, snapshot)).toBe(snapshot);
    expect(restoreSnapshot(optimistic, undefined)).toBe(optimistic);
  });

  it('flattens pages without duplicates and computes the next page', () => {
    const data = threadsData([thread('a'), thread('b')], [thread('b'), thread('c')]);
    expect(flattenThreads(data).map((t) => t.id)).toEqual(['a', 'b', 'c']);
    expect(flattenThreads(undefined)).toEqual([]);
    expect(nextThreadsPageParam(data.pages[0])).toBe(2);
    expect(nextThreadsPageParam(data.pages[1])).toBeUndefined();
    expect(nextThreadsPageParam(undefined)).toBeUndefined();
  });

  it('deleting the active conversation picks a new chat; another one keeps the active', () => {
    expect(activeThreadAfterDelete('a', 'a')).toBeNull();
    expect(activeThreadAfterDelete('a', 'b')).toBe('a');
    expect(activeThreadAfterDelete(null, 'b')).toBeNull();
  });
});

describe('conversation cache transforms', () => {
  it('upserts a message by id (pending -> done) or appends a new one', () => {
    const pending = message({ id: 'p', status: 'pending', cost_breakdown: null });
    const base = chat(message({ id: 'u', role: 'user' }), pending);
    const done = upsertMessage(base, message({ id: 'p', status: 'done' }));
    expect(done?.messages.map((m) => m.status)).toEqual(['done', 'done']);
    expect(done?.messages).toHaveLength(2);
    expect(upsertMessage(base, message({ id: 'new' }))?.messages).toHaveLength(3);
    expect(upsertMessage(undefined, message())).toBeUndefined();
  });

  it('appends the sent pair once even if applied twice', () => {
    const user = message({ id: 'u', role: 'user', status: 'done', cost_breakdown: null });
    const assistant = message({ id: 'a', status: 'pending', cost_breakdown: null });
    const once = appendSentMessages(newThreadShell(thread('t1')), user, assistant);
    const twice = appendSentMessages(once, user, assistant);
    expect(twice?.messages.map((m) => m.id)).toEqual(['u', 'a']);
  });

  it('prepends older messages without duplicates and takes has_more from the older page', () => {
    const current = chat(message({ id: '3' }), message({ id: '4' }));
    const older = { ...chat(message({ id: '1' }), message({ id: '2' }), message({ id: '3' })), has_more: true };
    const merged = mergeOlderMessages(current, older);
    expect(merged?.messages.map((m) => m.id)).toEqual(['1', '2', '3', '4']);
    expect(merged?.has_more).toBe(true);
    expect(mergeOlderMessages(undefined, older)).toBe(older);
  });

  it('marks only a pending message failed', () => {
    const base = chat(message({ id: 'p', status: 'pending', progress: 'lists', cost_breakdown: null }), message({ id: 'd' }));
    const next = markMessageFailed(base, 'p');
    expect(next?.messages[0]).toMatchObject({ status: 'failed', progress: null });
    expect(markMessageFailed(base, 'd')?.messages[1].status).toBe('done');
    expect(markMessageFailed(undefined, 'p')).toBeUndefined();
  });

  it('finds the pending answer and the question behind a failed one', () => {
    const msgs = [
      message({ id: 'u1', role: 'user', content: 'first' }),
      message({ id: 'a1', status: 'failed', cost_breakdown: null }),
      message({ id: 'u2', role: 'user', content: 'second' }),
      message({ id: 'a2', status: 'pending', cost_breakdown: null }),
    ];
    expect(pendingMessage(msgs)?.id).toBe('a2');
    expect(pendingMessage(msgs.slice(0, 2))).toBeUndefined();
    expect(questionBeforeMessage(msgs, 'a1')).toBe('first');
    expect(questionBeforeMessage(msgs, 'a2')).toBe('second');
    expect(questionBeforeMessage(msgs, 'nope')).toBeUndefined();
  });

  it('builds an empty shell for a freshly created thread', () => {
    expect(newThreadShell(thread('t9', 'Hi'))).toEqual({ id: 't9', branch_id: 'br1', title: 'Hi', messages: [], has_more: false });
  });
});

describe('plain-text answer blocks', () => {
  it('splits paragraphs and "- " bullets', () => {
    expect(parseAnswerBlocks('Views are up.\nSecond line.\n\n- Search: 40\n- Lists: 10\n\nTry an offer.')).toEqual([
      { type: 'paragraph', text: 'Views are up. Second line.' },
      { type: 'bullet', text: 'Search: 40' },
      { type: 'bullet', text: 'Lists: 10' },
      { type: 'paragraph', text: 'Try an offer.' },
    ]);
  });

  it('handles empty text and leaves stray symbols alone', () => {
    expect(parseAnswerBlocks('')).toEqual([]);
    expect(parseAnswerBlocks('   \n  ')).toEqual([]);
    expect(parseAnswerBlocks('-5% this week')).toEqual([{ type: 'paragraph', text: '-5% this week' }]);
  });
});
