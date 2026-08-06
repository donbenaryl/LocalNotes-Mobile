import { useQuery } from '@tanstack/react-query';
import smartPickService from '@/http/smart-pick-api/smart-pick.services';
import type { PreviousConversation } from '@/http/smart-pick-api/types';
import { FEED_STALE_TIME_MS } from '@/constants/queryCache';

async function fetchHistory(): Promise<PreviousConversation[]> {
  const response = await smartPickService.fetchConversations();
  if (response.error) throw new Error(response.error.message);
  return response.data?.data ?? [];
}

export function useSmartPickHistory() {
  const query = useQuery({
    queryKey: ['smart-pick-history'],
    queryFn: fetchHistory,
    staleTime: FEED_STALE_TIME_MS,
  });

  return {
    conversations: query.data ?? [],
    isPending: query.isPending && query.data === undefined,
    isError: query.isError,
    error: query.error?.message ?? null,
    refetch: async () => {
      await query.refetch();
    },
  };
}
