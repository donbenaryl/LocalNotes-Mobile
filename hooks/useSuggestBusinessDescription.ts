import { useMutation, useQueryClient } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import type { AiCreditsDAO, SuggestDescriptionDAO } from '@/http/business-api/types';
import {
  AI_CREDITS_QUERY_KEY,
  aiCreditsQueryKey,
  toStatusError,
} from '@/utils/aiCredits';
import { useSelectedBranch } from '@/hooks/useSelectedBranch';

/** Generate an AI business description draft for the selected paid branch. */
export function useSuggestBusinessDescription() {
  const queryClient = useQueryClient();
  const { businessId, branchId } = useSelectedBranch();
  const safeBranchId = branchId ?? '';

  return useMutation({
    mutationFn: async (): Promise<SuggestDescriptionDAO> => {
      if (!businessId || !safeBranchId) throw new Error('Missing business or branch');
      const response = await businessService.suggestBusinessDescription(businessId, safeBranchId);
      if (response.error) throw toStatusError(response.error);
      if (!response.data?.data) throw new Error('Empty suggest-description response');
      return response.data.data;
    },
    onSuccess: (result) => {
      if (!businessId || !safeBranchId) return;
      queryClient.setQueryData<AiCreditsDAO>(
        aiCreditsQueryKey(businessId, safeBranchId),
        result.credits,
      );
      void queryClient.invalidateQueries({
        queryKey: [AI_CREDITS_QUERY_KEY, businessId, safeBranchId, 'detail'],
      });
    },
    onError: (error) => {
      if (!businessId || !safeBranchId) return;
      const statusCode =
        error && typeof error === 'object' && 'statusCode' in error
          ? Number((error as { statusCode?: number }).statusCode)
          : undefined;
      if (statusCode === 429 || statusCode === 403) {
        void queryClient.invalidateQueries({
          queryKey: [AI_CREDITS_QUERY_KEY, businessId, safeBranchId],
        });
      }
    },
  });
}
