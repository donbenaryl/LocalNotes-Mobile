import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import businessService from '@/http/business-api/business.service';
import type { BusinessItemDAO, OpeningHours } from '@/http/business-api/types';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useToastStore } from '@/stores/useToastStore';

interface UpdateBranchHoursInput {
  branchId: string;
  openingHours: OpeningHours;
}

export function useUpdateBranchHours({
  onSuccess,
}: { onSuccess?: (data: BusinessItemDAO) => void } = {}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const refreshBusinessInfo = useBusinessStore((s) => s.refreshBusinessInfo);

  return useMutation({
    mutationFn: async ({ branchId, openingHours }: UpdateBranchHoursInput) => {
      const res = await businessService.updateBranch({
        id: branchId,
        opening_hours: openingHours,
      });
      if (res.error || !res.data?.data) {
        throw new Error(res.error?.message ?? t('editProfile.business.saveFailed'));
      }
      return res.data.data;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(['business-info', data.id], data);
      await refreshBusinessInfo();
      onSuccess?.(data);
      showToast({ type: 'success', message: 'Branch hours updated.' });
    },
    onError: (err: unknown) => {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : t('editProfile.business.saveFailed'),
      });
    },
  });
}
