import { useMutation, useQueryClient } from '@tanstack/react-query';
import smartPickService from '@/http/smart-pick-api/smart-pick.services';
import type { ConversationRequest, DetailedConversation } from '@/http/smart-pick-api/types';

async function createConversation(dto: ConversationRequest): Promise<DetailedConversation> {
  const response = await smartPickService.makeConversations(dto);
  if (response.error) throw new Error(response.error.message ?? 'Failed to get recommendations');
  if (!response.data?.data) throw new Error('Failed to get recommendations');
  return response.data.data;
}

/** Submits the Smart Pick form. The POST response already contains the full
 * result set, so no follow-up GET is needed for a freshly created session. */
export function useCreateSmartPick() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['smart-pick-history'] });
    },
  });

  return {
    createSmartPick: mutation.mutateAsync,
    conversation: mutation.data ?? null,
    isCreating: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    reset: mutation.reset,
  };
}
