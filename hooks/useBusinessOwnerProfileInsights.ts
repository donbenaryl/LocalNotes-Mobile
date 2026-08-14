import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { isBusinessAccountType } from '@/utils/businessAccount';
import { getBusinessPersonalityLabel } from '@/utils/businessPersonalityLabels';

export type BusinessOwnerTopType = {
  label: string;
  color: string;
};

function startOfMonthIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

export function useBusinessOwnerProfileInsights(
  isOwnProfile: boolean,
  accountType: string | undefined,
) {
  const showBusinessSections =
    isOwnProfile && isBusinessAccountType(accountType);

  const businessInfo = useBusinessStore((s) => s.businessInfo);
  const businessId = useBusinessStore((s) => s.businessId);
  const hasFetched = useBusinessStore((s) => s.hasFetched);
  const loadBusinessInfo = useBusinessStore((s) => s.loadBusinessInfo);

  useEffect(() => {
    if (showBusinessSections && !hasFetched) {
      void loadBusinessInfo();
    }
  }, [showBusinessSections, hasFetched, loadBusinessInfo]);

  const monthFrom = useMemo(() => startOfMonthIsoDate(), []);

  const monthListsQuery = useQuery({
    queryKey: ['business-stats-lists-month', businessId, monthFrom],
    enabled: showBusinessSections && Boolean(businessId),
    queryFn: async () => {
      const response = await businessService.getListsStats(businessId, {
        date_from: monthFrom,
      });
      if (response.error) {
        throw new Error(response.error.message ?? 'Failed to load list stats');
      }
      return response.data?.pagination?.total ?? response.data?.data?.length ?? 0;
    },
  });

  const personalityQuery = useQuery({
    queryKey: ['business-stats-personality-colors', businessId],
    enabled: showBusinessSections && Boolean(businessId),
    queryFn: async () => {
      const response = await businessService.getPersonalityColorStats(businessId);
      if (response.error) {
        throw new Error(
          response.error.message ?? 'Failed to load personality stats',
        );
      }
      return response.data?.data ?? [];
    },
  });

  const topTypes: BusinessOwnerTopType[] = useMemo(() => {
    const rows = personalityQuery.data ?? [];
    return rows.slice(0, 2).map((row) => ({
      label: getBusinessPersonalityLabel(row.color_name),
      color: row.color,
    }));
  }, [personalityQuery.data]);

  return {
    showBusinessSections,
    listCount: businessInfo?.list_count ?? 0,
    monthDelta: monthListsQuery.data ?? 0,
    topTypes,
    isLoading:
      showBusinessSections &&
      Boolean(businessId) &&
      (monthListsQuery.isPending || personalityQuery.isPending),
  };
}
