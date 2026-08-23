import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { PageHeader } from '@/components/ui/PageHeader';
import { ListDetailModal } from '@/components/ui/ListDetailModal';
import { PickDetailModal } from '@/components/PageComponents/Profile/PickDetailModal';
import { NotificationRow } from '@/components/PageComponents/Notifications/NotificationRow';
import {
  filterNotifications,
  groupNotifications,
  useNotifications,
  type NotificationFilter,
} from '@/hooks/useNotifications';
import listService from '@/http/list-api/list.service';
import type { notificationItemDAO } from '@/http/account-api/types';
import type { ListItemPublic } from '@/http/list-api/types';
import { hydrateUserProfile } from '@/services/authBootstrap';

const FILTERS: { id: NotificationFilter; labelKey: string }[] = [
  { id: 'all', labelKey: 'notifications.chips.all' },
  { id: 'mentions', labelKey: 'notifications.chips.mentions' },
  { id: 'saves', labelKey: 'notifications.chips.saves' },
  { id: 'new_lists', labelKey: 'notifications.chips.newLists' },
  { id: 'offers', labelKey: 'notifications.chips.offers' },
];

const PICK_NOTIFICATION_TYPES = new Set([
  'FOLLOWED_USER_NEW_LIST_ITEM',
  'FOLLOWED_USER_LIST_ITEM_UPDATED',
]);

export default function NotificationsFeed() {
  const { t } = useTranslation();
  const router = useRouter();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [listModalId, setListModalId] = useState<string | null>(null);
  const [pickDetail, setPickDetail] = useState<ListItemPublic | null>(null);
  const [isOpeningPick, setIsOpeningPick] = useState(false);
  const {
    notifications,
    isPending,
    isError,
    refetch,
    isRefetching,
    markAsRead,
    markAllAsRead,
    isMarkingAllRead,
  } = useNotifications();

  const filtered = useMemo(
    () => filterNotifications(notifications, filter),
    [notifications, filter],
  );
  const { unread, read } = useMemo(
    () => groupNotifications(filtered),
    [filtered],
  );

  const hasUnread = notifications.some((item) => !item.is_read);
  const isEmpty = !isPending && filtered.length === 0;

  const handlePress = async (item: notificationItemDAO) => {
    if (!item.is_read) {
      markAsRead(item.id);
    }

    if (item.notification_type === 'BUSINESS_CLAIM_APPROVED') {
      await hydrateUserProfile();
      router.push('/(app)/(stack)/business-home' as never);
      return;
    }

    if (item.notification_type === 'BUSINESS_CLAIM_REJECTED') {
      router.push('/(app)/(stack)/claim-business' as never);
      return;
    }

    if (item.related_list?.id) {
      setListModalId(item.related_list.id);
      return;
    }

    if (
      PICK_NOTIFICATION_TYPES.has(item.notification_type) &&
      item.related_list_item?.id
    ) {
      if (isOpeningPick) return;
      setIsOpeningPick(true);
      try {
        const response = await listService.fetchListItem(
          item.related_list_item.id,
        );
        if (response.error || !response.data?.data) {
          throw new Error(response.error?.message ?? 'Pick not found');
        }
        setPickDetail(response.data.data);
      } catch (error) {
        console.error('Failed to load pick from notification:', error);
        if (item.related_account?.id) {
          router.push(`/profile/${item.related_account.id}` as never);
        }
      } finally {
        setIsOpeningPick(false);
      }
      return;
    }

    if (item.related_account?.id) {
      router.push(`/profile/${item.related_account.id}` as never);
    }
  };

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader
        title={t('notifications.title')}
        onBack={() => router.back()}
        rightChild={
          <TouchableOpacity
            onPress={() => markAllAsRead()}
            disabled={!hasUnread || isMarkingAllRead}
            hitSlop={8}
            className="cursor-pointer"
          >
            <Text
              className={`font-geist-semibold text-[12.5px] ${
                hasUnread && !isMarkingAllRead
                  ? 'text-brand'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {t('notifications.markAllAsRead')}
            </Text>
          </TouchableOpacity>
        }
      />

      <View className="border-b border-gray-100 dark:border-gray-800">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="flex-row items-center gap-1.5 px-4 py-2.5"
        >
          {FILTERS.map((chip) => (
            <CategoryChip
              key={chip.id}
              label={t(chip.labelKey)}
              isSelected={filter === chip.id}
              onPress={() => setFilter(chip.id)}
            />
          ))}
        </ScrollView>
      </View>

      {isPending && !isRefetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FF6B1A" />
        </View>
      ) : (
        <AppScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-10"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                void refetch();
              }}
              tintColor="#FF6B1A"
            />
          }
        >
          {isError ? (
            <Text className="px-4 py-8 text-center font-geist text-sm text-gray-500 dark:text-gray-400">
              {t('notifications.loadingError')}
            </Text>
          ) : null}

          {isEmpty && !isError ? (
            <Text className="px-6 py-12 text-center font-geist text-sm text-gray-500 dark:text-gray-400">
              {filter === 'all'
                ? t('notifications.empty')
                : t('notifications.emptyFiltered')}
            </Text>
          ) : null}

          {unread.length > 0 ? (
            <View>
              <View className="flex-row items-center gap-1.5 px-[18px] pb-2 pt-3.5">
                <Text className="font-geist-bold text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  {t('notifications.sections.new')}
                </Text>
                <View className="h-1.5 w-1.5 rounded-full bg-brand" />
              </View>
              {unread.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onPress={(pressed) => {
                    void handlePress(pressed);
                  }}
                />
              ))}
            </View>
          ) : null}

          {read.length > 0 ? (
            <View>
              <View className="px-[18px] pb-2 pt-3.5">
                <Text className="font-geist-bold text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  {t('notifications.sections.earlier')}
                </Text>
              </View>
              {read.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onPress={(pressed) => {
                    void handlePress(pressed);
                  }}
                />
              ))}
            </View>
          ) : null}
        </AppScrollView>
      )}

      <ListDetailModal
        visible={Boolean(listModalId)}
        onClose={() => setListModalId(null)}
        listId={listModalId}
      />

      {pickDetail ? (
        <PickDetailModal
          visible={Boolean(pickDetail)}
          onClose={() => setPickDetail(null)}
          data={pickDetail}
        />
      ) : null}
    </View>
  );
}
