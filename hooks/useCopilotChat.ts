import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import type {
  AiCreditsDAO,
  CopilotMessageDAO,
  CopilotThreadDAO,
} from '@/http/business-api/types';
import {
  AI_CREDITS_QUERY_KEY,
  aiCreditsQueryKey,
  isAiCreditsEnabled,
  isCreditsNotEntitledError,
  toStatusError,
  getErrorStatusCode,
} from '@/utils/aiCredits';
import {
  appendSentMessages,
  copilotMessageQueryKey,
  copilotRefetchInterval,
  copilotThreadQueryKey,
  copilotThreadsQueryKey,
  COPILOT_POLL_MAX_MS,
  markMessageFailed,
  mergeOlderMessages,
  newThreadShell,
  pendingMessage,
  prependThreadToCache,
  upsertMessage,
  type CopilotThreadsData,
} from '@/utils/copilot';
import { useSelectedBranch } from '@/hooks/useSelectedBranch';

const LOCAL_USER_ID = 'local-user';
const LOCAL_ASSISTANT_ID = 'local-assistant';

type LocalSend = { scope: string; text: string; createdAt: string };

function localBubbles(send: LocalSend): CopilotMessageDAO[] {
  const base = { sources: [], follow_ups: [], credits_charged: 0, cost_breakdown: null };
  return [
    { ...base, id: LOCAL_USER_ID, role: 'user', status: 'done', progress: null, content: send.text, created_at: send.createdAt },
    { ...base, id: LOCAL_ASSISTANT_ID, role: 'assistant', status: 'pending', progress: null, content: '', created_at: send.createdAt },
  ];
}

interface UseCopilotChatOptions {
  /** Called with the new conversation's id when a first message creates one. */
  onThreadCreated?: (threadId: string) => void;
  isPaid?: boolean;
}

/**
 * One conversation of the selected branch. `threadId = null` is a new chat (nothing is stored
 * until the first message). Messages of other branches or conversations are never mixed in:
 * every cache key carries the branch and thread id, and the optimistic bubbles are scoped to them.
 */
export function useCopilotChat(threadId: string | null, options: UseCopilotChatOptions = {}) {
  const queryClient = useQueryClient();
  const branch = useSelectedBranch();
  const isPaid = options.isPaid ?? branch.isPaid;
  const { businessId, branchId } = branch;
  const safeBranchId = branchId ?? '';
  const enabled = isAiCreditsEnabled({ businessId, branchId, isPaid });
  const scope = `${safeBranchId}:${threadId ?? 'new'}`;
  const onThreadCreatedRef = useRef(options.onThreadCreated);
  onThreadCreatedRef.current = options.onThreadCreated;

  const threadKey = copilotThreadQueryKey(businessId, safeBranchId, threadId);

  const threadQuery = useQuery({
    queryKey: threadKey,
    queryFn: async (): Promise<CopilotThreadDAO> => {
      const response = await businessService.getCopilotThread(businessId, safeBranchId, threadId ?? '');
      if (response.error) throw toStatusError(response.error);
      if (!response.data?.data) throw new Error('Empty conversation response');
      return response.data.data;
    },
    enabled: enabled && threadId !== null,
    staleTime: 30_000,
    // 403 / 404 cannot be fixed by retrying (deleted elsewhere, branch not paid).
    retry: (count, error) => {
      const code = getErrorStatusCode(error);
      return code !== 404 && !isCreditsNotEntitledError(error) && count < 2;
    },
  });

  const [local, setLocal] = useState<LocalSend | null>(null);
  const activeLocal = local && local.scope === scope ? local : null;

  const serverMessages = useMemo(
    () => (threadId === null ? [] : (threadQuery.data?.messages ?? [])),
    [threadId, threadQuery.data],
  );
  const messages = useMemo(
    () => (activeLocal ? [...serverMessages, ...localBubbles(activeLocal)] : serverMessages),
    [serverMessages, activeLocal],
  );

  // ----- send -------------------------------------------------------------
  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await businessService.sendCopilotMessage(businessId, safeBranchId, {
        thread_id: threadId,
        message: text,
      });
      if (response.error) throw toStatusError(response.error);
      if (!response.data?.data) throw new Error('Empty send response');
      return response.data.data;
    },
    onMutate: (text) => {
      setLocal({ scope, text, createdAt: new Date().toISOString() });
    },
    onSuccess: (result) => {
      const sentThreadId = result.thread.id;
      const sentKey = copilotThreadQueryKey(businessId, safeBranchId, sentThreadId);
      queryClient.setQueryData<CopilotThreadDAO | undefined>(sentKey, (current) =>
        appendSentMessages(current ?? newThreadShell(result.thread), result.user_message, result.assistant_message),
      );
      queryClient.setQueryData<CopilotThreadsData | undefined>(
        copilotThreadsQueryKey(businessId, safeBranchId),
        (data) => prependThreadToCache(data, result.thread),
      );
      queryClient.setQueryData<AiCreditsDAO>(aiCreditsQueryKey(businessId, safeBranchId), result.credits);
      // Sibling queries (detail) hold the pre-reservation numbers.
      void queryClient.invalidateQueries({ queryKey: [AI_CREDITS_QUERY_KEY, businessId, safeBranchId, 'detail'] });
      setLocal(null);
      if (threadId === null) onThreadCreatedRef.current?.(sentThreadId);
    },
    onError: (error) => {
      setLocal(null);
      // 429 / 403: our cached balance is stale. The typed text stays with the caller.
      const code = getErrorStatusCode(error);
      if (code === 429 || code === 403) {
        void queryClient.invalidateQueries({ queryKey: [AI_CREDITS_QUERY_KEY, businessId, safeBranchId] });
      }
    },
  });

  // ----- poll the pending answer -----------------------------------------
  const pending = useMemo(() => pendingMessage(serverMessages), [serverMessages]);
  const pendingId = pending?.id ?? null;
  const startedAtRef = useRef<{ id: string; at: number } | null>(null);
  if (pendingId && startedAtRef.current?.id !== pendingId) {
    startedAtRef.current = { id: pendingId, at: Date.now() };
  }
  const activeThreadId = threadId;

  const pollQuery = useQuery({
    queryKey: copilotMessageQueryKey(businessId, safeBranchId, pendingId ?? ''),
    queryFn: async (): Promise<CopilotMessageDAO> => {
      const response = await businessService.getCopilotMessage(businessId, safeBranchId, pendingId ?? '');
      if (response.error) throw toStatusError(response.error);
      if (!response.data?.data) throw new Error('Empty message response');
      return response.data.data;
    },
    enabled: enabled && pendingId !== null,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchInterval: (query) =>
      copilotRefetchInterval(
        query.state.data?.status ?? 'pending',
        startedAtRef.current?.at ?? Date.now(),
        Date.now(),
      ),
  });

  const polled = pollQuery.data;
  useEffect(() => {
    if (!polled || polled.status === 'pending' || activeThreadId === null) return;
    queryClient.setQueryData<CopilotThreadDAO | undefined>(
      copilotThreadQueryKey(businessId, safeBranchId, activeThreadId),
      (current) => upsertMessage(current, polled),
    );
    // The charge is settled (done) or released (failed): refresh the balance either way.
    void queryClient.invalidateQueries({ queryKey: [AI_CREDITS_QUERY_KEY, businessId, safeBranchId] });
    void queryClient.invalidateQueries({ queryKey: copilotThreadsQueryKey(businessId, safeBranchId) });
  }, [polled, activeThreadId, businessId, safeBranchId, queryClient]);

  // Stop waiting after 100 s: show the answer as failed (the server releases the credits itself).
  useEffect(() => {
    if (!pendingId || activeThreadId === null) return undefined;
    const startedAt = startedAtRef.current?.at ?? Date.now();
    const timer = setTimeout(
      () => {
        queryClient.setQueryData<CopilotThreadDAO | undefined>(
          copilotThreadQueryKey(businessId, safeBranchId, activeThreadId),
          (current) => markMessageFailed(current, pendingId),
        );
      },
      Math.max(0, COPILOT_POLL_MAX_MS - (Date.now() - startedAt)),
    );
    return () => clearTimeout(timer);
  }, [pendingId, activeThreadId, businessId, safeBranchId, queryClient]);

  // ----- load older -------------------------------------------------------
  const [loadingOlder, setLoadingOlder] = useState(false);
  const loadOlder = useCallback(async () => {
    const first = threadQuery.data?.messages[0];
    if (!first || !threadQuery.data?.has_more || threadId === null || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const response = await businessService.getCopilotThread(businessId, safeBranchId, threadId, first.id);
      if (response.error || !response.data?.data) return;
      const older = response.data.data;
      queryClient.setQueryData<CopilotThreadDAO | undefined>(threadKey, (current) =>
        mergeOlderMessages(current, older),
      );
    } finally {
      setLoadingOlder(false);
    }
  }, [threadQuery.data, threadId, loadingOlder, businessId, safeBranchId, queryClient, threadKey]);

  return {
    messages,
    title: threadQuery.data?.title ?? '',
    hasMore: threadQuery.data?.has_more ?? false,
    isLoading: threadId !== null && threadQuery.isPending && enabled,
    isFetchingOlder: loadingOlder,
    error: threadQuery.error,
    refetch: threadQuery.refetch,
    loadOlder,
    send: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    /** True while a question is being sent or an answer is still pending. */
    hasPending: sendMutation.isPending || pending !== undefined,
  };
}
