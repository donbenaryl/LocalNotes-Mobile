import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import { FEED_STALE_TIME_MS } from '@/constants/queryCache';
import type { BusinessAlertsDAO } from '@/http/business-api/types';
import {
  businessAlertsQueryKey,
  markAlertReadInCache,
  removeAlertFromCache,
  restoreAlertsSnapshot,
} from '@/utils/businessAlerts';

interface UseBusinessAlertsOptions {
  businessId: string;
  isPaidMember: boolean;
}

/** Live smart alerts for a paid business, with optimistic read / dismiss. */
export function useBusinessAlerts({ businessId, isPaidMember }: UseBusinessAlertsOptions) {
  const queryClient = useQueryClient();
  const queryKey = businessAlertsQueryKey(businessId);

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<BusinessAlertsDAO> => {
      const response = await businessService.getAlerts(businessId);
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.data) throw new Error('Empty alerts response');
      return response.data.data;
    },
    enabled: Boolean(businessId) && isPaidMember,
    staleTime: FEED_STALE_TIME_MS,
  });

  const optimistic = (
    transform: (data: BusinessAlertsDAO | undefined, id: string) => BusinessAlertsDAO | undefined,
  ) => ({
    onMutate: async (alertId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const snapshot = queryClient.getQueryData<BusinessAlertsDAO>(queryKey);
      queryClient.setQueryData<BusinessAlertsDAO | undefined>(queryKey, (data) =>
        transform(data, alertId),
      );
      return { snapshot };
    },
    onError: (
      _error: unknown,
      _alertId: string,
      context: { snapshot?: BusinessAlertsDAO } | undefined,
    ) => {
      queryClient.setQueryData<BusinessAlertsDAO | undefined>(queryKey, (current) =>
        restoreAlertsSnapshot(current, context?.snapshot),
      );
    },
  });

  const markRead = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await businessService.markAlertRead(businessId, alertId);
      if (response.error) throw new Error(response.error.message);
    },
    ...optimistic((data, id) => markAlertReadInCache(data, id, new Date().toISOString())),
  });

  const dismiss = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await businessService.dismissAlert(businessId, alertId);
      if (response.error) throw new Error(response.error.message);
    },
    ...optimistic(removeAlertFromCache),
  });

  return { query, markRead, dismiss };
}
