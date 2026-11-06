import type {
  AiCreditsDAO,
  CopilotMessageDAO,
  CopilotSourceKey,
  CopilotThreadDAO,
  CopilotThreadSummaryDAO,
} from '@/http/business-api/types';
import { getErrorStatusCode } from '@/utils/aiCredits';

/**
 * Pure helpers for the Business Copilot chat: source chips, progress labels, polling, opening
 * rules, error states and the cache transforms behind optimistic rename / delete / send. No
 * React, no network: everything here is unit tested (`copilot.test.ts`).
 */

const COPY = 'businessHome.copilot';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const COPILOT_THREADS_QUERY_KEY = 'business-copilot-threads';
export const COPILOT_THREAD_QUERY_KEY = 'business-copilot-thread';
export const COPILOT_MESSAGE_QUERY_KEY = 'business-copilot-message';

export function copilotThreadsQueryKey(businessId: string, branchId: string) {
  return [COPILOT_THREADS_QUERY_KEY, businessId, branchId] as const;
}

export function copilotThreadQueryKey(
  businessId: string,
  branchId: string,
  threadId: string | null,
) {
  return [COPILOT_THREAD_QUERY_KEY, businessId, branchId, threadId] as const;
}

export function copilotMessageQueryKey(businessId: string, branchId: string, messageId: string) {
  return [COPILOT_MESSAGE_QUERY_KEY, businessId, branchId, messageId] as const;
}

// ---------------------------------------------------------------------------
// Source chips + progress labels
// ---------------------------------------------------------------------------

export const COPILOT_SOURCE_KEYS: CopilotSourceKey[] = [
  'profile',
  'profile_health',
  'performance',
  'metrics',
  'changes',
  'view_sources',
  'customer_keywords',
  'personality',
  'differentiators',
  'demand_topics',
  'peak_hours',
  'lists',
  'notes',
  'offers',
  'spotlight',
  'ads',
  'smart_pick',
  'alerts',
];

/** Tool `progress_key`s the backend registry can report while an answer is pending. */
export const COPILOT_PROGRESS_KEYS = [
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

const SOURCE_ROUTES: Partial<Record<CopilotSourceKey, string>> = {
  customer_keywords: '/business-customers-detail',
  personality: '/business-customers-detail',
  differentiators: '/business-customers-detail',
  demand_topics: '/business-demand-detail',
  peak_hours: '/business-demand-detail',
  performance: '/business-performance-detail',
  metrics: '/business-performance-detail',
  changes: '/business-performance-detail',
  view_sources: '/business-performance-detail',
  profile: '/edit-profile',
  profile_health: '/edit-profile',
};

export type SourceChip = { key: string; labelKey: string; route: string | null };

/**
 * Label + optional route for a source key. A key this app version doesn't know (a newer
 * backend) becomes a label-only "Your data" chip instead of crashing.
 */
export function sourceChip(key: string): SourceChip {
  const known = (COPILOT_SOURCE_KEYS as string[]).includes(key);
  return {
    key,
    labelKey: known ? `${COPY}.sources.${key}` : `${COPY}.sources.other`,
    route: known ? (SOURCE_ROUTES[key as CopilotSourceKey] ?? null) : null,
  };
}

/** "Checking your lists..." for a tool key; before the first tool (or unknown) "Thinking...". */
export function progressLabelKey(progress: string | null | undefined): string {
  return progress && COPILOT_PROGRESS_KEYS.includes(progress)
    ? `${COPY}.progress.${progress}`
    : `${COPY}.thinking`;
}

// ---------------------------------------------------------------------------
// Message predicates + hints
// ---------------------------------------------------------------------------

/** Only a finished answer with a breakdown has a cost sheet. */
export function canOpenCostSheet(
  message: Pick<CopilotMessageDAO, 'role' | 'status' | 'cost_breakdown'>,
): boolean {
  return (
    message.role === 'assistant' && message.status === 'done' && message.cost_breakdown !== null
  );
}

export const LONG_CONVERSATION_QUESTIONS = 20;

export function questionCount(messages: Pick<CopilotMessageDAO, 'role'>[]): number {
  return messages.filter((message) => message.role === 'user').length;
}

export function shouldShowLongConversationHint(count: number): boolean {
  return count >= LONG_CONVERSATION_QUESTIONS;
}

/** Follow-up pills sit under the latest answer only, and only when it finished. */
export function latestFollowUps(messages: CopilotMessageDAO[]): string[] {
  const last = messages[messages.length - 1];
  return last && last.role === 'assistant' && last.status === 'done' ? last.follow_ups : [];
}

export const COPILOT_MAX_MESSAGE_CHARS = 500;

export function isValidQuestion(text: string, max: number = COPILOT_MAX_MESSAGE_CHARS): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= max;
}

export const COPILOT_THREAD_TITLE_MAX = 80;

export type ThreadTitleError = 'empty' | 'too_long';

/** Rename validation (1-80 characters after trimming), checked before anything is sent. */
export function validateThreadTitle(title: string): ThreadTitleError | null {
  const trimmed = title.trim();
  if (trimmed.length === 0) return 'empty';
  if (trimmed.length > COPILOT_THREAD_TITLE_MAX) return 'too_long';
  return null;
}

export function canSendQuestion(params: {
  text: string;
  hasPending: boolean;
  credits: Pick<AiCreditsDAO, 'remaining'> | undefined;
}): boolean {
  if (params.hasPending) return false;
  if (params.credits !== undefined && params.credits.remaining <= 0) return false;
  return isValidQuestion(params.text);
}

// ---------------------------------------------------------------------------
// Polling
// ---------------------------------------------------------------------------

export const COPILOT_POLL_INTERVAL_MS = 1500;
/** The backend gives up on a pending answer well before this; the app stops polling at 100 s. */
export const COPILOT_POLL_MAX_MS = 100_000;

export function isPollExpired(startedAtMs: number, nowMs: number): boolean {
  return nowMs - startedAtMs >= COPILOT_POLL_MAX_MS;
}

/** Interval for the pending-message query: poll while pending and inside the 100 s window. */
export function copilotRefetchInterval(
  status: CopilotMessageDAO['status'] | undefined,
  startedAtMs: number,
  nowMs: number,
): number | false {
  if (status !== 'pending') return false;
  return isPollExpired(startedAtMs, nowMs) ? false : COPILOT_POLL_INTERVAL_MS;
}

// ---------------------------------------------------------------------------
// Error -> UI state
// ---------------------------------------------------------------------------

export type CopilotErrorState =
  | 'invalid'
  | 'not_entitled'
  | 'not_found'
  | 'pending_exists'
  | 'exhausted'
  | 'unavailable'
  | 'generic';

export function copilotErrorState(error: unknown): CopilotErrorState {
  switch (getErrorStatusCode(error)) {
    case 400:
      return 'invalid';
    case 403:
      return 'not_entitled';
    case 404:
      return 'not_found';
    case 409:
      return 'pending_exists';
    case 429:
      return 'exhausted';
    case 503:
      return 'unavailable';
    default:
      return 'generic';
  }
}

// ---------------------------------------------------------------------------
// Opening rules
// ---------------------------------------------------------------------------

export type OpenTarget = { threadId: string | null; prefill: string };

/**
 * `threadId` param opens that conversation; `q` starts a new chat with the composer prefilled;
 * otherwise the most recent conversation, or an empty new chat when there are none.
 */
export function resolveOpenTarget(params: {
  threadIdParam?: string | null;
  q?: string | null;
  threads: Pick<CopilotThreadSummaryDAO, 'id'>[];
}): OpenTarget {
  const threadId = params.threadIdParam?.trim();
  if (threadId) return { threadId, prefill: '' };
  const q = params.q?.trim();
  if (q) return { threadId: null, prefill: q.slice(0, COPILOT_MAX_MESSAGE_CHARS) };
  return { threadId: params.threads[0]?.id ?? null, prefill: '' };
}

// ---------------------------------------------------------------------------
// Threads list cache (infinite query pages)
// ---------------------------------------------------------------------------

export type CopilotThreadsPage = {
  threads: CopilotThreadSummaryDAO[];
  page: number;
  next: number | null;
  total: number;
};

export type CopilotThreadsData = {
  pages: CopilotThreadsPage[];
  pageParams: number[];
};

export const THREADS_FIRST_PAGE = 1;

export function nextThreadsPageParam(last: CopilotThreadsPage | undefined): number | undefined {
  return last?.next ?? undefined;
}

export function flattenThreads(data: CopilotThreadsData | undefined): CopilotThreadSummaryDAO[] {
  const seen = new Set<string>();
  const out: CopilotThreadSummaryDAO[] = [];
  for (const page of data?.pages ?? []) {
    for (const thread of page.threads) {
      if (seen.has(thread.id)) continue;
      seen.add(thread.id);
      out.push(thread);
    }
  }
  return out;
}

function mapThreads(
  data: CopilotThreadsData,
  transform: (threads: CopilotThreadSummaryDAO[]) => CopilotThreadSummaryDAO[],
): CopilotThreadsData {
  return { ...data, pages: data.pages.map((page) => ({ ...page, threads: transform(page.threads) })) };
}

export function renameThreadInCache(
  data: CopilotThreadsData | undefined,
  threadId: string,
  title: string,
): CopilotThreadsData | undefined {
  if (!data) return data;
  return mapThreads(data, (threads) =>
    threads.map((thread) => (thread.id === threadId ? { ...thread, title } : thread)),
  );
}

export function removeThreadFromCache(
  data: CopilotThreadsData | undefined,
  threadId: string,
): CopilotThreadsData | undefined {
  if (!data) return data;
  const exists = data.pages.some((page) => page.threads.some((thread) => thread.id === threadId));
  if (!exists) return data;
  const next = mapThreads(data, (threads) => threads.filter((thread) => thread.id !== threadId));
  return {
    ...next,
    pages: next.pages.map((page) => ({ ...page, total: Math.max(0, page.total - 1) })),
  };
}

/** Puts a conversation (new, or one that just got a message) first; an empty cache gets a page. */
export function prependThreadToCache(
  data: CopilotThreadsData | undefined,
  thread: CopilotThreadSummaryDAO,
): CopilotThreadsData | undefined {
  if (!data) return data;
  if (data.pages.length === 0) {
    return {
      pageParams: [THREADS_FIRST_PAGE],
      pages: [{ threads: [thread], page: THREADS_FIRST_PAGE, next: null, total: 1 }],
    };
  }
  const existed = data.pages.some((page) => page.threads.some((item) => item.id === thread.id));
  const stripped = mapThreads(data, (threads) => threads.filter((item) => item.id !== thread.id));
  const [first, ...rest] = stripped.pages;
  return {
    ...stripped,
    pages: [
      {
        ...first,
        threads: [thread, ...first.threads],
        total: existed ? first.total : first.total + 1,
      },
      ...rest.map((page) => (existed ? page : { ...page, total: page.total + 1 })),
    ],
  };
}

/** Rollback after a failed mutation: the snapshot taken in `onMutate`, else what is cached. */
export function restoreSnapshot<T>(current: T | undefined, snapshot: T | undefined): T | undefined {
  return snapshot ?? current;
}

/**
 * The conversation to show after deleting one: deleting the active conversation (or one that is
 * not in the list) leaves the screen on a new chat (`null`); deleting another keeps the active one.
 */
export function activeThreadAfterDelete(
  activeThreadId: string | null,
  deletedThreadId: string,
): string | null {
  return activeThreadId === deletedThreadId ? null : activeThreadId;
}

// ---------------------------------------------------------------------------
// Conversation cache (messages of one thread)
// ---------------------------------------------------------------------------

/** Replaces a message with the same id, or appends it (oldest first). */
export function upsertMessage(
  thread: CopilotThreadDAO | undefined,
  message: CopilotMessageDAO,
): CopilotThreadDAO | undefined {
  if (!thread) return thread;
  const exists = thread.messages.some((item) => item.id === message.id);
  return {
    ...thread,
    messages: exists
      ? thread.messages.map((item) => (item.id === message.id ? message : item))
      : [...thread.messages, message],
  };
}

/** Adds the user bubble and the pending assistant bubble returned by the POST (no duplicates). */
export function appendSentMessages(
  thread: CopilotThreadDAO | undefined,
  user: CopilotMessageDAO,
  assistant: CopilotMessageDAO,
): CopilotThreadDAO | undefined {
  return upsertMessage(upsertMessage(thread, user), assistant);
}

/** Prepends an older page (loaded with `before`), dropping ids already shown. */
export function mergeOlderMessages(
  thread: CopilotThreadDAO | undefined,
  older: CopilotThreadDAO,
): CopilotThreadDAO | undefined {
  if (!thread) return older;
  const known = new Set(thread.messages.map((message) => message.id));
  return {
    ...thread,
    messages: [...older.messages.filter((message) => !known.has(message.id)), ...thread.messages],
    has_more: older.has_more,
  };
}

/** Marks a still-pending message failed locally (the poll window ran out). */
export function markMessageFailed(
  thread: CopilotThreadDAO | undefined,
  messageId: string,
): CopilotThreadDAO | undefined {
  if (!thread) return thread;
  return {
    ...thread,
    messages: thread.messages.map((message) =>
      message.id === messageId && message.status === 'pending'
        ? { ...message, status: 'failed', progress: null }
        : message,
    ),
  };
}

/** The assistant message still being answered, if any. */
export function pendingMessage(
  messages: CopilotMessageDAO[],
): CopilotMessageDAO | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === 'assistant' && message.status === 'pending') return message;
  }
  return undefined;
}

/** The user's question that produced a failed answer, for Retry. */
export function questionBeforeMessage(
  messages: CopilotMessageDAO[],
  assistantId: string,
): string | undefined {
  const index = messages.findIndex((message) => message.id === assistantId);
  for (let i = index - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'user') return messages[i].content;
  }
  return undefined;
}

/** Empty thread shell for a conversation that was just created by its first POST. */
export function newThreadShell(thread: CopilotThreadSummaryDAO): CopilotThreadDAO {
  return {
    id: thread.id,
    branch_id: thread.branch_id,
    title: thread.title,
    messages: [],
    has_more: false,
  };
}

// ---------------------------------------------------------------------------
// Plain-text answer rendering ("- " bullets, blank-line paragraphs)
// ---------------------------------------------------------------------------

export type AnswerBlock = { type: 'paragraph' | 'bullet'; text: string };

/** Splits an answer into paragraphs and `- ` bullets; no markdown beyond that. */
export function parseAnswerBlocks(content: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length > 0) blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
  };
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === '') {
      flush();
    } else if (/^[-*•]\s+/.test(line)) {
      flush();
      blocks.push({ type: 'bullet', text: line.replace(/^[-*•]\s+/, '') });
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}
