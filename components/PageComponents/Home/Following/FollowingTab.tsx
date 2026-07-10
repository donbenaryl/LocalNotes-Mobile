import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { HomeChromeScrollView } from '@/components/ui/HomeChromeScrollView';
import { AlertCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { ActivityFeedCard } from '@/components/PageComponents/Profile/ActivityFeedCard';
import type { ActivityItemDAO } from '@/http/home-api/type';
import { FollowingListCard } from '@/components/PageComponents/Home/Following/FollowingListCard';
import {
  FollowingCreatorsRowSkeleton,
  FollowingListSkeleton,
} from '@/components/PageComponents/Home/Following/FollowingListSkeleton';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { useActivityFeed, useFollowingLists } from '@/hooks/useProfileList';
import { EmptyScreen } from '@/components/ui/EmptyScreen';
import { PageSectionTitle } from '@/components/ui/PageSectionTitle';

export function FollowingTab() {
  const { t } = useTranslation();

  const {
    followingList,
    isPending: followingLoading,
    isError: followingError,
  } = useFollowingLists();

  const {
    activityFeed,
    isPending: activityLoading,
    isError: activityError,
    refetch: refetchActivity,
  } = useActivityFeed();

  const today = new Date().toISOString().split('T')[0];

  const todayCreators = useMemo(() => {
    const seen = new Set<string>();
    return followingList
      .filter((l) => l.created_at.startsWith(today))
      .filter((l) => {
        if (seen.has(l.account.id)) return false;
        seen.add(l.account.id);
        return true;
      });
  }, [followingList, today]);

  const showNotesToday =
    !followingLoading && !followingError && todayCreators.length > 0;

  return (
    <HomeChromeScrollView showsVerticalScrollIndicator={false}>
      {followingLoading && <FollowingCreatorsRowSkeleton />}

      {showNotesToday && (
        <View className="mb-8">
          <Text className="mb-4 font-geist-semibold text-base text-ink dark:text-gray-100">
            {t('home.following.notesToday')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="gap-4"
          >
            <View className="flex-row gap-4">
              {todayCreators.map((item) => (
                <View key={item.account.id} className="items-center gap-2">
                  <Avatar
                    name={item.account.name}
                    src={item.account.profile_image ?? undefined}
                    size="md"
                    userId={item.account.id}
                  />
                  <Text
                    className="max-w-16 text-center font-geist text-xs text-ink dark:text-gray-200"
                    numberOfLines={1}
                  >
                    {item.account.name}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <View className="mx-4 mt-2">
        <PageSectionTitle className="mb-4">{t('home.following.latestActivity')}</PageSectionTitle>

        {activityLoading && <FollowingListSkeleton />}

        {activityError && !activityLoading && (
          <View className="items-center gap-3 py-8">
            <AlertCircle size={40} color="#EF4444" />
            <Text className="font-geist text-sm text-red-500">
              {t('profile.lists.error')}
            </Text>
            <LocalNotesButton
              label={t('profile.lists.retry')}
              onPress={() => void refetchActivity()}
              variant="dark"
              size="sm"
              isWidthFull={false}
            />
          </View>
        )}

        {!activityLoading && !activityError && activityFeed.length === 0 && (
          <EmptyScreen
            title={t('home.following.noActivity')}
            description={t('home.following.noActivityDescription')}
          />
        )}

        {!activityLoading && !activityError && activityFeed.length > 0 && (
          <View className="gap-4">
            {activityFeed.map((item) =>
              item.entity === 'list' ? (
                <FollowingListCard
                  key={item.id}
                  item={item as ActivityItemDAO & { entity: 'list' }}
                />
              ) : (
                <ActivityFeedCard key={item.id} item={item} />
              ),
            )}
          </View>
        )}
      </View>
    </HomeChromeScrollView>
  );
}
