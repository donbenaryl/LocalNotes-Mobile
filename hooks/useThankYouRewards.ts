import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import type { ThankYouSendDTO } from '@/http/business-api/types';
import { useBusinessStore } from '@/stores/useBusinessStore';

export const THANK_YOU_ELIGIBLE_QUERY_KEY = 'thank-you-eligible';

export function useThankYouEligible(enabled = true) {
  const businessId = useBusinessStore((s) => s.businessId);

  return useQuery({
    queryKey: [THANK_YOU_ELIGIBLE_QUERY_KEY, businessId],
    enabled: enabled && Boolean(businessId),
    queryFn: async () => {
      const response = await businessService.getThankYouEligible();
      if (response.error) {
        throw new Error(response.error.message || 'Failed to load eligible recipients.');
      }
      return (
        response.data?.data ?? {
          count: 0,
          recipients: [],
        }
      );
    },
  });
}

export function useSendThankYouRewards() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((s) => s.businessId);

  return useMutation({
    mutationFn: async (dto: ThankYouSendDTO) => {
      const response = await businessService.sendThankYouRewards(dto);
      if (response.error) {
        throw new Error(response.error.message || 'Failed to send thank-you rewards.');
      }
      return response.data?.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [THANK_YOU_ELIGIBLE_QUERY_KEY, businessId],
      });
    },
  });
}
