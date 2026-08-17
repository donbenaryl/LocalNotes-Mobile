import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import businessService from '@/http/business-api/business.service';
import {
  BUSINESS_HOME_LOCATIONS_MOCK,
  type BusinessHomeLocationRow,
} from '@/constants/businessHomeMock';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatCompactNumber } from '@/utils/formatCompactNumber';
import { getBusinessPersonalityLabel } from '@/utils/businessPersonalityLabels';
import { formatIsoDate, formatPeriodLabel } from '@/utils/dateIso';

function pickDisplayName(fullName?: string | null): string {
  const trimmed = fullName?.trim();
  if (trimmed) return trimmed;
  return 'Owner';
}

export type BusinessHomePersonalityRow = {
  label: string;
  color: string;
  percentage: number;
};

export function useBusinessHomeData() {
  const user = useAuthStore((s) => s.user);
  const businessInfo = useBusinessStore((s) => s.businessInfo);
  const businessId = useBusinessStore((s) => s.businessId);
  const hasFetched = useBusinessStore((s) => s.hasFetched);
  const ownedBusinesses = useBusinessStore((s) => s.ownedBusinesses);
  const selectedBranchId = useBusinessStore((s) => s.selectedBranchId);
  const hasFetchedOwned = useBusinessStore((s) => s.hasFetchedOwned);
  const loadBusinessInfo = useBusinessStore((s) => s.loadBusinessInfo);
  const loadOwnedBusinesses = useBusinessStore((s) => s.loadOwnedBusinesses);
  const refreshBusinessInfo = useBusinessStore((s) => s.refreshBusinessInfo);

  const [isPaidMember, setIsPaidMember] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const today = new Date();
    return formatIsoDate(new Date(today.getFullYear(), today.getMonth(), 1));
  });
  const [dateTo, setDateTo] = useState(() => formatIsoDate(new Date()));

  useEffect(() => {
    if (!hasFetched) {
      void loadBusinessInfo();
    }
  }, [hasFetched, loadBusinessInfo]);

  useEffect(() => {
    if (!hasFetchedOwned) {
      void loadOwnedBusinesses();
    }
  }, [hasFetchedOwned, loadOwnedBusinesses]);

  const dateRange = useMemo(
    () => ({
      date_from: dateFrom,
      date_to: dateTo,
    }),
    [dateFrom, dateTo],
  );

  const periodLabel = useMemo(
    () => formatPeriodLabel(dateFrom, dateTo),
    [dateFrom, dateTo],
  );

  const onDateRangeChange = (range: { dateFrom: string; dateTo: string }) => {
    setDateFrom(range.dateFrom);
    setDateTo(range.dateTo);
  };

  const viewsQuery = useQuery({
    queryKey: ['business-home-views', businessId, dateRange],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const response = await businessService.getViewsStats(businessId, dateRange);
      if (response.error) throw new Error(response.error.message);
      return response.data?.data?.total_views ?? 0;
    },
  });

  const savesQuery = useQuery({
    queryKey: ['business-home-saves', businessId, dateRange],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const response = await businessService.getTotalListSavesStats(businessId, dateRange);
      if (response.error) throw new Error(response.error.message);
      return response.data?.data?.total_list_saves ?? 0;
    },
  });

  const listsQuery = useQuery({
    queryKey: ['business-home-lists', businessId, dateRange],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const response = await businessService.getListsStats(businessId, dateRange);
      if (response.error) throw new Error(response.error.message);
      return response.data?.pagination?.total ?? response.data?.data?.length ?? 0;
    },
  });

  const personalityQuery = useQuery({
    queryKey: ['business-home-personality', businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const response = await businessService.getPersonalityColorStats(businessId);
      if (response.error) throw new Error(response.error.message);
      return response.data?.data ?? [];
    },
  });

  const topline = useMemo(() => ({
    views: formatCompactNumber(viewsQuery.data ?? 0),
    saves: formatCompactNumber(savesQuery.data ?? 0),
    redeemed: '0',
    lists: formatCompactNumber(listsQuery.data ?? 0),
  }), [viewsQuery.data, savesQuery.data, listsQuery.data]);

  const personalityRows: BusinessHomePersonalityRow[] = useMemo(() => {
    const rows = personalityQuery.data ?? [];
    if (rows.length === 0) {
      return [
        { label: 'Curators', color: '#7C5CFF', percentage: 38 },
        { label: 'Explorers', color: '#FF6B1A', percentage: 31 },
        { label: 'Relaxed Locals', color: '#0F8B7E', percentage: 22 },
        { label: 'Connectors', color: '#E0417E', percentage: 9 },
      ];
    }
    return rows.map((row) => ({
      label: getBusinessPersonalityLabel(row.color_name),
      color: row.color,
      percentage: Math.round(row.percentage),
    }));
  }, [personalityQuery.data]);

  const locationRows: BusinessHomeLocationRow[] = useMemo(() => {
    const branches = businessInfo?.branches ?? [];
    if (branches.length === 0) return BUSINESS_HOME_LOCATIONS_MOCK;

    return branches.map((branch, index) => {
      const mock = BUSINESS_HOME_LOCATIONS_MOCK[index];
      return {
        name: branch.name,
        savesLabel: mock?.savesLabel ?? '—',
        highlight: mock?.highlight,
        isViewing: branch.id === selectedBranchId,
      };
    });
  }, [businessInfo?.branches, selectedBranchId]);

  const activeOwned =
    ownedBusinesses.find((item) => item.id === businessId) ??
    ownedBusinesses.find((item) => item.is_primary);

  const selectedBranch =
    businessInfo?.branches?.find((branch) => branch.id === selectedBranchId) ??
    activeOwned?.branches?.find((branch) => branch.id === selectedBranchId) ??
    businessInfo?.branches?.[0] ??
    activeOwned?.branches?.[0];

  const businessName = businessInfo?.name ?? activeOwned?.name ?? '';
  const locationName =
    selectedBranch?.name?.trim() ||
    selectedBranch?.location?.city ||
    '';
  const managerName = pickDisplayName(user?.fullName);
  const roleLabel = activeOwned?.role || 'Owner';

  const isLoading =
    !hasFetched ||
    (Boolean(businessId) &&
      (viewsQuery.isPending ||
        savesQuery.isPending ||
        listsQuery.isPending ||
        personalityQuery.isPending));

  const refetchAll = async () => {
    await refreshBusinessInfo();
    await loadOwnedBusinesses();
    await Promise.all([
      viewsQuery.refetch(),
      savesQuery.refetch(),
      listsQuery.refetch(),
      personalityQuery.refetch(),
    ]);
  };

  const togglePaidMember = () => setIsPaidMember((prev) => !prev);

  return {
    businessName,
    locationName,
    managerName,
    roleLabel,
    periodLabel,
    dateFrom,
    dateTo,
    onDateRangeChange,
    topline,
    personalityRows,
    locationRows,
    isPaidMember,
    togglePaidMember,
    isLoading,
    isRefetching:
      viewsQuery.isRefetching ||
      savesQuery.isRefetching ||
      listsQuery.isRefetching ||
      personalityQuery.isRefetching,
    refetchAll,
  };
}
