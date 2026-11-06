import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import type { AiCreditsDetailDAO } from '@/http/business-api/types';
import {
  aiCreditsDetailQueryKey,
  isAiCreditsEnabled,
  isCreditsNotEntitledError,
  toStatusError,
} from '@/utils/aiCredits';
import { useSelectedBranch } from '@/hooks/useSelectedBranch';

/**
 * Usage-page data (`?detail=1`). Shares the `['business-ai-credits', ...]` prefix with the light
 * query, so one invalidation refreshes both. Always refetches on mount and when the screen
 * regains focus (the pool changes while the user is chatting).
 */
export function useAiCreditsDetail(options: { isPaid?: boolean } = {}) {
  const branch = useSelectedBranch();
  const isPaid = options.isPaid ?? branch.isPaid;
  const { businessId, branchId } = branch;
  const enabled = isAiCreditsEnabled({ businessId, branchId, isPaid });

  const query = useQuery({
    queryKey: aiCreditsDetailQueryKey(businessId, branchId ?? ''),
    queryFn: async (): Promise<AiCreditsDetailDAO> => {
      const response = await businessService.getAiCreditsDetail(businessId, branchId ?? '');
      if (response.error) throw toStatusError(response.error);
      if (!response.data?.data) throw new Error('Empty AI credits detail response');
      return response.data.data;
    },
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: (failureCount, error) => !isCreditsNotEntitledError(error) && failureCount < 2,
  });

  const { refetch } = query;
  const hasFocusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      // The first focus is the mount, which `refetchOnMount: 'always'` already covers.
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }
      if (enabled) void refetch();
    }, [enabled, refetch]),
  );

  return query;
}
