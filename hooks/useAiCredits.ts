import { useQuery } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import { FEED_STALE_TIME_MS } from '@/constants/queryCache';
import type { AiCreditsDAO } from '@/http/business-api/types';
import {
  aiCreditsQueryKey,
  isAiCreditsEnabled,
  isCreditsNotEntitledError,
  toStatusError,
} from '@/utils/aiCredits';
import { useSelectedBranch } from '@/hooks/useSelectedBranch';

interface UseAiCreditsOptions {
  /** Business Home passes its `isPaidMember` (which honours the `__DEV__` toggle). */
  isPaid?: boolean;
}

/** AI credits balance of the selected paid branch. Disabled with no branch or an unpaid branch. */
export function useAiCredits(options: UseAiCreditsOptions = {}) {
  const branch = useSelectedBranch();
  const isPaid = options.isPaid ?? branch.isPaid;
  const { businessId, branchId } = branch;

  return useQuery({
    queryKey: aiCreditsQueryKey(businessId, branchId ?? ''),
    queryFn: async (): Promise<AiCreditsDAO> => {
      const response = await businessService.getAiCredits(businessId, branchId ?? '');
      if (response.error) throw toStatusError(response.error);
      if (!response.data?.data) throw new Error('Empty AI credits response');
      return response.data.data;
    },
    enabled: isAiCreditsEnabled({ businessId, branchId, isPaid }),
    staleTime: FEED_STALE_TIME_MS,
    // A 403 means the branch is not paid: retrying cannot help.
    retry: (failureCount, error) => !isCreditsNotEntitledError(error) && failureCount < 2,
  });
}
