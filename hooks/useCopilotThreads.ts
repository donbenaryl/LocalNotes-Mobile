import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import type { CopilotThreadSummaryDAO } from '@/http/business-api/types';
import { isAiCreditsEnabled, toStatusError } from '@/utils/aiCredits';
import {
  copilotThreadQueryKey,
  copilotThreadsQueryKey,
  flattenThreads,
  nextThreadsPageParam,
  removeThreadFromCache,
  renameThreadInCache,
  restoreSnapshot,
  THREADS_FIRST_PAGE,
  type CopilotThreadsData,
  type CopilotThreadsPage,
} from '@/utils/copilot';
import { useSelectedBranch } from '@/hooks/useSelectedBranch';

type Snapshot = { snapshot?: CopilotThreadsData };

/**
 * The caller's conversations for the selected branch (newest first, paged), with optimistic
 * rename and delete that roll back on failure (pattern of `useBusinessAlerts`).
 */
export function useCopilotThreads(options: { isPaid?: boolean } = {}) {
  const queryClient = useQueryClient();
  const branch = useSelectedBranch();
  const isPaid = options.isPaid ?? branch.isPaid;
  const { businessId, branchId } = branch;
  const key = copilotThreadsQueryKey(businessId, branchId ?? '');

  const query = useInfiniteQuery<
    CopilotThreadsPage,
    Error,
    InfiniteData<CopilotThreadsPage, number>,
    ReturnType<typeof copilotThreadsQueryKey>,
    number
  >({
    queryKey: key,
    queryFn: async ({ pageParam }): Promise<CopilotThreadsPage> => {
      const response = await businessService.getCopilotThreads(businessId, branchId ?? '', pageParam);
      if (response.error) throw toStatusError(response.error);
      if (!response.data) throw new Error('Empty conversations response');
      return {
        threads: response.data.data ?? [],
        page: response.data.pagination?.page ?? pageParam,
        next: response.data.pagination?.next ?? null,
        total: response.data.pagination?.total ?? 0,
      };
    },
    initialPageParam: THREADS_FIRST_PAGE,
    getNextPageParam: (last) => nextThreadsPageParam(last),
    enabled: isAiCreditsEnabled({ businessId, branchId, isPaid }),
    staleTime: 30_000,
  });

  const optimistic = <V,>(transform: (data: CopilotThreadsData | undefined, vars: V) => CopilotThreadsData | undefined) => ({
    onMutate: async (vars: V): Promise<Snapshot> => {
      await queryClient.cancelQueries({ queryKey: key });
      const snapshot = queryClient.getQueryData<CopilotThreadsData>(key);
      queryClient.setQueryData<CopilotThreadsData | undefined>(key, (data) => transform(data, vars));
      return { snapshot };
    },
    onError: (_error: unknown, _vars: V, context: Snapshot | undefined) => {
      queryClient.setQueryData<CopilotThreadsData | undefined>(key, (current) =>
        restoreSnapshot(current, context?.snapshot),
      );
    },
  });

  const rename = useMutation({
    mutationFn: async (vars: { threadId: string; title: string }): Promise<CopilotThreadSummaryDAO> => {
      const response = await businessService.renameCopilotThread(businessId, branchId ?? '', vars.threadId, {
        title: vars.title,
      });
      if (response.error) throw toStatusError(response.error);
      if (!response.data?.data) throw new Error('Empty rename response');
      return response.data.data;
    },
    ...optimistic<{ threadId: string; title: string }>((data, vars) =>
      renameThreadInCache(data, vars.threadId, vars.title),
    ),
    onSuccess: (thread) => {
      // Keep the open conversation's title in step with the list.
      queryClient.setQueryData(
        copilotThreadQueryKey(businessId, branchId ?? '', thread.id),
        (current: { title: string } | undefined) => (current ? { ...current, title: thread.title } : current),
      );
    },
  });

  const remove = useMutation({
    mutationFn: async (threadId: string) => {
      const response = await businessService.deleteCopilotThread(businessId, branchId ?? '', threadId);
      if (response.error) throw toStatusError(response.error);
    },
    ...optimistic<string>((data, threadId) => removeThreadFromCache(data, threadId)),
    onSuccess: (_data, threadId) => {
      queryClient.removeQueries({ queryKey: copilotThreadQueryKey(businessId, branchId ?? '', threadId) });
    },
  });

  return { query, threads: flattenThreads(query.data), rename, remove };
}
