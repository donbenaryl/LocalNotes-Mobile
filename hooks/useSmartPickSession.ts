import { useQuery } from '@tanstack/react-query';
import smartPickService from '@/http/smart-pick-api/smart-pick.services';
import type { DetailedConversation } from '@/http/smart-pick-api/types';

async function fetchSession(sessionId: string): Promise<DetailedConversation> {
  const response = await smartPickService.fetchDetailedConversations(sessionId);
  if (response.error) throw new Error(response.error.message);
  if (!response.data?.data) throw new Error('Smart Pick session not found');
  return response.data.data;
}

/** Loads a single past Smart Pick session — used by the read-only [id] history screen. */
export function useSmartPickSession(sessionId: string | undefined) {
  const query = useQuery({
    queryKey: ['smart-pick-session', sessionId],
    queryFn: () => fetchSession(sessionId as string),
    enabled: Boolean(sessionId),
  });

  return {
    conversation: query.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error?.message ?? null,
    refetch: async () => {
      await query.refetch();
    },
  };
}
