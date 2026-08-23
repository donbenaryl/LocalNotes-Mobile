import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Building2, ListChecks, ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { PageHeader } from '@/components/ui/PageHeader';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { DataList } from '@/components/ui/DataList';
import { Modal } from '@/components/ui/Modal';
import { PickPreviewImage } from '@/components/ui/PickPreviewImage';
import { WhiteBox } from '@/components/ui/WhiteBox';
import { ClaimStatusBadge } from '@/components/PageComponents/ClaimBusiness/ClaimStatusBadge';
import { ClaimDetailModal } from '@/components/PageComponents/ClaimBusiness/ClaimDetailModal';
import ClaimBusinessSearch from '@/components/PageComponents/ClaimBusiness/ClaimBusinessSearch';
import businessService from '@/http/business-api/business.service';
import { hydrateUserProfile } from '@/services/authBootstrap';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { resolveImageUrl } from '@/utils/httpHelpers';
import { formatRelativeTime } from '@/utils/time';
import type { BusinessClaimDAO } from '@/http/business-api/types';

type SearchTab = 'businesses' | 'picks';

function SourceChooserCard({
  icon: Icon,
  title,
  subtitle,
  onPress,
}: {
  icon: typeof Building2;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#F3F4F6' : '#141413';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="mb-3 cursor-pointer"
    >
      <WhiteBox className="p-4">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-soft dark:bg-gray-700">
            <Icon size={18} color={iconColor} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-geist-bold text-[15px] text-ink dark:text-gray-100">
              {title}
            </Text>
            <Text className="mt-1 font-geist text-[12.5px] leading-5 text-gray-500 dark:text-gray-400">
              {subtitle}
            </Text>
          </View>
          <ChevronRight
            size={18}
            color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
          />
        </View>
      </WhiteBox>
    </Pressable>
  );
}

function ClaimRow({
  claim,
  index,
  onPress,
}: {
  claim: BusinessClaimDAO;
  index: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const name = claim.target_name || t('claimBusiness.start.title');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      className="cursor-pointer flex-row items-start gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800"
    >
      <PickPreviewImage
        imageUrl={
          resolveImageUrl(claim.preview_image ?? claim.business?.logo) ?? null
        }
        index={index}
      />
      <View className="min-w-0 flex-1 flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text
            className="font-geist-semibold text-[14px] text-ink dark:text-gray-100"
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text className="mt-0.5 font-geist text-[11px] text-gray-500 dark:text-gray-400">
            {formatRelativeTime(claim.created_at)}
          </Text>
          {claim.status === 'Rejected' && claim.rejection_note ? (
            <Text className="mt-1 font-geist text-[12px] text-rose-600 dark:text-rose-400">
              {t('claimBusiness.start.rejectedNote', {
                note: claim.rejection_note,
              })}
            </Text>
          ) : null}
        </View>
        <ClaimStatusBadge status={claim.status} />
      </View>
    </Pressable>
  );
}

export default function ClaimBusinessStart() {
  const { t } = useTranslation();
  const [selectedClaim, setSelectedClaim] = useState<BusinessClaimDAO | null>(
    null,
  );
  const [searchModalTab, setSearchModalTab] = useState<SearchTab | null>(null);

  const claimsQuery = useQuery({
    queryKey: ['my-business-claims'],
    queryFn: async () => {
      const response = await businessService.fetchMyBusinessClaims();
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data?.data ?? [];
    },
  });

  const onRefresh = useCallback(async () => {
    const result = await claimsQuery.refetch();
    const claims = result.data ?? [];
    if (claims.some((claim) => claim.status === 'Approved')) {
      await hydrateUserProfile();
      await useBusinessStore.getState().refreshBusinessInfo();
    }
  }, [claimsQuery]);

  const claims = claimsQuery.data ?? [];

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader title={t('claimBusiness.start.title')} />
      <AppScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-10 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={claimsQuery.isRefetching && !claimsQuery.isPending}
            onRefresh={() => {
              void onRefresh();
            }}
            tintColor="#FF6B1A"
          />
        }
      >
        <SourceChooserCard
          icon={Building2}
          title={t('claimBusiness.start.findExisting')}
          subtitle={t('claimBusiness.start.findExistingSub')}
          onPress={() => setSearchModalTab('businesses')}
        />
        <SourceChooserCard
          icon={ListChecks}
          title={t('claimBusiness.start.claimFromPick')}
          subtitle={t('claimBusiness.start.claimFromPickSub')}
          onPress={() => setSearchModalTab('picks')}
        />

        <Text className="mb-2 mt-4 font-geist-semibold text-[12px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {t('claimBusiness.start.yourClaims')}
        </Text>

        {claimsQuery.isPending ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#FF6B1A" />
          </View>
        ) : claimsQuery.isError ? (
          <View className="items-center gap-3 py-8">
            <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
              {t('claimBusiness.start.loadError')}
            </Text>
            <LocalNotesButton
              label={t('claimBusiness.start.retry')}
              variant="light"
              size="sm"
              isWidthFull={false}
              onPress={() => {
                void claimsQuery.refetch();
              }}
            />
          </View>
        ) : claims.length === 0 ? (
          <Text className="py-6 font-geist text-sm text-gray-500 dark:text-gray-400">
            {t('claimBusiness.start.noClaims')}
          </Text>
        ) : (
          <DataList>
            {claims.map((claim, index) => (
              <ClaimRow
                key={claim.id}
                claim={claim}
                index={index}
                onPress={() => setSelectedClaim(claim)}
              />
            ))}
          </DataList>
        )}
      </AppScrollView>

      <ClaimDetailModal
        visible={selectedClaim != null}
        claim={selectedClaim}
        onClose={() => setSelectedClaim(null)}
      />

      <Modal
        visible={searchModalTab != null}
        onClose={() => setSearchModalTab(null)}
        position="bottom"
        title={t('claimBusiness.search.title')}
        avoidKeyboard={false}
      >
        {searchModalTab ? (
          <ClaimBusinessSearch
            key={searchModalTab}
            embedded
            initialTab={searchModalTab}
            onClose={() => setSearchModalTab(null)}
          />
        ) : null}
      </Modal>
    </View>
  );
}
