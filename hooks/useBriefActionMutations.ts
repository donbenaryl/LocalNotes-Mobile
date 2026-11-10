import { useMutation, useQueryClient } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import type { HttpServiceResolverDTO } from '@/http';
import type { BusinessBriefActionDAO } from '@/http/business-api/types';
import { businessWeeklyBriefQueryKey } from '@/hooks/useBusinessWeeklyBrief';

export function businessBriefActionsQueryKey(businessId: string) {
  return ['business-brief-actions', businessId] as const;
}

type Transition = (
  businessId: string,
  actionId: string,
) => HttpServiceResolverDTO<BusinessBriefActionDAO>;

function useBriefActionMutation(businessId: string, transition: Transition) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (actionId: string): Promise<BusinessBriefActionDAO> => {
      const response = await transition(businessId, actionId);
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.data) throw new Error('Empty brief action response');
      return response.data.data;
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: businessWeeklyBriefQueryKey(businessId) }),
        queryClient.invalidateQueries({ queryKey: businessBriefActionsQueryKey(businessId) }),
      ]),
  });
}

export function useStartBriefAction(businessId: string) {
  return useBriefActionMutation(businessId, (b, a) => businessService.startBriefAction(b, a));
}

export function useCompleteBriefAction(businessId: string) {
  return useBriefActionMutation(businessId, (b, a) => businessService.completeBriefAction(b, a));
}

export function useDismissBriefAction(businessId: string) {
  return useBriefActionMutation(businessId, (b, a) => businessService.dismissBriefAction(b, a));
}
