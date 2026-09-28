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
import { formatIsoDate, formatPeriodLabel, parseIsoDate } from '@/utils/dateIso';
import type {
  BusinessDiscoveryStatsDAO,
  StatsDateRangeParams,
} from '@/http/business-api/types';

type ToplineCounts = {
  views: number;
  saves: number;
  redeemed: number;
  lists: number;
};

const EMPTY_TOPLINE_COUNTS: ToplineCounts = { views: 0, saves: 0, redeemed: 0, lists: 0 };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getPreviousPeriod(dateFrom: string, dateTo: string): StatsDateRangeParams {
  const from = parseIsoDate(dateFrom);
  const to = parseIsoDate(dateTo);
  const lengthDays = Math.round((to.getTime() - from.getTime()) / MS_PER_DAY) + 1;
  const prevTo = new Date(from.getFullYear(), from.getMonth(), from.getDate() - 1);
  const prevFrom = new Date(
    prevTo.getFullYear(),
    prevTo.getMonth(),
    prevTo.getDate() - lengthDays + 1,
  );
  return { date_from: formatIsoDate(prevFrom), date_to: formatIsoDate(prevTo) };
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

async function fetchToplineCounts(
  businessId: string,
  range: StatsDateRangeParams,
): Promise<ToplineCounts> {
  const [views, saves, redeems, mentions] = await Promise.all([
    businessService.getViewsStats(businessId, range),
    businessService.getTotalListSavesStats(businessId, range),
    businessService.getRedeemStats(businessId, range),
    businessService.getMentionsStats(businessId, range),
  ]);
  const error = views.error ?? saves.error ?? redeems.error ?? mentions.error;
  if (error) throw new Error(error.message);
  return {
    views: views.data?.data?.total_views ?? 0,
    saves: saves.data?.data?.total_saves ?? 0,
    redeemed: redeems.data?.data?.total_redeems ?? 0,
    lists: mentions.data?.data?.total_mentions ?? 0,
  };
}

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

export type BusinessHomeDiscoveryChannelKey = keyof BusinessDiscoveryStatsDAO;

export type BusinessHomeDiscoveryChannel = {
  key: BusinessHomeDiscoveryChannelKey;
  count: number;
  percent: number;
};

export type BusinessHomeDiscovery = {
  channels: BusinessHomeDiscoveryChannel[];
  leading: BusinessHomeDiscoveryChannel | null;
};

const DISCOVERY_CHANNEL_ORDER: BusinessHomeDiscoveryChannelKey[] = [
  'search',
  'lists',
  'picks',
  'discover',
];

const EMPTY_DISCOVERY_STATS: BusinessDiscoveryStatsDAO = {
  search: 0,
  lists: 0,
  picks: 0,
  discover: 0,
};

/** Largest-remainder rounding so shares sum to exactly 100 when total > 0. */
function buildDiscovery(stats: BusinessDiscoveryStatsDAO): BusinessHomeDiscovery {
  const counts = DISCOVERY_CHANNEL_ORDER.map((key) => Math.max(0, stats[key] ?? 0));
  const total = counts.reduce((sum, n) => sum + n, 0);

  const percents = counts.map((n) => (total > 0 ? Math.floor((n / total) * 100) : 0));
  if (total > 0) {
    let remaining = 100 - percents.reduce((sum, n) => sum + n, 0);
    const byRemainder = counts
      .map((n, index) => ({ index, remainder: (n / total) * 100 - percents[index] }))
      .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
    for (const { index } of byRemainder) {
      if (remaining <= 0) break;
      percents[index] += 1;
      remaining -= 1;
    }
  }

  const channels = DISCOVERY_CHANNEL_ORDER.map((key, index) => ({
    key,
    count: counts[index],
    percent: percents[index],
  }));
  const leading =
    total > 0
      ? channels.reduce((best, channel) => (channel.count > best.count ? channel : best))
      : null;

  return { channels, leading };
}

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

  const previousDateRange = useMemo(
    () => getPreviousPeriod(dateFrom, dateTo),
    [dateFrom, dateTo],
  );

  const toplineQuery = useQuery({
    queryKey: ['business-home-topline', businessId, dateRange],
    enabled: Boolean(businessId),
    queryFn: () => fetchToplineCounts(businessId, dateRange),
  });

  const previousToplineQuery = useQuery({
    queryKey: ['business-home-topline', businessId, previousDateRange],
    enabled: Boolean(businessId),
    queryFn: () => fetchToplineCounts(businessId, previousDateRange),
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

  const discoveryQuery = useQuery({
    queryKey: ['business-home-discovery', businessId, dateRange],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const response = await businessService.getDiscoveryStats(businessId, dateRange);
      if (response.error) throw new Error(response.error.message);
      return response.data?.data ?? EMPTY_DISCOVERY_STATS;
    },
  });

  const discovery = useMemo(
    () => buildDiscovery(discoveryQuery.data ?? EMPTY_DISCOVERY_STATS),
    [discoveryQuery.data],
  );

  const topline = useMemo(() => {
    const current = toplineQuery.data ?? EMPTY_TOPLINE_COUNTS;
    const previous = previousToplineQuery.data ?? EMPTY_TOPLINE_COUNTS;
    return {
      views: formatCompactNumber(current.views),
      saves: formatCompactNumber(current.saves),
      redeemed: formatCompactNumber(current.redeemed),
      lists: formatCompactNumber(current.lists),
      viewsChange: percentChange(current.views, previous.views),
      savesChange: percentChange(current.saves, previous.saves),
      redeemedChange: percentChange(current.redeemed, previous.redeemed),
      listsChange: percentChange(current.lists, previous.lists),
    };
  }, [toplineQuery.data, previousToplineQuery.data]);

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
  const businessLogo = businessInfo?.logo ?? null;
  const locationName =
    selectedBranch?.name?.trim() ||
    selectedBranch?.location?.city ||
    '';
  const managerName = pickDisplayName(user?.fullName);
  const roleLabel = activeOwned?.role || 'Owner';

  const isLoading =
    !hasFetched ||
    (Boolean(businessId) &&
      (toplineQuery.isPending ||
        previousToplineQuery.isPending ||
        personalityQuery.isPending ||
        discoveryQuery.isPending));

  const refetchAll = async () => {
    await refreshBusinessInfo();
    await loadOwnedBusinesses();
    await Promise.all([
      toplineQuery.refetch(),
      previousToplineQuery.refetch(),
      personalityQuery.refetch(),
      discoveryQuery.refetch(),
    ]);
  };

  const togglePaidMember = () => setIsPaidMember((prev) => !prev);

  return {
    businessName,
    businessLogo,
    locationName,
    managerName,
    roleLabel,
    periodLabel,
    dateFrom,
    dateTo,
    onDateRangeChange,
    topline,
    discovery,
    personalityRows,
    locationRows,
    isPaidMember,
    togglePaidMember,
    isLoading,
    isRefetching:
      toplineQuery.isRefetching ||
      previousToplineQuery.isRefetching ||
      personalityQuery.isRefetching ||
      discoveryQuery.isRefetching,
    refetchAll,
  };
}
