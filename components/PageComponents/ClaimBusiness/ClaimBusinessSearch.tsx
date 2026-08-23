import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Building2, List } from 'lucide-react-native';
import { PageHeader } from '@/components/ui/PageHeader';
import { TextInput } from '@/components/ui/TextInput';
import { Tabs } from '@/components/ui/Tabs';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { PickPreviewImage } from '@/components/ui/PickPreviewImage';
import businessService from '@/http/business-api/business.service';
import type {
  BusinessLocation,
  ClaimableBusinessDAO,
  ClaimablePickDAO,
} from '@/http/business-api/types';
import { resolveImageUrl } from '@/utils/httpHelpers';
import { cn } from '@/utils/cn';

type SearchTab = 'businesses' | 'picks';

export type ClaimBusinessSearchProps = {
  initialTab?: SearchTab;
  embedded?: boolean;
  onClose?: () => void;
};

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function formatClaimLocationLabel(
  location?: BusinessLocation | null,
): string {
  if (!location) return '';
  return [location.city, location.region, location.country]
    .filter(Boolean)
    .join(', ');
}

function businessLocationLabel(item: ClaimableBusinessDAO): string {
  const branch = item.branches?.[0]?.location;
  return formatClaimLocationLabel(branch ?? item.location);
}

function pickLocationLabel(item: ClaimablePickDAO): string {
  const fromPick = formatClaimLocationLabel(item.location);
  if (fromPick) return fromPick;
  const branch = item.business?.branches?.[0]?.location;
  return formatClaimLocationLabel(branch ?? item.business?.location);
}

function pickImageUrl(item: ClaimablePickDAO): string {
  return (
    resolveImageUrl(item.images?.[0]?.url) ??
    resolveImageUrl(item.business?.logo) ??
    ''
  );
}

export default function ClaimBusinessSearch({
  initialTab: initialTabProp,
  embedded = false,
  onClose,
}: ClaimBusinessSearchProps = {}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab: SearchTab =
    initialTabProp ?? (params.tab === 'picks' ? 'picks' : 'businesses');

  const [activeTab, setActiveTab] = useState<SearchTab>(initialTab);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 350);
  const sheetMaxHeight = height * 0.85;

  const tabs = useMemo(
    () => [
      {
        id: 'businesses',
        label: t('claimBusiness.search.businessesTab'),
        icon: Building2,
      },
      {
        id: 'picks',
        label: t('claimBusiness.search.picksTab'),
        icon: List,
      },
    ],
    [t],
  );

  const businessesQuery = useInfiniteQuery({
    queryKey: ['claimable-businesses', debouncedQuery],
    enabled: activeTab === 'businesses',
    queryFn: async ({ pageParam }) => {
      const response = await businessService.searchClaimableBusinesses({
        query: debouncedQuery || undefined,
        page: pageParam,
      });
      if (response.error) throw new Error(response.error.message);
      return {
        items: response.data?.data ?? [],
        next: response.data?.pagination?.next ?? null,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => last.next ?? undefined,
  });

  const picksQuery = useInfiniteQuery({
    queryKey: ['claimable-picks', debouncedQuery],
    enabled: activeTab === 'picks',
    queryFn: async ({ pageParam }) => {
      const response = await businessService.searchClaimablePicks({
        query: debouncedQuery || undefined,
        page: pageParam,
      });
      if (response.error) throw new Error(response.error.message);
      return {
        items: response.data?.data ?? [],
        next: response.data?.pagination?.next ?? null,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => last.next ?? undefined,
  });

  const activeQuery =
    activeTab === 'businesses' ? businessesQuery : picksQuery;
  const businesses =
    businessesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const picks = picksQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const selectBusiness = (item: ClaimableBusinessDAO) => {
    onClose?.();
    router.push({
      pathname: '/(app)/(stack)/claim-business/form',
      params: {
        source: 'business',
        businessId: item.id,
        targetName: item.name,
        businessType: item.business_type ?? '',
        locationLabel: businessLocationLabel(item),
        logo: resolveImageUrl(item.logo) ?? '',
        contactEmail: item.contact_email ?? '',
        phoneNumber: item.phone_number ?? '',
      },
    });
  };

  const selectPick = (item: ClaimablePickDAO) => {
    const hasExistingBusiness = Boolean(item.business?.id);
    const biz = item.business;
    onClose?.();
    router.push({
      pathname: '/(app)/(stack)/claim-business/form',
      params: {
        source: 'pick',
        listItemId: item.id,
        targetName:
          item.name ??
          item.business?.name ??
          item.unverified_business?.name ??
          '',
        hasExistingBusiness: hasExistingBusiness ? 'true' : 'false',
        proposedName:
          item.unverified_business?.name ?? item.name ?? '',
        businessType: biz?.business_type ?? '',
        locationLabel: pickLocationLabel(item),
        logo: pickImageUrl(item),
        contactEmail: biz?.contact_email ?? '',
        phoneNumber: biz?.phone_number ?? '',
        businessId: biz?.id ?? '',
        proposedLocation: item.location
          ? JSON.stringify(item.location)
          : '',
      },
    });
  };

  const renderBusiness = ({
    item,
    index,
  }: {
    item: ClaimableBusinessDAO;
    index: number;
  }) => {
    const locationLabel = businessLocationLabel(item);
    return (
      <Pressable
        onPress={() => selectBusiness(item)}
        className="cursor-pointer flex-row items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800"
      >
        <PickPreviewImage
          imageUrl={resolveImageUrl(item.logo)}
          index={index}
        />
        <View className="min-w-0 flex-1">
          <Text className="font-geist-semibold text-[14px] text-ink dark:text-gray-100">
            {item.name}
          </Text>
          {item.business_type ? (
            <Text className="mt-0.5 font-geist text-[12px] text-gray-500 dark:text-gray-400">
              {item.business_type}
            </Text>
          ) : null}
          {locationLabel ? (
            <Text
              className="mt-0.5 font-geist text-[12px] text-gray-500 dark:text-gray-400"
              numberOfLines={1}
            >
              {locationLabel}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  const renderPick = ({
    item,
    index,
  }: {
    item: ClaimablePickDAO;
    index: number;
  }) => {
    const name =
      item.name ??
      item.business?.name ??
      item.unverified_business?.name ??
      '—';
    const badge = item.business
      ? t('claimBusiness.search.pickExisting')
      : t('claimBusiness.search.pickUnverified');
    const locationLabel = pickLocationLabel(item);

    return (
      <Pressable
        onPress={() => selectPick(item)}
        className="cursor-pointer flex-row items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800"
      >
        <PickPreviewImage imageUrl={pickImageUrl(item) || null} index={index} />
        <View className="min-w-0 flex-1">
          <Text className="font-geist-semibold text-[14px] text-ink dark:text-gray-100">
            {name}
          </Text>
          <Text className="mt-0.5 font-geist text-[12px] text-gray-500 dark:text-gray-400">
            {badge}
          </Text>
          {locationLabel ? (
            <Text
              className="mt-0.5 font-geist text-[12px] text-gray-500 dark:text-gray-400"
              numberOfLines={1}
            >
              {locationLabel}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  const listEmpty = () => {
    if (activeQuery.isPending) {
      return (
        <View className="items-center py-16">
          <ActivityIndicator color="#FF6B1A" />
        </View>
      );
    }
    if (activeQuery.isError) {
      return (
        <View className="items-center gap-3 px-4 py-12">
          <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
            {t('claimBusiness.search.loadError')}
          </Text>
          <LocalNotesButton
            label={t('claimBusiness.search.retry')}
            variant="light"
            size="sm"
            isWidthFull={false}
            onPress={() => {
              void activeQuery.refetch();
            }}
          />
        </View>
      );
    }
    return (
      <Text className="px-4 py-12 text-center font-geist text-sm text-gray-500 dark:text-gray-400">
        {t('claimBusiness.search.empty')}
      </Text>
    );
  };

  const padClass = embedded ? 'px-0' : 'px-4';

  return (
    <View
      className={cn(
        embedded ? '-mx-8' : 'flex-1 bg-page dark:bg-gray-900',
      )}
    >
      {!embedded ? (
        <PageHeader title={t('claimBusiness.search.title')} />
      ) : null}
      <View className={cn(padClass, 'pt-3')}>
        <TextInput
          placeholder={t('claimBusiness.search.placeholder')}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>
      <View className={cn(padClass, 'mt-3')}>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as SearchTab)}
          textClassName="text-[13px]"
        />
      </View>

      {activeTab === 'businesses' ? (
        <FlatList
          className={embedded ? undefined : 'flex-1'}
          style={embedded ? { maxHeight: sheetMaxHeight } : undefined}
          data={businesses}
          keyExtractor={(item) => item.id}
          renderItem={renderBusiness}
          ListEmptyComponent={listEmpty}
          onEndReached={() => {
            if (businessesQuery.hasNextPage && !businessesQuery.isFetchingNextPage) {
              void businessesQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            businessesQuery.isFetchingNextPage ? (
              <ActivityIndicator className="py-4" color="#FF6B1A" />
            ) : null
          }
        />
      ) : (
        <FlatList
          className={embedded ? undefined : 'flex-1'}
          style={embedded ? { maxHeight: sheetMaxHeight } : undefined}
          data={picks}
          keyExtractor={(item) => item.id}
          renderItem={renderPick}
          ListEmptyComponent={listEmpty}
          onEndReached={() => {
            if (picksQuery.hasNextPage && !picksQuery.isFetchingNextPage) {
              void picksQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            picksQuery.isFetchingNextPage ? (
              <ActivityIndicator className="py-4" color="#FF6B1A" />
            ) : null
          }
        />
      )}
    </View>
  );
}
