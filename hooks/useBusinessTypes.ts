import { useQuery } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import type { BusinessTypeDAO } from '@/http/business-api/types';

export function useBusinessTypes({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['business-types'],
    queryFn: async (): Promise<BusinessTypeDAO[]> => {
      const res = await businessService.fetchBusinessTypes();
      return res.data?.data ?? [];
    },
    enabled,
  });
}
